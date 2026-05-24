import { useState, useRef, useEffect, Suspense } from "react";
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
  RotateCw,
  ZoomIn,
  Move,
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle2,
  BookOpen,
  User,
  Plus,
  Trash2,
} from "lucide-react";
import { GlobeErrorBoundary } from "@/components/GlobeErrorBoundary";
import { useAuth } from "@/context/AuthContext";

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
}: {
  hotspots: Hotspot[];
  onHotspotClick?: (h: Hotspot) => void;
  activeHotspot: Hotspot | null;
}) {
  const gold = new THREE.MeshStandardMaterial({ color: "#d4af37", roughness: 0.3, metalness: 0.6 });
  const cream = new THREE.MeshStandardMaterial({ color: "#f5efe0", roughness: 0.7, metalness: 0.1 });
  const stone = new THREE.MeshStandardMaterial({ color: "#c8b99a", roughness: 0.8, metalness: 0.0 });
  const darkStone = new THREE.MeshStandardMaterial({ color: "#8a7a62", roughness: 0.9 });

  return (
    <group>
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
      {hotspots.map((h) => (
        <group
          key={h.id}
          position={[h.positionX, h.positionY, h.positionZ]}
          onClick={(e) => {
            e.stopPropagation();
            onHotspotClick?.(h);
          }}
        >
          {/* Glowing sphere */}
          <mesh>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial
              color={activeHotspot?.id === h.id ? "#40bea5" : "#d4af37"}
              emissive={activeHotspot?.id === h.id ? "#40bea5" : "#d4af37"}
              emissiveIntensity={activeHotspot?.id === h.id ? 1.5 : 0.8}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          {/* Point light for glow */}
          <pointLight
            color={activeHotspot?.id === h.id ? "#40bea5" : "#d4af37"}
            intensity={activeHotspot?.id === h.id ? 1.0 : 0.4}
            distance={0.8}
          />
          {/* Label */}
          <Html center distanceFactor={6} occlude>
            <div
              className={`pointer-events-none whitespace-nowrap text-xs px-2 py-1 rounded-full border backdrop-blur-sm transition-all ${
                activeHotspot?.id === h.id
                  ? "bg-secondary/90 border-secondary text-secondary-foreground font-medium"
                  : "bg-card/80 border-primary/40 text-primary"
              }`}
            >
              {h.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ─── GLTF Model loader ──────────────────────────────────────────────────────────
function GltfMesh({
  url,
  hotspots,
  onHotspotClick,
  activeHotspot,
}: {
  url: string;
  hotspots: Hotspot[];
  onHotspotClick?: (h: Hotspot) => void;
  activeHotspot: Hotspot | null;
}) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
      {/* Hotspot markers overlaid on the GLTF model */}
      {hotspots.map((h) => (
        <group key={h.id} position={[h.positionX, h.positionY, h.positionZ]}>
          <mesh onClick={() => onHotspotClick?.(h)}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color={activeHotspot?.id === h.id ? "#4dd0b8" : "#d4af37"}
              emissive={activeHotspot?.id === h.id ? "#4dd0b8" : "#d4af37"}
              emissiveIntensity={activeHotspot?.id === h.id ? 1.2 : 0.6}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          {activeHotspot?.id === h.id && (
            <Html center distanceFactor={4}>
              <div className="bg-background/95 border border-secondary/50 rounded-lg px-3 py-2 text-xs text-foreground whitespace-nowrap shadow-xl pointer-events-none max-w-[180px]">
                <p className="font-semibold text-secondary truncate">{h.label}</p>
                {h.arabicTerm && <p className="font-arabic text-primary/60 text-right" dir="rtl">{h.arabicTerm}</p>}
              </div>
            </Html>
          )}
        </group>
      ))}
    </Center>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function SiteDetail() {
  const [, params] = useRoute("/site/:id");
  const siteId = Number(params?.id);
  const { user } = useAuth();
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeTool, setActiveTool] = useState<"rotate" | "zoom" | "pan" | null>(null);
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

  const toggleTool = (tool: "rotate" | "zoom" | "pan") => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  const { data: site, isLoading, error } = useGetSite(siteId, {
    query: { enabled: !!siteId, queryKey: ["getSite", siteId] },
  });

  useEffect(() => {
    if (site) setLocalHotspots((site as any).hotspots ?? []);
  }, [site]);

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
    if (!pendingPos || !annotForm.label || !annotForm.description) return;
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
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* 3D Viewer */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card flex-1 min-h-[480px]">

            {/* Status badge — top left */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <div className="bg-background/80 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
                <p className="font-medium text-foreground mb-0.5 flex items-center gap-1.5">
                  {activeTool ? (
                    <Unlock className="w-3 h-3 text-primary" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  {activeTool ? `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} active` : "Model locked"}
                </p>
                <p>{activeTool ? "Use the toolbar to switch modes" : "Select a tool to interact"}</p>
              </div>
            </div>

            {/* Hotspot count — top right (leave space for toolbar) */}
            {hotspots.length > 0 && (
              <div className="absolute top-3 right-14 z-10 pointer-events-none">
                <div className="bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs text-primary">
                  {hotspots.length} hotspot{hotspots.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            {/* ── Side Toolbar ─────────────────────────────────── */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 p-1.5 rounded-xl border border-border/70 bg-background/95 backdrop-blur-md shadow-lg">
              {/* Lock / unlock indicator */}
              <div className="w-8 h-7 flex items-center justify-center">
                {activeTool ? (
                  <Unlock className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                )}
              </div>

              <div className="w-6 h-px bg-border" />

              {/* Rotate */}
              <button
                onClick={() => toggleTool("rotate")}
                title="Rotate model"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  activeTool === "rotate"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Zoom */}
              <button
                onClick={() => toggleTool("zoom")}
                title="Zoom in / out"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  activeTool === "zoom"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {/* Pan */}
              <button
                onClick={() => toggleTool("pan")}
                title="Pan / move"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  activeTool === "pan"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                <Move className="w-3.5 h-3.5" />
              </button>

              <div className="w-6 h-px bg-border" />

              {/* Reset view */}
              <button
                onClick={() => { orbitRef.current?.reset(); setActiveTool(null); }}
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

                {/* Transparent click-catcher sphere — only active in annotation mode */}
                {annotateMode && (
                  <mesh
                    renderOrder={-1}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (e.point) setPendingPos({ x: e.point.x, y: e.point.y, z: e.point.z });
                    }}
                  >
                    <sphereGeometry args={[80, 8, 8]} />
                    <meshBasicMaterial
                      transparent
                      opacity={0}
                      side={THREE.BackSide}
                      depthWrite={false}
                    />
                  </mesh>
                )}

                <Suspense fallback={null}>
                  <Bounds fit clip observe margin={1.3}>
                    {site.modelUrl ? (
                      <GltfMesh
                        url={site.modelUrl}
                        hotspots={hotspots}
                        onHotspotClick={annotateMode ? undefined : setActiveHotspot}
                        activeHotspot={activeHotspot}
                      />
                    ) : (
                      <MosqueMesh
                        hotspots={hotspots}
                        onHotspotClick={annotateMode ? undefined : setActiveHotspot}
                        activeHotspot={activeHotspot}
                      />
                    )}
                  </Bounds>
                </Suspense>

                <OrbitControls
                  ref={orbitRef}
                  enableRotate={!annotateMode && activeTool === "rotate"}
                  enableZoom={!annotateMode && activeTool !== null}
                  enablePan={!annotateMode && activeTool === "pan"}
                  minDistance={0.5}
                  maxDistance={500}
                />
              </Canvas>
            </GlobeErrorBoundary>
          </div>

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
        <div className="lg:w-80 flex flex-col gap-4">

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
                  { key: "label", placeholder: "Label (e.g. Main Dome)", required: true },
                  { key: "arabicTerm", placeholder: "Arabic term (optional)" },
                  { key: "historicalPeriod", placeholder: "Historical period (optional)" },
                ].map(({ key, placeholder, required }) => (
                  <input
                    key={key}
                    placeholder={placeholder}
                    value={annotForm[key as keyof typeof annotForm]}
                    onChange={(e) => setAnnotForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-background border border-border text-foreground placeholder:text-muted-foreground"
                  />
                ))}
                <textarea
                  placeholder="Description (required)"
                  value={annotForm.description}
                  onChange={(e) => setAnnotForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none bg-background border border-border text-foreground placeholder:text-muted-foreground resize-none"
                />
                <button
                  onClick={saveAnnotation}
                  disabled={annotSaving || !annotForm.label || !annotForm.description}
                  className="w-full py-2 rounded-lg text-xs font-medium transition-opacity"
                  style={{ background: "#c9a227", color: "#05080c", opacity: annotSaving || !annotForm.label || !annotForm.description ? 0.4 : 1 }}
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

          {/* Active hotspot panel */}
          {activeHotspot && (
            <div className="rounded-xl border border-secondary/40 bg-secondary/5 p-5 teal-glow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-bold text-foreground">{activeHotspot.label}</h3>
                  {activeHotspot.arabicTerm && (
                    <p className="font-arabic text-sm text-secondary" dir="rtl">{activeHotspot.arabicTerm}</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveHotspot(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {activeHotspot.historicalPeriod && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <Calendar className="w-3 h-3 text-secondary" />
                  <span>{activeHotspot.historicalPeriod}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">{activeHotspot.description}</p>
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
                { label: "Style", value: (site as any).architecturalStyle },
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

          {/* Back button */}
          <Link href="/explore">
            <button className="w-full py-3 border border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all text-sm font-medium flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" />
              Explore More Sites
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
