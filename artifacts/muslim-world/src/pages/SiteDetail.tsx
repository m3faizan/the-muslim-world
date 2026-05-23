import { useState, Suspense } from "react";
import { useRoute, Link } from "wouter";
import { useGetSite } from "@workspace/api-client-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF, Center } from "@react-three/drei";
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
} from "lucide-react";
import { GlobeErrorBoundary } from "@/components/GlobeErrorBoundary";

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
  onHotspotClick: (h: Hotspot) => void;
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
            onHotspotClick(h);
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
  onHotspotClick: (h: Hotspot) => void;
  activeHotspot: Hotspot | null;
}) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
      {/* Hotspot markers overlaid on the GLTF model */}
      {hotspots.map((h) => (
        <group key={h.id} position={[h.positionX, h.positionY, h.positionZ]}>
          <mesh onClick={() => onHotspotClick(h)}>
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
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const { data: site, isLoading, error } = useGetSite(siteId, {
    query: { enabled: !!siteId, queryKey: ["getSite", siteId] },
  });

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

  const hotspots: Hotspot[] = (site as any).hotspots ?? [];

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
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card" style={{ height: "480px" }}>
            {/* Instruction */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <div className="bg-background/80 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
                <p className="font-medium text-foreground mb-0.5">3D Model</p>
                <p>Drag to rotate · Scroll to zoom</p>
                <p>Click glowing dots to learn more</p>
              </div>
            </div>

            {hotspots.length > 0 && (
              <div className="absolute top-3 right-3 z-10 pointer-events-none">
                <div className="bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs text-primary">
                  {hotspots.length} hotspot{hotspots.length !== 1 ? "s" : ""}
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
                camera={{ position: [4, 3, 5], fov: 45 }}
                gl={{ antialias: true }}
              >
                <color attach="background" args={["#0d1117"]} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
                <directionalLight position={[-4, 3, -4]} intensity={0.3} color="#d4af37" />
                <pointLight position={[0, 5, 0]} intensity={0.5} color="#f5efe0" />

                <Suspense fallback={null}>
                  {site.modelUrl ? (
                    <GltfMesh
                      url={site.modelUrl}
                      hotspots={hotspots}
                      onHotspotClick={setActiveHotspot}
                      activeHotspot={activeHotspot}
                    />
                  ) : (
                    <MosqueMesh
                      hotspots={hotspots}
                      onHotspotClick={setActiveHotspot}
                      activeHotspot={activeHotspot}
                    />
                  )}
                </Suspense>

                <OrbitControls
                  enablePan={false}
                  minDistance={1}
                  maxDistance={20}
                  autoRotate
                  autoRotateSpeed={0.4}
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
