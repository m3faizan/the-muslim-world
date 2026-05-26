import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRoute, Link } from "wouter";
import { useGetSite } from "@workspace/api-client-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF, Center, Bounds } from "@react-three/drei";
import * as THREE from "three";
import {
  MapPin,
  Calendar,
  Globe,
  ArrowLeft,
  ChevronDown,
  X,
  Info,
  Box,
  RotateCcw,
  Star,
  CheckCircle2,
  BookOpen,
  User,
  Plus,
  Trash2,
  Pencil,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { GlobeErrorBoundary } from "@/components/GlobeErrorBoundary";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/context/CollectionContext";

type Hotspot = {
  id: number;
  siteId: number;
  label: string;
  description: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  arabicTerm: string | null;
  historicalPeriod: string | null;
  imageUrl: string | null;
};

// ─── Mosque 3D Model ───────────────────────────────────────────────────────────
function MosqueMesh({
  hotspots,
  onHotspotClick,
  activeHotspot,
  annotateMode,
  onAnnotate,
  onClose,
}: {
  hotspots: Hotspot[];
  onHotspotClick?: (h: Hotspot) => void;
  activeHotspot: Hotspot | null;
  annotateMode?: boolean;
  onAnnotate?: (pos: { x: number; y: number; z: number }) => void;
  onClose?: () => void;
}) {
  const gold = new THREE.MeshStandardMaterial({ color: "#d4af37", roughness: 0.3, metalness: 0.6 });
  const cream = new THREE.MeshStandardMaterial({ color: "#f5efe0", roughness: 0.7, metalness: 0.1 });
  const stone = new THREE.MeshStandardMaterial({ color: "#c8b99a", roughness: 0.8, metalness: 0.0 });
  const darkStone = new THREE.MeshStandardMaterial({ color: "#8a7a62", roughness: 0.9 });

  return (
    <group
      onPointerDown={annotateMode ? (e: any) => {
        e.stopPropagation();
        if (e.point) onAnnotate?.({ x: e.point.x, y: e.point.y, z: e.point.z });
      } : undefined}
    >
      {/* Ground base */}
      <mesh position={[0, -0.7, 0]} receiveShadow>
        <cylinderGeometry args={[4, 4, 0.1, 64]} />
        <meshStandardMaterial color="#c8b99a" roughness={0.9} />
      </mesh>

      {/* Main courtyard floor */}
      <mesh position={[0, -0.64, 0]} receiveShadow>
        <boxGeometry args={[5, 0.05, 4]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.8} />
      </mesh>

      {/* Main prayer hall */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.2, 2.2]} />
        <primitive object={cream} attach="material" />
      </mesh>

      {/* Central dome base (drum) */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.4, 32]} />
        <primitive object={cream} attach="material" />
      </mesh>

      {/* Central dome */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.75, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
        <primitive object={gold} attach="material" />
      </mesh>

      {/* Secondary domes */}
      {[
        [-0.9, 0.72, 0],
        [0.9, 0.72, 0],
        [0, 0.72, -0.7],
        [0, 0.72, 0.7],
      ].map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[x, y, z] as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.18, 24]} />
            <primitive object={cream} attach="material" />
          </mesh>
          <mesh position={[x, y + 0.28, z] as [number, number, number]} castShadow>
            <sphereGeometry args={[0.32, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            <primitive object={gold} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Minarets — 4 corners */}
      {[
        [-1.4, 0, -0.9],
        [1.4, 0, -0.9],
        [-1.4, 0, 0.9],
        [1.4, 0, 0.9],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z] as [number, number, number]}>
          {/* Base */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.18, 0.8, 16]} />
            <primitive object={stone} attach="material" />
          </mesh>
          {/* Balcony ring */}
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
            <primitive object={darkStone} attach="material" />
          </mesh>
          {/* Upper shaft */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.14, 0.7, 16]} />
            <primitive object={cream} attach="material" />
          </mesh>
          {/* Cap */}
          <mesh position={[0, 1.65, 0]} castShadow>
            <coneGeometry args={[0.13, 0.35, 16]} />
            <primitive object={gold} attach="material" />
          </mesh>
          {/* Finial */}
          <mesh position={[0, 1.85, 0]} castShadow>
            <sphereGeometry args={[0.04, 8, 8]} />
            <primitive object={gold} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Entrance arch */}
      <mesh position={[0, 0.1, 1.12]} castShadow>
        <boxGeometry args={[0.85, 0.9, 0.05]} />
        <primitive object={cream} attach="material" />
      </mesh>
      <mesh position={[0, 0.65, 1.125]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 32, 1, false, 0, Math.PI]} />
        <primitive object={gold} attach="material" />
      </mesh>

      {/* Decorative arches on facade */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.05, 1.115]} castShadow>
            <boxGeometry args={[0.5, 0.7, 0.04]} />
            <primitive object={stone} attach="material" />
          </mesh>
          <mesh position={[x, 0.44, 1.12]}>
            <cylinderGeometry args={[0.25, 0.25, 0.04, 24, 1, false, 0, Math.PI]} />
            <primitive object={cream} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Hotspot markers */}
      {hotspots.map((h, i) => {
        const isActive = activeHotspot?.id === h.id;
        return (
          <group key={h.id} position={[h.positionX, h.positionY, h.positionZ]}>
            {/* Tiny invisible sphere as Three.js raycast hitbox */}
            <mesh onClick={(e) => { e.stopPropagation(); onHotspotClick?.(h); }}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Badge + popup via Html overlay */}
            <Html center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
              <div style={{ position: "relative", pointerEvents: "none" }}>
                {/* Numbered circle */}
                <div
                  onClick={(e) => { e.stopPropagation(); onHotspotClick?.(h); }}
                  style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: isActive ? "#d4af37" : "rgba(14,20,28,0.90)",
                    color: isActive ? "#05080c" : "#ffffff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    border: `2px solid ${isActive ? "#d4af37" : "rgba(212,175,55,0.75)"}`,
                    boxShadow: isActive ? "0 0 10px rgba(212,175,55,0.55)" : "0 1px 6px rgba(0,0,0,0.6)",
                    cursor: "pointer", pointerEvents: "auto", userSelect: "none",
                    transition: "all 0.15s",
                  }}
                >
                  {i + 1}
                </div>

                {/* Active popup */}
                {isActive && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute", left: 28, top: -8,
                      background: "rgba(8,12,18,0.97)",
                      border: "1px solid rgba(212,175,55,0.5)",
                      borderRadius: 10, padding: "12px 14px",
                      minWidth: 210, maxWidth: 270,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                      pointerEvents: "auto", zIndex: 200,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#d4af37", color: "#05080c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ color: "#edf2f7", fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{h.label}</span>
                      </div>
                      <button onClick={() => onClose?.()} style={{ background: "none", border: "none", color: "#5a7080", cursor: "pointer", fontSize: 18, padding: "0 0 0 8px", lineHeight: 1, flexShrink: 0 }}>×</button>
                    </div>
                    {h.arabicTerm && <p dir="rtl" style={{ color: "#39b163", fontSize: 14, marginBottom: 6, textAlign: "right", fontFamily: "serif" }}>{h.arabicTerm}</p>}
                    {h.historicalPeriod && <p style={{ color: "#5a7080", fontSize: 11, marginBottom: 6 }}>◷ {h.historicalPeriod}</p>}
                    {h.description && <p style={{ color: "#a8c0d0", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{h.description}</p>}
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// ─── GLTF Model loader ──────────────────────────────────────────────────────────
function GltfMesh({
  url,
  hotspots,
  onHotspotClick,
  activeHotspot,
  annotateMode,
  onAnnotate,
  onClose,
}: {
  url: string;
  hotspots: Hotspot[];
  onHotspotClick?: (h: Hotspot) => void;
  activeHotspot: Hotspot | null;
  annotateMode?: boolean;
  onAnnotate?: (pos: { x: number; y: number; z: number }) => void;
  onClose?: () => void;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  // Derive a sphere radius proportional to the model's bounding box
  const hotspotRadius = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    return maxDim > 0 ? maxDim * 0.018 : 0.06;
  }, [scene]);

  return (
    <Center>
      <group
        ref={groupRef}
        onPointerDown={annotateMode ? (e: any) => {
          e.stopPropagation();
          if (e.point && groupRef.current) {
            // Convert world-space hit point → group local space so the stored
            // position matches where we render hotspot markers (also inside this group).
            const local = groupRef.current.worldToLocal(e.point.clone());
            onAnnotate?.({ x: local.x, y: local.y, z: local.z });
          }
        } : undefined}
      >
        <primitive object={scene} />
        {/* Hotspot markers overlaid on the GLTF model */}
        {hotspots.map((h, i) => {
          const isActive = activeHotspot?.id === h.id;
          return (
            <group key={h.id} position={[h.positionX, h.positionY, h.positionZ]}>
              {/* Tiny invisible sphere as Three.js raycast hitbox */}
              {!annotateMode && (
                <mesh onClick={(e) => { e.stopPropagation(); onHotspotClick?.(h); }}>
                  <sphereGeometry args={[hotspotRadius * 0.6, 8, 8]} />
                  <meshBasicMaterial transparent opacity={0} />
                </mesh>
              )}

              {/* Badge + popup via Html overlay */}
              <Html center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
                <div style={{ position: "relative", pointerEvents: "none" }}>
                  {/* Numbered circle */}
                  <div
                    onClick={annotateMode ? undefined : (e) => { e.stopPropagation(); onHotspotClick?.(h); }}
                    style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: isActive ? "#d4af37" : "rgba(14,20,28,0.90)",
                      color: isActive ? "#05080c" : "#ffffff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      border: `2px solid ${isActive ? "#d4af37" : "rgba(212,175,55,0.75)"}`,
                      boxShadow: isActive ? "0 0 10px rgba(212,175,55,0.55)" : "0 1px 6px rgba(0,0,0,0.6)",
                      cursor: annotateMode ? "default" : "pointer",
                      pointerEvents: annotateMode ? "none" : "auto",
                      userSelect: "none", transition: "all 0.15s",
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* Active popup */}
                  {isActive && (
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute", left: 28, top: -8,
                        background: "rgba(8,12,18,0.97)",
                        border: "1px solid rgba(212,175,55,0.5)",
                        borderRadius: 10, padding: "12px 14px",
                        minWidth: 210, maxWidth: 270,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                        pointerEvents: "auto", zIndex: 200,
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#d4af37", color: "#05080c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                          <span style={{ color: "#edf2f7", fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{h.label}</span>
                        </div>
                        <button onClick={() => onClose?.()} style={{ background: "none", border: "none", color: "#5a7080", cursor: "pointer", fontSize: 18, padding: "0 0 0 8px", lineHeight: 1, flexShrink: 0 }}>×</button>
                      </div>
                      {h.arabicTerm && <p dir="rtl" style={{ color: "#39b163", fontSize: 14, marginBottom: 6, textAlign: "right", fontFamily: "serif" }}>{h.arabicTerm}</p>}
                      {h.historicalPeriod && <p style={{ color: "#5a7080", fontSize: 11, marginBottom: 6 }}>◷ {h.historicalPeriod}</p>}
                      {h.description && <p style={{ color: "#a8c0d0", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{h.description}</p>}
                    </div>
                  )}
                </div>
              </Html>
            </group>
          );
        })}
      </group>
    </Center>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function SiteDetail() {
  const [, params] = useRoute("/site/:id");
  const siteId = Number(params?.id);
  const { user } = useAuth();
  const { collectedIds, toggle: toggleCollection } = useCollection();
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const orbitRef = useRef<any>(null);

  // Visited / prayed tracking
  const [siteLog, setSiteLog] = useState<{ visited: boolean; prayed: boolean } | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  // Admin annotation
  const [annotateMode, setAnnotateMode] = useState(false);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number; z: number } | null>(null);
  const [annotForm, setAnnotForm] = useState({ label: "", description: "", arabicTerm: "", historicalPeriod: "" });
  const [annotSaving, setAnnotSaving] = useState(false);
  const [localHotspots, setLocalHotspots] = useState<Hotspot[]>([]);

  // Admin site edit
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [localSite, setLocalSite] = useState<any>(null);

  const { data: siteData, isLoading, error } = useGetSite(siteId, {
    query: { enabled: !!siteId, queryKey: ["getSite", siteId] },
  });
  const site: any = localSite ?? siteData;

  useEffect(() => {
    if (siteData) {
      setLocalHotspots((siteData as any).hotspots ?? []);
    }
  }, [siteData]);

  const openEdit = () => {
    if (!site) return;
    setEditForm({
      name: site.name ?? "",
      arabicName: site.arabicName ?? "",
      region: site.region ?? "",
      country: site.country ?? "",
      latitude: site.latitude ?? "",
      longitude: site.longitude ?? "",
      category: site.category ?? "",
      shortDescription: site.shortDescription ?? "",
      fullDescription: site.fullDescription ?? "",
      yearFounded: site.yearFounded ?? "",
      significance: site.significance ?? "",
      isFeatured: site.isFeatured ?? false,
      architecturalStyle: site.architecturalStyle ?? "",
      capacity: site.capacity ?? "",
      areaSqm: site.areaSqm ?? "",
      dualUse: site.dualUse ?? "",
      modelUrl: site.modelUrl ?? "",
      imageUrl: site.imageUrl ?? "",
      eidPrayer: site.eidPrayer ?? false,
      ramadanVisit: site.ramadanVisit ?? false,
      jumaPrayer: site.jumaPrayer ?? false,
      sect: (site as any).sect ?? "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    const body: Record<string, any> = { ...editForm };
    // coerce numeric strings
    if (body.latitude !== "") body.latitude = Number(body.latitude);
    if (body.longitude !== "") body.longitude = Number(body.longitude);
    if (body.capacity !== "") body.capacity = body.capacity === "" ? null : Number(body.capacity);
    else body.capacity = null;
    if (body.areaSqm !== "") body.areaSqm = body.areaSqm === "" ? null : Number(body.areaSqm);
    else body.areaSqm = null;
    // empty strings → null for nullable fields
    ["yearFounded", "architecturalStyle", "dualUse", "modelUrl", "imageUrl", "sect"].forEach((k) => {
      if (body[k] === "") body[k] = null;
    });
    const res = await fetch(`/api/sites/${siteId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setLocalSite(updated);
      setEditOpen(false);
    }
    setEditSaving(false);
  };

  useEffect(() => {
    if (!user || !siteId) return;
    fetch("/api/auth/logs", { credentials: "include" })
      .then((r) => r.json())
      .then((data: any) => {
        const logs = Array.isArray(data) ? data : [];
        const log = logs.find((l: any) => l.siteId === siteId);
        setSiteLog(log ? { visited: log.visited, prayed: log.prayed } : { visited: false, prayed: false });
      });
  }, [user, siteId]);

  const toggleLog = async (field: "visited" | "prayed") => {
    if (!user || !siteId) return;
    setLogLoading(true);
    const current = siteLog?.[field] ?? false;
    const res = await fetch(`/api/auth/logs/${siteId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !current }),
    });
    if (res.ok) {
      const data = await res.json();
      setSiteLog({ visited: data.visited, prayed: data.prayed });
    }
    setLogLoading(false);
  };

  const saveAnnotation = async () => {
    if (!pendingPos) return;
    setAnnotSaving(true);
    const res = await fetch(`/api/sites/${siteId}/hotspots`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: annotForm.label,
        description: annotForm.description,
        positionX: pendingPos.x,
        positionY: pendingPos.y,
        positionZ: pendingPos.z,
        arabicTerm: annotForm.arabicTerm || undefined,
        historicalPeriod: annotForm.historicalPeriod || undefined,
      }),
    });
    if (res.ok) {
      const hotspot: Hotspot = await res.json();
      setLocalHotspots((prev) => [...prev, hotspot]);
      setPendingPos(null);
      setAnnotForm({ label: "", description: "", arabicTerm: "", historicalPeriod: "" });
    }
    setAnnotSaving(false);
  };

  const deleteHotspot = async (id: number) => {
    await fetch(`/api/sites/${siteId}/hotspots/${id}`, { method: "DELETE", credentials: "include" });
    setLocalHotspots((prev) => prev.filter((h) => h.id !== id));
    if (activeHotspot?.id === id) setActiveHotspot(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground">Loading site...</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 text-center px-6">
        <h2 className="text-2xl font-bold text-foreground">Site not found</h2>
        <p className="text-muted-foreground">This heritage site could not be loaded.</p>
        <Link href="/explore">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Back to Globe
          </button>
        </Link>
      </div>
    );
  }

  const hotspots = localHotspots;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col page-enter">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/explore">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Globe
          </button>
        </Link>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <span className="text-primary text-xs font-arabic">م</span>
            </div>
            <span className="text-sm font-bold text-foreground hidden sm:block">The Muslim World</span>
          </div>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>{site.country}</span>
        </div>
      </nav>

      {/* Hero title */}
      <div className="px-6 py-8 border-b border-border/50 bg-gradient-to-r from-background via-card/30 to-background geometric-bg">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <span className="text-xs px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary capitalize mb-3 inline-block">
                {site.category}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">{site.name}</h1>
              <p className="font-arabic text-2xl text-primary/60 mt-1" dir="rtl">{site.arabicName}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:text-right">
              <div className="flex items-center gap-1.5 sm:justify-end">
                <Globe className="w-4 h-4 text-primary" />
                <span>{site.region}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:justify-end">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{site.country}</span>
              </div>
              {site.yearFounded && (
                <div className="flex items-center gap-1.5 sm:justify-end">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Est. {site.yearFounded}</span>
                </div>
              )}
              {user && (
                <button
                  onClick={() => toggleCollection(siteId)}
                  className="flex items-center gap-1.5 sm:justify-end mt-1 transition-colors group/star"
                  title={collectedIds.has(siteId) ? "Remove from collection" : "Save to collection"}
                >
                  <Star
                    className="w-4 h-4 transition-colors"
                    style={{ color: collectedIds.has(siteId) ? "#39b163" : undefined }}
                    fill={collectedIds.has(siteId) ? "#39b163" : "none"}
                  />
                  <span className={collectedIds.has(siteId) ? "text-primary" : ""}>
                    {collectedIds.has(siteId) ? "Saved" : "Save"}
                  </span>
                </button>
              )}
              {user?.isAdmin && (
                <button
                  onClick={openEdit}
                  title="Edit site info"
                  className="flex items-center gap-1.5 sm:justify-end mt-1 text-amber-400/70 hover:text-amber-400 transition-colors text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row lg:items-start max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* 3D Viewer */}
        <div className="flex-1 flex flex-col gap-4 lg:sticky lg:top-[73px]">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card h-[480px] lg:h-[calc(100vh-200px)]">

            {/* Controls hint — top left */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <div className="bg-background/80 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
                Drag to rotate · Scroll to zoom
              </div>
            </div>

            {/* Hotspot count — top right */}
            {hotspots.length > 0 && (
              <div className="absolute top-3 right-12 z-10 pointer-events-none">
                <div className="bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs text-primary">
                  {hotspots.length} hotspot{hotspots.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            {/* ── Side Toolbar ─────────────────────────────────── */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 p-1.5 rounded-xl border border-border/70 bg-background/95 backdrop-blur-md shadow-lg">
              {/* Reset view */}
              <button
                onClick={() => orbitRef.current?.reset()}
                title="Reset view"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Admin annotation toggle */}
              {user?.isAdmin && (
                <>
                  <div className="w-6 h-px bg-border" />
                  <button
                    onClick={() => { setAnnotateMode(!annotateMode); setPendingPos(null); }}
                    title="Add annotation"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                      annotateMode
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "text-muted-foreground hover:text-foreground hover:bg-card"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Admin annotation banner */}
            {annotateMode && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium" style={{ background: "#1a1200", border: "1px solid #c9a22760", color: "#c9a227" }}>
                  <Plus className="w-3 h-3" />
                  Click anywhere on the model to place a hotspot
                </div>
              </div>
            )}

            <GlobeErrorBoundary
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center bg-card">
                  <Box className="w-12 h-12 text-primary/30" />
                  <p className="text-foreground font-medium">3D view unavailable</p>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Your browser does not support WebGL. Explore the site details in the panel on the right.
                  </p>
                </div>
              }
            >
              <Canvas
                shadows
                camera={{ fov: 45 }}
                gl={{ antialias: true }}
              >
                <color attach="background" args={["#0d1117"]} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
                <directionalLight position={[-4, 3, -4]} intensity={0.3} color="#d4af37" />
                <pointLight position={[0, 5, 0]} intensity={0.5} color="#f5efe0" />

                <Suspense fallback={null}>
                  <Bounds fit clip observe margin={1.3}>
                    {site.modelUrl ? (
                      <GltfMesh
                        url={site.modelUrl}
                        hotspots={hotspots}
                        onHotspotClick={(h) => setActiveHotspot(prev => prev?.id === h.id ? null : h)}
                        activeHotspot={activeHotspot}
                        annotateMode={annotateMode}
                        onAnnotate={(pos) => setPendingPos(pos)}
                        onClose={() => setActiveHotspot(null)}
                      />
                    ) : (
                      <MosqueMesh
                        hotspots={hotspots}
                        onHotspotClick={(h) => setActiveHotspot(prev => prev?.id === h.id ? null : h)}
                        activeHotspot={activeHotspot}
                        annotateMode={annotateMode}
                        onAnnotate={(pos) => setPendingPos(pos)}
                        onClose={() => setActiveHotspot(null)}
                      />
                    )}
                  </Bounds>
                </Suspense>

                <OrbitControls
                  ref={orbitRef}
                  enabled={!annotateMode}
                  enableRotate={!annotateMode}
                  enableZoom={!annotateMode}
                  enablePan={!annotateMode}
                  minDistance={0.5}
                  maxDistance={500}
                />
              </Canvas>
            </GlobeErrorBoundary>
          </div>

          {/* Model accuracy disclaimer */}
          <p className="text-xs text-muted-foreground/50 text-center px-2">
            ⚠ This 3D model is not 100% architecturally accurate and is provided for informational purposes only.
          </p>

          {/* Hotspot list (mobile-friendly) */}
          {hotspots.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Architectural Features
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {hotspots.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setActiveHotspot(activeHotspot?.id === h.id ? null : h)}
                    className={`text-left p-3 rounded-xl border transition-all text-sm ${
                      activeHotspot?.id === h.id
                        ? "border-secondary bg-secondary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          activeHotspot?.id === h.id ? "bg-secondary" : "bg-primary"
                        }`}
                      />
                      <span className="font-medium text-xs truncate">{h.label}</span>
                    </div>
                    {h.arabicTerm && (
                      <span className="font-arabic text-xs text-primary/50 block" dir="rtl">{h.arabicTerm}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="lg:w-80 flex flex-col gap-4 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-1">

          {/* ── Special Occasions ── */}
          {(site.eidPrayer || site.ramadanVisit || site.jumaPrayer) && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Special Occasions</h3>
              <div className="flex flex-wrap gap-2">
                {site.eidPrayer && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border" style={{ background: "#0d1a12", borderColor: "#39b16360", color: "#39b163" }}>
                    <Sun className="w-3 h-3" /> Eid Prayer
                  </div>
                )}
                {site.ramadanVisit && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border" style={{ background: "#0d1220", borderColor: "#6080e060", color: "#8090e0" }}>
                    <Moon className="w-3 h-3" /> Ramadan Visit
                  </div>
                )}
                {site.jumaPrayer && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border" style={{ background: "#1a0d0d", borderColor: "#d4af3760", color: "#d4af37" }}>
                    <Users className="w-3 h-3" /> Jumu'ah Prayer
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ── Visited / Prayed tracker ── */}
          {user ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">My Record</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleLog("visited")}
                  disabled={logLoading}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all border ${
                    siteLog?.visited
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {siteLog?.visited ? "Visited ✓" : "Mark Visited"}
                </button>
                <button
                  onClick={() => toggleLog("prayed")}
                  disabled={logLoading}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all border ${
                    siteLog?.prayed
                      ? "bg-secondary/15 border-secondary/50 text-secondary"
                      : "border-border text-muted-foreground hover:border-secondary/40 hover:text-foreground"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {siteLog?.prayed ? "Prayed ✓" : "Mark Prayed"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Sign in to track your visits and prayers</p>
              <Link href="/auth">
                <button className="text-xs text-primary flex items-center gap-1 mx-auto hover:underline">
                  <User className="w-3 h-3" /> Create an account
                </button>
              </Link>
            </div>
          )}

          {/* ── Admin annotation form (when a click position is pending) ── */}
          {user?.isAdmin && pendingPos && (
            <div className="rounded-xl border p-4" style={{ borderColor: "#c9a22760", background: "#0e0a00" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "#c9a227" }}>New Hotspot</h3>
                <button onClick={() => setPendingPos(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-2 text-xs mb-3" style={{ color: "#5a7a9a" }}>
                <p>Position: ({pendingPos.x.toFixed(2)}, {pendingPos.y.toFixed(2)}, {pendingPos.z.toFixed(2)})</p>
              </div>
              <div className="space-y-2">
                {[
                  { key: "label", placeholder: "Label (e.g. Main Dome)" },
                  { key: "arabicTerm", placeholder: "Arabic term (optional)" },
                  { key: "historicalPeriod", placeholder: "Historical period (optional)" },
                ].map(({ key, placeholder }) => (
                  <input
                    key={key}
                    placeholder={placeholder}
                    value={annotForm[key as keyof typeof annotForm]}
                    onChange={(e) => setAnnotForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-background border border-border text-foreground placeholder:text-muted-foreground"
                  />
                ))}
                <textarea
                  placeholder="Description (optional)"
                  value={annotForm.description}
                  onChange={(e) => setAnnotForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-background border border-border text-foreground placeholder:text-muted-foreground resize-none"
                />
                <button
                  onClick={saveAnnotation}
                  disabled={annotSaving}
                  className="w-full py-2 rounded-lg text-xs font-medium transition-opacity"
                  style={{ background: "#c9a227", color: "#05080c", opacity: annotSaving ? 0.4 : 1 }}
                >
                  {annotSaving ? "Saving…" : "Save Hotspot"}
                </button>
              </div>
            </div>
          )}

          {/* ── Admin: existing hotspot delete list ── */}
          {user?.isAdmin && localHotspots.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Hotspot Manager</h3>
              <div className="space-y-1">
                {localHotspots.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2 py-1">
                    <span className="text-xs text-foreground truncate">{h.label}</span>
                    <button
                      onClick={() => deleteHotspot(h.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
                      title="Delete hotspot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Site description */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3">About this Site</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {descExpanded
                ? (site as any).fullDescription || site.shortDescription
                : site.shortDescription}
            </p>
            {((site as any).fullDescription || "").length > site.shortDescription.length && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="flex items-center gap-1 text-primary text-xs mt-3 hover:text-primary/80 transition-colors"
              >
                {descExpanded ? "Show less" : "Read more"}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${descExpanded ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>

          {/* Significance */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span className="text-primary">Significance</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{site.significance}</p>
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Details</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "Category", value: site.category },
                { label: "Region", value: site.region },
                { label: "Country", value: site.country },
                { label: "Founded", value: site.yearFounded },
                { label: "Tradition", value: (site as any).sect },
                { label: "Style", value: (site as any).architecturalStyle },
                { label: "Function", value: (site as any).dualUse },
              ]
                .filter((d) => d.value)
                .map((d) => (
                  <div key={d.label} className="flex justify-between items-start gap-3">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="text-foreground text-right capitalize">{d.value}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick facts — capacity, area, coordinates */}
          {((site as any).capacity || (site as any).areaSqm) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-3">Quick Facts</h3>
              <div className="space-y-2 text-sm">
                {(site as any).capacity && (
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="text-foreground text-right">
                      ~{Number((site as any).capacity).toLocaleString()} worshippers
                    </span>
                  </div>
                )}
                {(site as any).areaSqm && (
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-muted-foreground">Area</span>
                    <span className="text-foreground text-right">
                      {Number((site as any).areaSqm).toLocaleString()} m²
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start gap-3">
                  <span className="text-muted-foreground">Coordinates</span>
                  <span className="text-foreground text-right font-mono text-xs">
                    {site.latitude.toFixed(4)}°, {site.longitude.toFixed(4)}°
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Coordinates only (for sites without capacity/area data) */}
          {!(site as any).capacity && !(site as any).areaSqm && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-3">Quick Facts</h3>
              <div className="flex justify-between items-start gap-3 text-sm">
                <span className="text-muted-foreground">Coordinates</span>
                <span className="text-foreground text-right font-mono text-xs">
                  {site.latitude.toFixed(4)}°, {site.longitude.toFixed(4)}°
                </span>
              </div>
            </div>
          )}

          {/* Back button */}
          <Link href="/explore">
            <button className="w-full py-3 border border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all text-sm font-medium flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" />
              Explore More Sites
            </button>
          </Link>
        </div>
      </div>

      {/* ── Admin Edit Modal ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-background shadow-2xl" style={{ background: "#060c0f" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-foreground">Edit Site — <span className="text-amber-400">{site.name}</span></h2>
              </div>
              <button onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">

              {/* Section: Identity */}
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-amber-400/70 mb-3">Identity</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "name", label: "Name (English)" },
                    { key: "arabicName", label: "Arabic Name" },
                    { key: "category", label: "Category" },
                    { key: "yearFounded", label: "Year Founded" },
                    { key: "region", label: "Region" },
                    { key: "country", label: "Country" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                      <input
                        value={editForm[key] ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:border-amber-500/50 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Location */}
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-amber-400/70 mb-3">Location</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "latitude", label: "Latitude" },
                    { key: "longitude", label: "Longitude" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm[key] ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:border-amber-500/50 transition-colors font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Descriptions */}
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-amber-400/70 mb-3">Descriptions</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Short Description</label>
                    <textarea
                      rows={2}
                      value={editForm.shortDescription ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, shortDescription: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:border-amber-500/50 transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Full Description</label>
                    <textarea
                      rows={5}
                      value={editForm.fullDescription ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, fullDescription: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:border-amber-500/50 transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Significance</label>
                    <textarea
                      rows={2}
                      value={editForm.significance ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, significance: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:border-amber-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Details */}
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-amber-400/70 mb-3">Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground block mb-1">Islamic Tradition / Sect</label>
                    <select
                      value={editForm.sect ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, sect: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:border-amber-500/50 transition-colors"
                    >
                      <option value="">— Not set —</option>
                      <option value="Universal">Universal (all Muslims)</option>
                      <option value="Sunni">Sunni</option>
                      <option value="Shia">Shia</option>
                      <option value="Sufi">Sufi</option>
                      <option value="Ibadi">Ibadi</option>
                    </select>
                  </div>
                  {[
                    { key: "architecturalStyle", label: "Architectural Style" },
                    { key: "dualUse", label: "Secondary Function" },
                    { key: "capacity", label: "Capacity (worshippers)" },
                    { key: "areaSqm", label: "Area (m²)" },
                    { key: "modelUrl", label: "3D Model URL" },
                    { key: "imageUrl", label: "Image URL" },
                  ].map(({ key, label }) => (
                    <div key={key} className={key === "architecturalStyle" || key === "dualUse" || key === "modelUrl" || key === "imageUrl" ? "col-span-2" : ""}>
                      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                      <input
                        value={editForm[key] ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground outline-none focus:border-amber-500/50 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Flags */}
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-amber-400/70 mb-3">Flags &amp; Special Occasions</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "isFeatured", label: "Featured on homepage" },
                    { key: "eidPrayer", label: "Eid Prayer held here" },
                    { key: "ramadanVisit", label: "Notable Ramadan destination" },
                    { key: "jumaPrayer", label: "Jumu'ah (Friday) prayer" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer group">
                      <div
                        onClick={() => setEditForm((f) => ({ ...f, [key]: !f[key] }))}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                          editForm[key]
                            ? "bg-amber-500/20 border-amber-500/60"
                            : "border-border bg-card"
                        }`}
                      >
                        {editForm[key] && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="px-5 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: editSaving ? "#8a6a10" : "#c9a227", color: "#05080c", opacity: editSaving ? 0.7 : 1 }}
              >
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
