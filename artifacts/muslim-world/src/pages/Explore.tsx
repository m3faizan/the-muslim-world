import { useRef, useEffect, useCallback, useState } from "react";
import { useLocation } from "wouter";
import { useListSites, useListSitesByRegion, useListFeaturedSites } from "@workspace/api-client-react";
import { MapPin, Globe, ChevronRight, Star, Layers } from "lucide-react";
import { Link } from "wouter";
import { GlobeErrorBoundary } from "@/components/GlobeErrorBoundary";

// Dynamic import for react-globe.gl (it uses window)
import GlobeGL from "react-globe.gl";

type Site = {
  id: number;
  name: string;
  arabicName: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  category: string;
  shortDescription: string;
  yearFounded: string | null;
  significance: string;
  isFeatured: boolean;
  imageUrl: string | null;
};

export default function Explore() {
  const [, navigate] = useLocation();
  const globeRef = useRef<any>(null);
  const [hoveredSite, setHoveredSite] = useState<Site | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFeatured, setShowFeatured] = useState(false);

  const { data: sites = [], isLoading } = useListSites();
  const { data: regions = [] } = useListSitesByRegion();
  const { data: featuredSites = [] } = useListFeaturedSites();

  const filteredSites = selectedRegion
    ? (sites as Site[]).filter((s) => s.region === selectedRegion)
    : (sites as Site[]);

  const displayedSites = showFeatured
    ? (featuredSites as Site[])
    : filteredSites;

  // Set initial camera to Mecca
  useEffect(() => {
    if (globeRef.current && !isLoading) {
      setTimeout(() => {
        globeRef.current?.pointOfView({ lat: 21.4, lng: 39.8, altitude: 2.2 }, 1500);
      }, 500);
    }
  }, [isLoading]);

  const handlePointClick = useCallback(
    (point: any) => {
      navigate(`/site/${point.id}`);
    },
    [navigate]
  );

  const handlePointHover = useCallback((point: any) => {
    setHoveredSite(point ?? null);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "mosque": return "rgba(212, 175, 55, 0.9)";
      case "shrine": return "rgba(64, 190, 165, 0.9)";
      case "palace": return "rgba(180, 120, 220, 0.9)";
      case "fortress": return "rgba(220, 120, 80, 0.9)";
      default: return "rgba(212, 175, 55, 0.9)";
    }
  };

  const pointsData = displayedSites.map((s) => ({
    ...s,
    lat: s.latitude,
    lng: s.longitude,
    color: getCategoryColor(s.category),
    size: s.isFeatured ? 0.5 : 0.35,
    label: s.name,
  }));

  return (
    <div className="relative h-screen w-screen bg-background overflow-hidden flex">
      {/* Globe */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Loading sacred sites...</p>
          </div>
        ) : (
          <GlobeErrorBoundary
            fallback={
              <div className="flex flex-col items-center justify-center gap-4 text-center px-8">
                <Globe className="w-16 h-16 text-primary/30" />
                <p className="text-foreground font-semibold text-lg">3D Globe unavailable</p>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Your browser does not support WebGL. Use the site list in the sidebar to explore Islamic heritage sites.
                </p>
              </div>
            }
          >
            <GlobeGL
              ref={globeRef}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
              pointsData={pointsData}
              pointLat="lat"
              pointLng="lng"
              pointColor="color"
              pointRadius="size"
              pointLabel="name"
              pointAltitude={0.01}
              onPointClick={handlePointClick}
              onPointHover={handlePointHover}
              atmosphereColor="#ae8c3c"
              atmosphereAltitude={0.15}
              width={window.innerWidth}
              height={window.innerHeight}
            />
          </GlobeErrorBoundary>
        )}
      </div>

      {/* Top nav bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-background/90 to-transparent">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <span className="text-primary text-xs font-arabic font-bold">م</span>
            </div>
            <span className="text-sm font-bold text-foreground">The Muslim World</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-card/80 border border-border text-xs text-muted-foreground">
            <Globe className="w-3 h-3 text-primary" />
            <span>{displayedSites.length} sites</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-card/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`absolute top-0 right-0 h-full z-10 transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <div className="h-full w-72 bg-background/95 border-l border-border backdrop-blur-md flex flex-col overflow-hidden">
          <div className="p-4 pt-16 border-b border-border flex-shrink-0">
            <h2 className="font-bold text-foreground mb-1">Islamic Sites</h2>
            <p className="text-xs text-muted-foreground">Click a site on the globe or list below</p>
          </div>

          {/* Filters */}
          <div className="p-3 border-b border-border flex-shrink-0 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => { setShowFeatured(false); setSelectedRegion(null); }}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${!showFeatured && !selectedRegion ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                All Sites
              </button>
              <button
                onClick={() => { setShowFeatured(true); setSelectedRegion(null); }}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors flex items-center justify-center gap-1 ${showFeatured ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                <Star className="w-3 h-3" />
                Featured
              </button>
            </div>

            {/* Region filter */}
            <select
              value={selectedRegion ?? ""}
              onChange={(e) => {
                setSelectedRegion(e.target.value || null);
                setShowFeatured(false);
              }}
              className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r.region} value={r.region}>{r.region} ({r.count})</option>
              ))}
            </select>
          </div>

          {/* Site list */}
          <div className="flex-1 overflow-y-auto">
            {displayedSites.map((site) => (
              <Link key={site.id} href={`/site/${site.id}`}>
                <div className="flex items-start gap-3 p-4 border-b border-border/50 hover:bg-card/60 cursor-pointer transition-colors group">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(site.category) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {site.name}
                    </p>
                    <p className="font-arabic text-xs text-primary/50 truncate" dir="rtl">{site.arabicName}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{site.country}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <p className="text-xs text-muted-foreground font-medium mb-2">Legend</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Mosque", color: "rgba(212,175,55,0.9)" },
                { label: "Shrine", color: "rgba(64,190,165,0.9)" },
                { label: "Palace", color: "rgba(180,120,220,0.9)" },
                { label: "Fortress", color: "rgba(220,120,80,0.9)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredSite && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-card/95 border border-primary/30 rounded-xl px-5 py-3 shadow-xl backdrop-blur-md text-center gold-glow">
            <p className="font-semibold text-foreground">{hoveredSite.name}</p>
            <p className="font-arabic text-sm text-primary/60" dir="rtl">{hoveredSite.arabicName}</p>
            <div className="flex items-center gap-1 justify-center text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span>{hoveredSite.country}</span>
            </div>
            <p className="text-xs text-primary mt-1">Click to explore</p>
          </div>
        </div>
      )}

      {/* Instruction overlay (shown briefly) */}
      <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
        <div className="bg-card/80 border border-border rounded-lg px-4 py-2.5 text-xs text-muted-foreground backdrop-blur-sm max-w-48">
          <p className="font-medium text-foreground mb-0.5">How to use</p>
          <p>Drag to rotate the globe. Hover markers to preview. Click to explore a site.</p>
        </div>
      </div>
    </div>
  );
}
