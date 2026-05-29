import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useListSites, useListSitesByRegion, useListFeaturedSites } from "@workspace/api-client-react";
import { MapPin, Map, ChevronRight, Star, Layers, PanelRightClose, PanelRightOpen, Type } from "lucide-react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import mosqueIconUrl from "@assets/mosque_1779811630170.png";
import othersIconUrl from "@assets/Others_1779811630171.png";
import pilgrimageIconUrl from "@assets/Pilgrimage_site_1779811630173.png";
import palaceIconUrl from "@assets/Palace_1779811630174.png";
import shrineIconUrl from "@assets/Shrine_1779811630175.png";

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

const CATEGORIES = [
  { label: "Holy Sites",      icon: mosqueIconUrl,      color: "#FFD700", darkIcon: false, prominent: true },
  { label: "Mosque",          icon: mosqueIconUrl,      color: "#d4af37", darkIcon: false },
  { label: "Shrine",          icon: shrineIconUrl,      color: "#40bea5", darkIcon: false },
  { label: "Palace",          icon: palaceIconUrl,      color: "#b478dc", darkIcon: false },
  { label: "Pilgrimage Site", icon: pilgrimageIconUrl,  color: "#f4a7c3", darkIcon: true  },
  { label: "Islamic Landmarks", icon: othersIconUrl,      color: "#6ea8fe", darkIcon: false },
];

type CategoryLabel = (typeof CATEGORIES)[number]["label"];

function normalizeCategory(raw: string): CategoryLabel {
  const c = raw.toLowerCase().trim();
  if (c === "holy" || c === "holy site" || c === "holy sites") return "Holy Sites";
  if (c === "mosque")                             return "Mosque";
  if (c === "shrine")                             return "Shrine";
  if (c === "palace")                             return "Palace";
  if (c === "miqat" || c === "pilgrimage site")  return "Pilgrimage Site";
  return "Islamic Landmarks";
}

function getCategoryMeta(raw: string) {
  const label = normalizeCategory(raw);
  return CATEGORIES.find((c) => c.label === label) ?? CATEGORIES[CATEGORIES.length - 1];
}

const iconCache: Record<string, L.DivIcon> = {};

function makeMarkerIcon(iconUrl: string, color: string, featured: boolean, darkIcon = false, label = "") {
  const key = `${iconUrl}-${color}-${featured}-${darkIcon}-${label}`;
  if (iconCache[key]) return iconCache[key];

  const size = 22;
  const imgPad = Math.round(size * 0.22);
  const imgSize = size - imgPad * 2;
  const imgFilter = darkIcon ? "brightness(0)" : "brightness(0) invert(1)";
  const border = darkIcon ? "2px solid rgba(0,0,0,0.25)" : "2px solid rgba(255,255,255,0.35)";

  const labelHtml = label
    ? `<div style="
        position:absolute;
        top:${size + 4}px;
        left:50%;
        transform:translateX(-50%);
        white-space:nowrap;
        color:#ffffff;
        font-size:11px;
        font-weight:700;
        font-family:'IBM Plex Mono',monospace;
        text-shadow:0 1px 4px rgba(0,0,0,0.9),0 0 8px rgba(0,0,0,0.8);
        pointer-events:none;
      ">${label}</div>`
    : "";

  const icon = L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="
          width:${size}px;height:${size}px;
          background:${color};
          border-radius:50%;
          border:${border};
          box-shadow:0 2px 10px rgba(0,0,0,0.55)${featured ? ",0 0 0 3px rgba(0,0,0,0.3)" : ""};
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;
        ">
          <img
            src="${iconUrl}"
            style="width:${imgSize}px;height:${imgSize}px;filter:${imgFilter};object-fit:contain;"
          />
        </div>
        ${labelHtml}
      </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    tooltipAnchor: [size / 2, 0],
  });

  iconCache[key] = icon;
  return icon;
}

function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) });
  return null;
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
  const [selectedCategories, setSelectedCategories] = useState<CategoryLabel[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFeatured, setShowFeatured] = useState(false);
  const [zoom, setZoom] = useState(3);

  const { data: sites = [], isLoading } = useListSites();
  const { data: regions = [] } = useListSitesByRegion();
  const { data: featuredSites = [] } = useListFeaturedSites();

  const filteredByRegion = selectedRegion
    ? (sites as Site[]).filter((s) => s.region === selectedRegion)
    : (sites as Site[]);

  const regionOrFeatured = showFeatured ? (featuredSites as Site[]) : filteredByRegion;

  const displayedSites = selectedCategories.length > 0
    ? regionOrFeatured.filter((s) => selectedCategories.includes(normalizeCategory(s.category)))
    : regionOrFeatured;

  function toggleCategory(label: CategoryLabel) {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  }


  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">

      {/* ── Top nav ─────────────────────────────────────── */}
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
              : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Content row ─────────────────────────────────── */}
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

              <ZoomTracker onZoom={setZoom} />
              <FlyToRegion region={selectedRegion} sites={filteredByRegion} />

              {displayedSites.map((site) => {
                const meta = getCategoryMeta(site.category);
                return (
                  <Marker
                    key={site.id}
                    position={[site.latitude, site.longitude]}
                    icon={makeMarkerIcon(meta.icon, meta.color, site.isFeatured, meta.darkIcon)}
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
                );
              })}
            </MapContainer>
          )}

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
                  onClick={() => { setShowFeatured(false); setSelectedRegion(null); setSelectedCategories([]); }}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                    !showFeatured && !selectedRegion && selectedCategories.length === 0
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Sites
                </button>
                <button
                  onClick={() => { setShowFeatured(true); setSelectedRegion(null); setSelectedCategories([]); }}
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
              {displayedSites.map((site) => {
                const meta = getCategoryMeta(site.category);
                return (
                  <Link key={site.id} href={`/site/${site.id}`}>
                    <div className="flex items-start gap-3 p-3.5 border-b border-border/50 hover:bg-card/60 cursor-pointer transition-colors group">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
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
                );
              })}
            </div>

            {/* Legend — multi-select category filter */}
            <div className="p-3.5 border-t border-border flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Legend</p>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1">
                {CATEGORIES.map(({ label, icon, color, darkIcon, prominent }) => {
                  const active = selectedCategories.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleCategory(label)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                        active
                          ? "bg-card border border-border/80 ring-1 ring-offset-0"
                          : "hover:bg-card/50 border border-transparent"
                      } ${prominent ? "font-bold" : ""}`}
                      style={active ? { ringColor: color } : {}}
                      title={`Filter by ${label}`}
                    >
                      <div
                        className={`rounded-full flex-shrink-0 flex items-center justify-center ${prominent ? "w-7 h-7" : "w-6 h-6"}`}
                        style={{ backgroundColor: color, border: darkIcon ? "1px solid rgba(0,0,0,0.2)" : undefined }}
                      >
                        <img
                          src={icon}
                          alt={label}
                          className={`object-contain ${prominent ? "w-4 h-4" : "w-3.5 h-3.5"}`}
                          style={{ filter: darkIcon ? "brightness(0)" : "brightness(0) invert(1)" }}
                        />
                      </div>
                      <span
                        className={`text-xs transition-colors ${prominent ? "text-[13px] font-bold" : ""}`}
                        style={{ color: active ? color : undefined }}
                      >
                        {label}
                      </span>
                      {active && (
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {displayedSites.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
