"""Backend regression tests for The Muslim World FastAPI app."""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env contents loader
    import pathlib
    env_path = pathlib.Path("/app/frontend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@muslimworld.app"
ADMIN_PASSWORD = "Admin@MuslimWorld2026"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("isAdmin") is True
    return data["token"]


@pytest.fixture(scope="session")
def user_credentials():
    return {
        "email": f"test_user_{uuid.uuid4().hex[:10]}@example.com",
        "password": "TestPass1234",
        "displayName": "Test User",
    }


@pytest.fixture(scope="session")
def user_token(session, user_credentials):
    r = session.post(f"{API}/auth/register", json=user_credentials)
    assert r.status_code == 201, f"Register failed: {r.status_code} {r.text}"
    return r.json()["token"]


def auth_h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Health ----------
class TestHealth:
    def test_healthz(self, session):
        r = session.get(f"{API}/healthz")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}


# ---------- Sites ----------
class TestSites:
    def test_list_sites_count(self, session):
        r = session.get(f"{API}/sites")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 52, f"Expected 52 sites, got {len(data)}"
        first = data[0]
        for k in ["id", "name", "arabicName", "region", "latitude", "longitude", "category", "isFeatured", "modelUrl", "imageUrl"]:
            assert k in first, f"Missing key {k} in site summary"

    def test_featured_sites(self, session):
        r = session.get(f"{API}/sites/featured")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 13, f"Expected 13 featured sites, got {len(data)}"
        assert all(s["isFeatured"] is True for s in data)

    def test_sites_by_region(self, session):
        r = session.get(f"{API}/sites/by-region")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 12, f"Expected 12 regions, got {len(data)}"
        regions = {g["region"]: g["count"] for g in data}
        assert regions.get("Anatolia") == 2
        assert regions.get("Arabian Peninsula") == 29
        total = sum(g["count"] for g in data)
        assert total == 52

    def test_get_site_1_haram(self, session):
        r = session.get(f"{API}/sites/1")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == 1
        assert "Haram" in data["name"] or "Haram" in data.get("arabicName", "")
        assert "hotspots" in data
        assert len(data["hotspots"]) == 3

    def test_get_site_4_dome(self, session):
        r = session.get(f"{API}/sites/4")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == 4
        assert "Dome" in data["name"] or "Rock" in data["name"]
        assert len(data["hotspots"]) == 3

    def test_get_site_not_found(self, session):
        r = session.get(f"{API}/sites/9999")
        assert r.status_code == 404

    def test_list_hotspots_for_site(self, session):
        r = session.get(f"{API}/sites/1/hotspots")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 3


# ---------- Auth ----------
class TestAuth:
    def test_register_new_user(self, session):
        email = f"test_reg_{uuid.uuid4().hex[:8]}@example.com"
        r = session.post(f"{API}/auth/register", json={
            "email": email, "password": "Password1234", "displayName": "Reg User"
        })
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == email
        assert "token" in data and len(data["token"]) > 10
        assert data["isAdmin"] is False

    def test_register_duplicate(self, session, user_credentials, user_token):
        r = session.post(f"{API}/auth/register", json=user_credentials)
        assert r.status_code == 409

    def test_register_short_password(self, session):
        r = session.post(f"{API}/auth/register", json={
            "email": f"short_{uuid.uuid4().hex[:6]}@x.com", "password": "abc", "displayName": "x"
        })
        assert r.status_code in (400, 422)

    def test_login_admin_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["isAdmin"] is True
        assert "token" in d

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-password"})
        assert r.status_code == 401

    def test_me_with_token(self, session, user_token, user_credentials):
        r = session.get(f"{API}/auth/me", headers=auth_h(user_token))
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == user_credentials["email"]
        assert d["isAdmin"] is False

    def test_me_without_token(self, session):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Collections ----------
class TestCollections:
    def test_collection_flow(self, session, user_token):
        h = auth_h(user_token)
        # Add
        r = requests.post(f"{API}/collections/1", headers=h)
        assert r.status_code == 200
        assert r.json() == {"saved": True}
        # List
        r = requests.get(f"{API}/collections", headers=h)
        assert r.status_code == 200
        assert 1 in r.json()
        # Delete
        r = requests.delete(f"{API}/collections/1", headers=h)
        assert r.status_code == 200
        assert r.json() == {"saved": False}
        # Confirm
        r = requests.get(f"{API}/collections", headers=h)
        assert 1 not in r.json()

    def test_collections_requires_auth(self):
        r = requests.get(f"{API}/collections")
        assert r.status_code == 401


# ---------- User Site Logs ----------
class TestLogs:
    def test_upsert_log_visited(self, user_token):
        h = auth_h(user_token)
        r = requests.post(f"{API}/auth/logs/1", headers=h, json={"visited": True})
        assert r.status_code == 200
        d = r.json()
        assert d["siteId"] == 1
        assert d["visited"] is True

    def test_upsert_log_prayed_update(self, user_token):
        h = auth_h(user_token)
        r = requests.post(f"{API}/auth/logs/1", headers=h, json={"prayed": True})
        assert r.status_code == 200
        d = r.json()
        # After previous test, visited should remain True (upsert preserves)
        assert d["prayed"] is True
        # Verify GET
        r2 = requests.get(f"{API}/auth/logs", headers=h)
        assert r2.status_code == 200
        logs = r2.json()
        match = [l for l in logs if l["siteId"] == 1]
        assert len(match) == 1
        assert match[0]["prayed"] is True


# ---------- Admin-only ----------
class TestAdminRoutes:
    def test_patch_site_as_admin(self, admin_token):
        h = auth_h(admin_token)
        r = requests.patch(f"{API}/sites/1", headers=h, json={"isFeatured": True})
        assert r.status_code == 200
        assert r.json()["isFeatured"] is True

    def test_patch_site_as_user_forbidden(self, user_token):
        h = auth_h(user_token)
        r = requests.patch(f"{API}/sites/1", headers=h, json={"isFeatured": True})
        assert r.status_code == 403

    def test_patch_site_no_token(self):
        r = requests.patch(f"{API}/sites/1", json={"isFeatured": True})
        assert r.status_code == 401

    def test_admin_create_and_delete_hotspot(self, admin_token):
        h = auth_h(admin_token)
        payload = {
            "label": "TEST_hotspot",
            "description": "test",
            "positionX": 0.0, "positionY": 0.0, "positionZ": 0.0,
        }
        r = requests.post(f"{API}/sites/1/hotspots", headers=h, json=payload)
        assert r.status_code == 201
        hid = r.json()["id"]
        # delete
        r2 = requests.delete(f"{API}/sites/1/hotspots/{hid}", headers=h)
        assert r2.status_code == 200

    def test_non_admin_create_hotspot_forbidden(self, user_token):
        h = auth_h(user_token)
        payload = {"label": "x", "description": "x", "positionX": 0, "positionY": 0, "positionZ": 0}
        r = requests.post(f"{API}/sites/1/hotspots", headers=h, json=payload)
        assert r.status_code == 403


# ---------- Seed data integrity ----------
class TestSeedIntegrity:
    def test_total_hotspots(self, session):
        # Sum hotspots across all 52 sites - expect 12 total
        r = session.get(f"{API}/sites")
        sites = r.json()
        total = 0
        for s in sites:
            rh = session.get(f"{API}/sites/{s['id']}/hotspots")
            total += len(rh.json())
        assert total == 12, f"Expected 12 hotspots, got {total}"
