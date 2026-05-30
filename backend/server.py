"""The Muslim World — FastAPI backend (migrated from Express + PostgreSQL)."""
from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Any, Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import Body, Depends, FastAPI, HTTPException, Path as PathParam, Request, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

# ----------------------------------------------------------------------------
# Config & DB
# ----------------------------------------------------------------------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").lower()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_DAYS = 30

SEED_FILE = Path(__file__).resolve().parent / "seed_data.json"

mongo_client: AsyncIOMotorClient | None = None
db = None


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": _now() + timedelta(days=ACCESS_TOKEN_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def is_admin(email: str) -> bool:
    return bool(ADMIN_EMAIL) and email.lower() == ADMIN_EMAIL


def serialize_user(user_doc: dict) -> dict:
    return {
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "displayName": user_doc["displayName"],
        "isAdmin": is_admin(user_doc["email"]),
    }


def serialize_site_summary(s: dict) -> dict:
    return {
        "id": s["id"],
        "name": s["name"],
        "arabicName": s["arabicName"],
        "region": s["region"],
        "country": s["country"],
        "latitude": s["latitude"],
        "longitude": s["longitude"],
        "category": s["category"],
        "shortDescription": s["shortDescription"],
        "yearFounded": s.get("yearFounded"),
        "significance": s["significance"],
        "isFeatured": bool(s.get("isFeatured", False)),
        "imageUrl": s.get("imageUrl"),
        "modelUrl": s.get("modelUrl"),
        "eidPrayer": bool(s.get("eidPrayer", False)),
        "ramadanVisit": bool(s.get("ramadanVisit", False)),
        "jumaPrayer": bool(s.get("jumaPrayer", False)),
    }


def serialize_site_detail(s: dict) -> dict:
    base = serialize_site_summary(s)
    base.update(
        {
            "fullDescription": s["fullDescription"],
            "architecturalStyle": s.get("architecturalStyle"),
            "capacity": s.get("capacity"),
            "areaSqm": s.get("areaSqm"),
            "dualUse": s.get("dualUse"),
            "sect": s.get("sect"),
            "cameraPosition": s.get("cameraPosition"),
            "cameraTarget": s.get("cameraTarget"),
            "cameraLocked": bool(s.get("cameraLocked", False)),
        }
    )
    return base


def serialize_hotspot(h: dict) -> dict:
    return {
        "id": h["id"],
        "siteId": h["siteId"],
        "label": h["label"],
        "description": h["description"],
        "positionX": h["positionX"],
        "positionY": h["positionY"],
        "positionZ": h["positionZ"],
        "arabicTerm": h.get("arabicTerm"),
        "historicalPeriod": h.get("historicalPeriod"),
        "imageUrl": h.get("imageUrl"),
    }


# ----------------------------------------------------------------------------
# Seeding
# ----------------------------------------------------------------------------
async def seed_sites_and_hotspots() -> None:
    """Seed sites/hotspots from seed_data.json if collections are empty."""
    sites_count = await db.sites.count_documents({})
    if sites_count > 0:
        return
    if not SEED_FILE.exists():
        print(f"WARN: seed file {SEED_FILE} missing — skipping seed")
        return
    data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    sites = data.get("sites", [])
    hotspots = data.get("hotspots", [])
    # Stamp createdAt where missing
    for s in sites:
        if not s.get("createdAt"):
            s["createdAt"] = _now().isoformat()
    if sites:
        await db.sites.insert_many(sites)
    if hotspots:
        await db.hotspots.insert_many(hotspots)
    print(f"Seeded {len(sites)} sites and {len(hotspots)} hotspots")


async def ensure_indexes_and_admin() -> None:
    await db.users.create_index("email", unique=True)
    await db.sites.create_index("id", unique=True)
    await db.sites.create_index("region")
    await db.sites.create_index("isFeatured")
    await db.hotspots.create_index("id", unique=True)
    await db.hotspots.create_index("siteId")
    await db.user_site_logs.create_index([("userId", 1), ("siteId", 1)], unique=True)
    await db.collections.create_index([("userId", 1), ("siteId", 1)], unique=True)
    await db.counters.create_index("_id")

    # Seed admin if ADMIN_EMAIL set and not already present
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if ADMIN_EMAIL and admin_password:
        existing = await db.users.find_one({"email": ADMIN_EMAIL})
        if not existing:
            await db.users.insert_one(
                {
                    "email": ADMIN_EMAIL,
                    "passwordHash": hash_password(admin_password),
                    "displayName": "Admin",
                    "createdAt": _now(),
                }
            )
            print(f"Seeded admin user {ADMIN_EMAIL}")
        elif not verify_password(admin_password, existing["passwordHash"]):
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"passwordHash": hash_password(admin_password)}},
            )


