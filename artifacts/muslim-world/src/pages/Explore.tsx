import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useListSites, useListSitesByRegion, useListFeaturedSites } from "@workspace/api-client-react";
import { MapPin, Map, ChevronRight, Star, Layers, PanelRightClose, PanelRightOpen } from "lucide-react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const CATEGORY_COLORS: Record<string, string> = {
  mosque: "#d4af37",
  shrine: "#40bea5",
  palace: "#b478dc",
  fortress: "#dc7850",
  city: "#6ea8fe",
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "#d4af37";
}

function makeMarkerIcon(color: string, featured: boolean) {
  const size = featured ? 18 : 14;
  const ring = featured
    ? `<circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>`
    : "";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}" viewBox="0 0 24 24">
      ${ring}
      <circle cx="12" cy="12" r="6" fill="${color}" opacity="0.95"/>
      <circle cx="12" cy="12" r="3" fill="white" opacity="0.7"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
    tooltipAnchor: [size, 0],
  });
}

function FlyToRegion({ region, sites }: { region: string | null; sites: Site[] }) {
  const map = useMap();
  if (region && sites.length > 0) {
    const lats = sites.map((s) => s.latitude);
    const lngs = sites.map((s) => s.longitude);
    const bounds = L.latLngBounds(
      [Math.min(...lats) - 3, Math.min(...lngs) - 3],
      [Math.max(...lats) + 3, Math.max(...lngs) + 3]
    );
    map.flyToBounds(bounds, { duration: 1.2, padding: [40, 40] });
  }
  return null;
}

export default function Explore() {
  const [, navigate] = useLocation();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFeatured, setShowFeatured] = useState(false);

  const { data: sites = [], isLoading } = useListSites();
  const { data: regions = [] } = useListSitesByRegion();
  const { data: featuredSites = [] } = useListFeaturedSites();

  const filteredSites = selectedRegion
    ? (sites as Site[]).filter((s) => s.region === selectedRegion)
    : (sites as Site[]);

  const displayedSites = showFeatured ? (featuredSites as Site[]) : filteredSites;

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">

      {/* ── Full-width top nav ───────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-background/95 border-b border-border z-30 flex-shrink-0">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <span className="text-primary text-xs font-arabic font-bold">م</span>
            </div>
            <span className="text-sm font-bold text-foreground">The Muslim World</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground">
            <Map className="w-3 h-3 text-primary" />
            <span>{displayedSites.length} sites</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Hide panel" : "Show panel"}
            className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            {sidebarOpen
              ? <PanelRightClose className="w-4 h-4" />
              : <PanelRightOpen className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      {/* ── Content row ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Map */}
        <div className="relative flex-1 min-w-0">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground text-sm">Loading sacred sites…</p>
            </div>
          ) : (
            <MapContainer
              center={[24, 40]}
              zoom={3}
              minZoom={2}
              maxZoom={16}
              zoomControl={false}
              maxBounds={[[-90, -180], [90, 180]]}
              maxBoundsViscosity={1.0}
              style={{ height: "100%", width: "100%", background: "#0d1117" }}
              className="explore-map"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                subdomains="abcd"
                maxZoom={19}
              />

              <FlyToRegion region={selectedRegion} sites={filteredSites} />

              {displayedSites.map((site) => (
                <Marker
                  key={site.id}
                  position={[site.latitude, site.longitude]}
                  icon={makeMarkerIcon(getCategoryColor(site.category), site.isFeatured)}
                  eventHandlers={{ click: () => navigate(`/site/${site.id}`) }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -8]}
                    opacity={1}
                    className="explore-tooltip"
                  >
                    <div className="text-center min-w-[120px]">
                      <p className="font-semibold text-sm text-foreground leading-tight">{site.name}</p>
                      <p className="font-arabic text-xs text-primary/70 mt-0.5" dir="rtl">{site.arabicName}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{site.country}</span>
                      </div>
                      <p className="text-xs text-primary/80 mt-1">Click to explore →</p>
                    </div>
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>
          )}

          {/* Mobile-only overlay toggle (bottom-right fab) */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute bottom-6 right-4 z-20 lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg text-xs font-semibold"
            >
              <Layers className="w-4 h-4" />
              Sites
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div
          className={`
            flex-shrink-0 border-l border-border bg-background/98 flex flex-col overflow-hidden
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? "w-[272px]" : "w-0"}
            max-lg:fixed max-lg:top-[49px] max-lg:right-0 max-lg:h-[calc(100vh-49px)] max-lg:z-40
          `}
        >
          {/* Inner wrapper prevents content flash during collapse */}
          <div className="w-[272px] flex flex-col h-full overflow-hidden">

            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
              <h2 className="font-bold text-foreground">Islamic Sites</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Click a marker or site to explore</p>
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-border flex-shrink-0 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowFeatured(false); setSelectedRegion(null); }}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                    !showFeatured && !selectedRegion
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Sites
                </button>
                <button
                  onClick={() => { setShowFeatured(true); setSelectedRegion(null); }}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                    showFeatured
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className="w-3 h-3" />
                  Featured
                </button>
              </div>
              <select
                value={selectedRegion ?? ""}
                onChange={(e) => { setSelectedRegion(e.target.value || null); setShowFeatured(false); }}
                className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">All Regions</option>
                {(regions as { region: string; count: number }[]).map((r) => (
                  <option key={r.region} value={r.region}>{r.region} ({r.count})</option>
                ))}
              </select>
            </div>

            {/* Site list */}
            <div className="flex-1 overflow-y-auto">
              {displayedSites.map((site) => (
                <Link key={site.id} href={`/site/${site.id}`}>
                  <div className="flex items-start gap-3 p-3.5 border-b border-border/50 hover:bg-card/60 cursor-pointer transition-colors group">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: getCategoryColor(site.category) }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {site.name}
                      </p>
                      <p className="font-arabic text-xs text-primary/50 truncate" dir="rtl">{site.arabicName}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{site.country}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Legend */}
            <div className="p-3.5 border-t border-border flex-shrink-0">
              <p className="text-xs font-medium text-muted-foreground mb-2">Legend</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(CATEGORY_COLORS).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-muted-foreground capitalize">{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