async def next_sequence(name: str) -> int:
    res = await db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return res["seq"]


# ----------------------------------------------------------------------------
# Lifespan
# ----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    global mongo_client, db
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    await ensure_indexes_and_admin()
    await seed_sites_and_hotspots()
    # Bring counters in sync with seeded max IDs
    max_site = await db.sites.find_one(sort=[("id", -1)])
    if max_site:
        await db.counters.update_one(
            {"_id": "sites"},
            {"$max": {"seq": max_site["id"]}},
            upsert=True,
        )
    max_hot = await db.hotspots.find_one(sort=[("id", -1)])
    if max_hot:
        await db.counters.update_one(
            {"_id": "hotspots"},
            {"$max": {"seq": max_hot["id"]}},
            upsert=True,
        )
    yield
    mongo_client.close()


app = FastAPI(title="The Muslim World API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------------
# Auth dependencies
# ----------------------------------------------------------------------------
async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token: Optional[str] = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    try:
        oid = ObjectId(payload["sub"])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


CurrentUser = Annotated[dict, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> dict:
    if not is_admin(user["email"]):
        raise HTTPException(status_code=403, detail="Admin only")
    return user


AdminUser = Annotated[dict, Depends(require_admin)]


# ----------------------------------------------------------------------------
# Models
# ----------------------------------------------------------------------------
class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    displayName: str = Field(min_length=1, max_length=80)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class LogBody(BaseModel):
    visited: Optional[bool] = None
    prayed: Optional[bool] = None


class UpdateSiteBody(BaseModel):
    name: Optional[str] = None
    arabicName: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    shortDescription: Optional[str] = None
    fullDescription: Optional[str] = None
    yearFounded: Optional[str] = None
    significance: Optional[str] = None
    isFeatured: Optional[bool] = None
    imageUrl: Optional[str] = None
    modelUrl: Optional[str] = None
    architecturalStyle: Optional[str] = None
    capacity: Optional[int] = None
    areaSqm: Optional[int] = None
    dualUse: Optional[str] = None
    eidPrayer: Optional[bool] = None
    ramadanVisit: Optional[bool] = None
    jumaPrayer: Optional[bool] = None
    sect: Optional[str] = None
    cameraPosition: Optional[str] = None
    cameraTarget: Optional[str] = None
    cameraLocked: Optional[bool] = None


class CreateHotspotBody(BaseModel):
    label: str = ""
    description: str = ""
    positionX: float
    positionY: float
    positionZ: float
    arabicTerm: Optional[str] = None
    historicalPeriod: Optional[str] = None


# ----------------------------------------------------------------------------
# Health
# ----------------------------------------------------------------------------
@app.get("/api/healthz")
async def healthz() -> dict:
    return {"status": "ok"}


# ----------------------------------------------------------------------------
# Auth routes
# ----------------------------------------------------------------------------
@app.post("/api/auth/register", status_code=201)
async def register(body: RegisterBody):
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already in use")
    doc = {
        "email": email,
        "passwordHash": hash_password(body.password),
        "displayName": body.displayName,
        "createdAt": _now(),
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    token = create_access_token(str(res.inserted_id), email)
    return {**serialize_user(doc), "token": token}


@app.post("/api/auth/login")
async def login(body: LoginBody):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    return {**serialize_user(user), "token": token}


@app.post("/api/auth/logout")
async def logout():
    # Stateless JWT — client just discards the token
    return {"ok": True}


@app.get("/api/auth/me")
async def me(user: CurrentUser):
    return serialize_user(user)


@app.get("/api/auth/logs")
async def list_logs(user: CurrentUser):
    cursor = db.user_site_logs.find({"userId": str(user["_id"])})
    rows = []
    async for doc in cursor:
        rows.append(
            {
                "id": str(doc["_id"]),
                "userId": doc["userId"],
                "siteId": doc["siteId"],
                "visited": bool(doc.get("visited", False)),
                "prayed": bool(doc.get("prayed", False)),
                "updatedAt": doc.get("updatedAt").isoformat() if doc.get("updatedAt") else None,
            }
        )
    return rows


@app.post("/api/auth/logs/{site_id}")
async def upsert_log(site_id: int, body: LogBody, user: CurrentUser):
    update_fields: dict[str, Any] = {"updatedAt": _now()}
    if body.visited is not None:
        update_fields["visited"] = body.visited
    if body.prayed is not None:
        update_fields["prayed"] = body.prayed
    set_on_insert = {
        "userId": str(user["_id"]),
        "siteId": site_id,
        "visited": body.visited if body.visited is not None else False,
        "prayed": body.prayed if body.prayed is not None else False,
    }
    # Don't double-set fields between $set and $setOnInsert
    for k in list(set_on_insert.keys()):
        if k in update_fields:
            del set_on_insert[k]
    await db.user_site_logs.update_one(
        {"userId": str(user["_id"]), "siteId": site_id},
        {"$set": update_fields, "$setOnInsert": set_on_insert},
        upsert=True,
    )
    doc = await db.user_site_logs.find_one(
        {"userId": str(user["_id"]), "siteId": site_id}
    )
    return {
        "id": str(doc["_id"]),
        "userId": doc["userId"],
        "siteId": doc["siteId"],
        "visited": bool(doc.get("visited", False)),
        "prayed": bool(doc.get("prayed", False)),
        "updatedAt": doc["updatedAt"].isoformat() if doc.get("updatedAt") else None,
    }


# ----------------------------------------------------------------------------
# Collections
# ----------------------------------------------------------------------------
@app.get("/api/collections")
async def list_collections(user: CurrentUser):
    cursor = db.collections.find({"userId": str(user["_id"])})
    return [doc["siteId"] async for doc in cursor]


@app.post("/api/collections/{site_id}")
async def add_collection(site_id: int, user: CurrentUser):
    await db.collections.update_one(
        {"userId": str(user["_id"]), "siteId": site_id},
        {"$setOnInsert": {"userId": str(user["_id"]), "siteId": site_id, "savedAt": _now()}},
        upsert=True,
    )
    return {"saved": True}


@app.delete("/api/collections/{site_id}")
async def delete_collection(site_id: int, user: CurrentUser):
    await db.collections.delete_one({"userId": str(user["_id"]), "siteId": site_id})
    return {"saved": False}


# ----------------------------------------------------------------------------
# Sites routes
# ----------------------------------------------------------------------------
@app.get("/api/sites")
async def list_sites():
    cursor = db.sites.find({}, {"_id": 0}).sort("name", 1)
    return [serialize_site_summary(s) async for s in cursor]


@app.get("/api/sites/featured")
async def list_featured_sites():
    cursor = db.sites.find({"isFeatured": True}, {"_id": 0}).sort("name", 1)
    return [serialize_site_summary(s) async for s in cursor]


@app.get("/api/sites/by-region")
async def list_sites_by_region():
    cursor = db.sites.find({}, {"_id": 0}).sort([("region", 1), ("name", 1)])
    grouped: dict[str, list[dict]] = {}
    async for s in cursor:
        grouped.setdefault(s["region"], []).append(serialize_site_summary(s))
    return [
        {"region": region, "count": len(items), "sites": items}
        for region, items in grouped.items()
    ]


@app.get("/api/sites/{site_id}")
async def get_site(site_id: int):
    site = await db.sites.find_one({"id": site_id}, {"_id": 0})
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    hotspots_cursor = db.hotspots.find({"siteId": site_id}, {"_id": 0})
    hotspots = [serialize_hotspot(h) async for h in hotspots_cursor]
    return {**serialize_site_detail(site), "hotspots": hotspots}


@app.patch("/api/sites/{site_id}")
async def update_site(site_id: int, body: UpdateSiteBody, _admin: AdminUser):
    site = await db.sites.find_one({"id": site_id}, {"_id": 0})
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if updates:
        await db.sites.update_one({"id": site_id}, {"$set": updates})
    site = await db.sites.find_one({"id": site_id}, {"_id": 0})
    hotspots_cursor = db.hotspots.find({"siteId": site_id}, {"_id": 0})
    hotspots = [serialize_hotspot(h) async for h in hotspots_cursor]
    return {**serialize_site_detail(site), "hotspots": hotspots}


@app.get("/api/sites/{site_id}/hotspots")
async def list_hotspots(site_id: int):
    cursor = db.hotspots.find({"siteId": site_id}, {"_id": 0})
    return [serialize_hotspot(h) async for h in cursor]


@app.post("/api/sites/{site_id}/hotspots", status_code=201)
async def create_hotspot(site_id: int, body: CreateHotspotBody, _admin: AdminUser):
    site = await db.sites.find_one({"id": site_id})
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    new_id = await next_sequence("hotspots")
    doc = {
        "id": new_id,
        "siteId": site_id,
        "label": body.label,
        "description": body.description,
        "positionX": body.positionX,
        "positionY": body.positionY,
        "positionZ": body.positionZ,
        "arabicTerm": body.arabicTerm,
        "historicalPeriod": body.historicalPeriod,
        "imageUrl": None,
    }
    await db.hotspots.insert_one(doc)
    doc.pop("_id", None)
    return serialize_hotspot(doc)


@app.delete("/api/sites/{site_id}/hotspots/{hotspot_id}")
async def delete_hotspot(site_id: int, hotspot_id: int, _admin: AdminUser):
    await db.hotspots.delete_one({"id": hotspot_id, "siteId": site_id})
    return {"ok": True}
