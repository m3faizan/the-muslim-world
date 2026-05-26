import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListFeaturedSites, useListSitesByRegion } from "@workspace/api-client-react";
import { ArrowRight, Map, User, LogOut, BookOpen, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/context/CollectionContext";

const HERO_PHOTOS = [
  { url: "/site-images/hero-calligraphy.png", label: "Islamic Calligraphy · The Written Word of the Faith" },
  { url: "/site-images/masjid-al-haram.png", label: "Masjid Al-Haram · Mecca, Saudi Arabia" },
  { url: "/site-images/al-azhar.jpg",  label: "Al-Azhar Mosque · Cairo, Egypt" },
  { url: "/site-images/dome-of-the-rock.jpg", label: "Dome of the Rock · Jerusalem, Palestine" },
  { url: "/site-images/masjid-an-nabawi.jpg", label: "Masjid An-Nabawi · Medina, Saudi Arabia" },
  { url: "/site-images/cordoba.jpg",   label: "Great Mosque of Córdoba · Spain" },
  { url: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1920&q=90", label: "Badshahi Mosque · Lahore, Pakistan" },
];

const SITE_PHOTOS: Record<string, string> = {
  "Masjid Al-Haram":         "/site-images/masjid-al-haram.png",
  "Masjid An-Nabawi":        "/site-images/masjid-an-nabawi.jpg",
  "Masjid Al-Aqsa":          "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1200&q=85",
  "Dome of the Rock":        "/site-images/dome-of-the-rock.jpg",
  "Blue Mosque":             "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=85",
  "Hagia Sophia":            "/site-images/hagia-sophia.jpg",
  "Alhambra Palace":         "/site-images/alhambra.jpg",
  "Great Mosque of Cordoba": "/site-images/cordoba.jpg",
  "Imam Mosque":             "https://images.unsplash.com/photo-1545167630-1c073ce95609?auto=format&fit=crop&w=1200&q=85",
  "Badshahi Mosque":         "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=85",
  "Al-Azhar Mosque":         "/site-images/al-azhar.jpg",
};

const CATEGORY_COLORS: Record<string, string> = {
  mosque: "#39b163",
  shrine: "#3bb5a0",
  palace: "#9b7dc8",
  fortress: "#c87840",
  city: "#5a8fc4",
  Mosque: "#39b163",
  Shrine: "#3bb5a0",
  Miqat: "#d4962a",
  "Pilgrimage Site": "#c84040",
};

const HISTORY: { year: string; event: string; loc: string }[] = [
  { year: "610 CE",  loc: "Mecca, Arabia",          event: "First Quranic revelation to Prophet Muhammad (PBUH) in the Cave of Hira" },
  { year: "622 CE",  loc: "Medina, Arabia",          event: "The Hijra — migration establishes the Islamic calendar and first Muslim state" },
  { year: "630 CE",  loc: "Mecca, Arabia",           event: "Conquest of Mecca; the Kaaba restored to monotheistic worship" },
  { year: "691 CE",  loc: "Jerusalem, Levant",       event: "Dome of the Rock completed by Caliph Abd al-Malik ibn Marwan" },
  { year: "784 CE",  loc: "Córdoba, Andalusia",      event: "Abd al-Rahman I begins construction of the Great Mosque of Córdoba" },
  { year: "1258 CE", loc: "Baghdad, Iraq",           event: "Mongol sack of Baghdad ends the Abbasid Caliphate's golden era" },
  { year: "1453 CE", loc: "Constantinople, Anatolia",event: "Ottoman conquest; Hagia Sophia converted to a mosque under Sultan Mehmed II" },
  { year: "1648 CE", loc: "Agra & Delhi, South Asia",event: "Mughal Empire at zenith — Taj Mahal and Jama Masjid Delhi completed" },
];

const REGION_ARABIC: Record<string, string> = {
  "Arabian Peninsula": "الجزيرة العربية",
  "Levant":            "بلاد الشام",
  "Anatolia":          "الأناضول",
  "Andalusia":         "الأندلس",
  "Persia":            "بلاد فارس",
  "South Asia":        "جنوب آسيا",
  "North Africa":      "شمال أفريقيا",
  "Sub-Saharan Africa":"أفريقيا جنوب الصحراء",
  "Southeast Asia":    "جنوب شرق آسيا",
  "Middle East":       "الشرق الأوسط",
};

function SiteCard({ site, wide = false }: { site: any; wide?: boolean }) {
  const photo = SITE_PHOTOS[site.name];
  const accentColor = CATEGORY_COLORS[site.category] ?? "#39b163";
  const { user } = useAuth();
  const { collectedIds, toggle } = useCollection();
  const saved = collectedIds.has(site.id);

  return (
    <Link href={`/site/${site.id}`}>
      <div
        className={`group relative overflow-hidden cursor-pointer border border-[#1c2530] hover:border-[#39b163]/40 transition-all duration-300 ${wide ? "h-[480px]" : "h-[300px]"}`}
        style={{ borderRadius: "2px" }}
      >
        {/* Photo or pattern fallback */}
        {photo ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-500 group-hover:scale-105 group-hover:brightness-75"
            style={{ backgroundImage: `url(${photo})` }}
          />
        ) : (
          <div className="absolute inset-0 islamic-pattern-bg transition-all duration-500 group-hover:brightness-75" style={{ background: "#0a0f14" }} />
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,8,12,0.97) 0%, rgba(5,8,12,0.5) 50%, rgba(5,8,12,0.2) 100%)" }} />

        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span
            className="text-[10px] font-mono tracking-[0.15em] uppercase px-2 py-1 border"
            style={{ color: accentColor, borderColor: `${accentColor}40`, background: `${accentColor}12`, borderRadius: "1px" }}
          >
            {site.category}
          </span>
        </div>

        {/* Arabic name — decorative */}
        <div
          className="absolute top-4 right-4 font-arabic text-3xl opacity-20 pointer-events-none select-none"
          style={{ color: accentColor }}
          dir="rtl"
        >
          {site.arabicName?.slice(0, 3)}
        </div>

        {/* Star / save button */}
        {user && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(site.id); }}
            title={saved ? "Remove from collection" : "Save to collection"}
            className="absolute bottom-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded transition-all opacity-0 group-hover:opacity-100"
            style={{
              background: saved ? "#39b16325" : "rgba(5,8,12,0.7)",
              border: `1px solid ${saved ? "#39b16370" : "#2a3a4d"}`,
              color: saved ? "#39b163" : "#5a7a9a",
            }}
          >
            <Star className="w-3.5 h-3.5" fill={saved ? "#39b163" : "none"} />
          </button>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-[11px] font-mono tracking-[0.12em] text-[#6b8099] uppercase mb-2">
            {site.country} · {site.region}
          </p>
          <h3 className={`font-bold text-white leading-tight mb-2 group-hover:text-[#39b163] transition-colors ${wide ? "text-2xl" : "text-lg"}`}>
            {site.name}
          </h3>
          <p className="text-[13px] text-[#7a90a8] leading-relaxed line-clamp-2">
            {site.shortDescription}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] font-mono tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accentColor }}>
            <span>VIEW SITE</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const { data: featured = [], isLoading: featuredLoading } = useListFeaturedSites();
  const { data: regions = [] } = useListSitesByRegion();
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeLayer, setActiveLayer] = useState<"a" | "b">("a");
  const [photoA, setPhotoA] = useState(HERO_PHOTOS[0]);
  const [photoB, setPhotoB] = useState(HERO_PHOTOS[1 % HERO_PHOTOS.length]);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((curr) => {
        const next = (curr + 1) % HERO_PHOTOS.length;
        setActiveLayer((layer) => {
          if (layer === "a") { setPhotoB(HERO_PHOTOS[next]); return "b"; }
          else { setPhotoA(HERO_PHOTOS[next]); return "a"; }
        });
        return next;
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const totalSites = regions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="min-h-screen text-[#d8e0ea]" style={{ background: "#05080c", fontFamily: "'IBM Plex Mono', 'Menlo', monospace" }}>

      {/* ── NAVIGATION ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-14 border-b" style={{ background: "rgba(5,8,12,0.92)", borderColor: "#1c2530", backdropFilter: "blur(12px)" }}>
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="30,4 34.2,19.8 48.4,11.6 40.2,25.8 56,30 40.2,34.2 48.4,48.4 34.2,40.2 30,56 25.8,40.2 11.6,48.4 19.8,34.2 4,30 19.8,25.8 11.6,11.6 25.8,19.8" fill="none" stroke="#39b163" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-mono tracking-[0.2em] text-[#39b163] uppercase leading-none">The Muslim World</div>
              <div className="text-[10px] font-mono tracking-[0.15em] text-[#3d5066] uppercase leading-none mt-0.5">Heritage Archive</div>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/explore">
            <span className="text-[13px] font-mono tracking-[0.08em] text-[#6b8099] hover:text-[#39b163] transition-colors cursor-pointer uppercase">Explore Map</span>
          </Link>
          {user ? (
            <>
              <Link href="/tracker">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono tracking-[0.08em] uppercase transition-all hover:text-[#39b163]" style={{ color: "#6b8099" }}>
                  <BookOpen className="w-3.5 h-3.5" />
                  My Journey
                </button>
              </Link>
              <Link href="/collection">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono tracking-[0.08em] uppercase transition-all hover:text-[#39b163]" style={{ color: "#6b8099" }}>
                  <Star className="w-3.5 h-3.5" />
                  Collection
                </button>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: "#0c1a28", border: "1px solid #1a2a3a" }}>
                <User className="w-3.5 h-3.5" style={{ color: "#39b163" }} />
                <span className="text-[12px] font-mono" style={{ color: "#d8e0ea" }}>{user.displayName}</span>
                <button onClick={() => logout()} title="Sign out">
                  <LogOut className="w-3.5 h-3.5 ml-1" style={{ color: "#5a7a9a" }} />
                </button>
              </div>
            </>
          ) : (
            <Link href="/auth">
              <button className="flex items-center gap-2 px-4 py-1.5 text-[12px] font-mono tracking-[0.08em] uppercase transition-all hover:bg-[#39b163]/10" style={{ border: "1px solid #39b16360", color: "#39b163", borderRadius: "2px" }}>
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
            </Link>
          )}
          <Link href="/explore">
            <button
              className="flex items-center gap-2 px-5 py-2 text-[12px] font-mono tracking-[0.1em] uppercase transition-all hover:bg-[#39b163]/10"
              style={{ border: "1px solid #39b163", color: "#39b163", borderRadius: "2px" }}
            >
              <Map className="w-3.5 h-3.5" />
              Launch Map
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-end pb-0 pt-14 overflow-hidden">

        {/* Layer A */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${photoA.url})`,
            opacity: activeLayer === "a" ? 1 : 0,
            transition: "opacity 1.4s ease-in-out",
            zIndex: 0,
          }}
        />
        {/* Layer B */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${photoB.url})`,
            opacity: activeLayer === "b" ? 1 : 0,
            transition: "opacity 1.4s ease-in-out",
            zIndex: 1,
          }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(5,8,12,0.96) 0%, rgba(5,8,12,0.65) 50%, rgba(5,8,12,0.82) 100%)", zIndex: 2 }} />

        {/* Islamic geometric pattern overlay */}
        <div className="absolute inset-0 islamic-pattern-bg opacity-20 pointer-events-none" style={{ zIndex: 3 }} />

        {/* Vertical gold line — decorative structural element */}
        <div className="absolute left-8 top-24 bottom-0 w-px" style={{ background: "linear-gradient(to bottom, #39b163, #39b16300)", zIndex: 4 }} />

        {/* Photo credit — bottom right */}
        <div className="absolute bottom-[88px] right-6 z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            {HERO_PHOTOS.map((_, i) => (
              <div
                key={i}
                className="transition-all duration-700"
                style={{
                  width: i === heroIndex ? "20px" : "4px",
                  height: "2px",
                  background: i === heroIndex ? "#39b163" : "#2a3a4d",
                  borderRadius: "1px",
                }}
              />
            ))}
            <span className="text-[10px] font-mono tracking-[0.12em] ml-2" style={{ color: "#3d5066" }}>
              {HERO_PHOTOS[heroIndex].label}
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-8 pb-20 pt-24 w-full grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-7">
            {/* Classification label */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-3 h-px" style={{ background: "#39b163" }} />
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase" style={{ color: "#39b163" }}>
                Heritage Intelligence — Est. 622 CE
              </span>
            </div>

            {/* H1 */}
            <h1
              className="font-bold leading-[1.05] mb-6"
              style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)", color: "#edf2f7", letterSpacing: "-0.02em" }}
            >
              Fourteen Centuries<br />
              <span style={{ color: "#39b163" }}>of Islamic Civilization</span>
            </h1>

            {/* Arabic subtitle */}
            <p className="font-arabic text-2xl mb-5 tracking-wide" dir="rtl" style={{ color: "#39b16380" }}>
              العالم الإسلامي
            </p>

            <p className="text-[15px] leading-relaxed mb-10 max-w-xl" style={{ color: "#7a90a8" }}>
              A curated archive of Islamic heritage sites — sacred mosques, historic palaces, and holy monuments — documenting the breadth of a civilization that shaped science, architecture, and philosophy across six world regions.
            </p>

            <div className="flex items-center gap-4">
              <Link href="/explore">
                <button
                  className="flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-mono tracking-[0.12em] uppercase transition-all hover:brightness-110"
                  style={{ background: "#39b163", color: "#05080c", borderRadius: "2px", fontWeight: 700 }}
                >
                  <Map className="w-4 h-4" />
                  Explore the Map
                </button>
              </Link>
              <a href="#sites">
                <button
                  className="flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-mono tracking-[0.12em] uppercase transition-all hover:bg-white/5"
                  style={{ border: "1px solid #2a3a4d", color: "#8a9eb5", borderRadius: "2px" }}
                >
                  Browse Sites
                  <ArrowRight className="w-4 h-4" />
                </button>
              </a>
            </div>
          </div>

          {/* Right column — mosque names synced with hero */}
          <div className="hidden lg:flex col-span-5 flex-col items-end justify-center gap-6 text-right">
            {[
              { ar: "مسجد الحرام", en: "Masjid Al-Haram", sub: "Mecca, Saudi Arabia" },
              { ar: "المسجد الأقصى", en: "Masjid Al-Aqsa", sub: "Jerusalem, Palestine" },
              { ar: "قبة الصخرة", en: "Dome of the Rock", sub: "Jerusalem, Palestine" },
              { ar: "المسجد النبوي", en: "Masjid An-Nabawi", sub: "Medina, Saudi Arabia" },
              { ar: "جامع الأزهر", en: "Al-Azhar Mosque", sub: "Cairo, Egypt" },
              { ar: "مسجد كوردوبا", en: "Great Mosque of Cordoba", sub: "Cordoba, Spain" },
            ].map((item, i) => (
              <div
                key={i}
                className="border-r-2 pr-4 transition-all duration-700"
                style={{
                  borderColor: i === heroIndex ? "#39b163" : "#1c2530",
                  opacity: i === heroIndex ? 1 : 0.35,
                  transform: i === heroIndex ? "translateX(0)" : "translateX(6px)",
                }}
              >
                <p className="font-arabic text-xl leading-none transition-colors duration-700" style={{ color: i === heroIndex ? "#39b163" : "#3d5066" }} dir="rtl">{item.ar}</p>
                <p className="text-[11px] font-mono tracking-[0.12em] uppercase mt-1 transition-colors duration-700" style={{ color: i === heroIndex ? "#8a9eb5" : "#2d3f52" }}>{item.en}</p>
                <p className="text-[10px] font-mono transition-colors duration-700" style={{ color: i === heroIndex ? "#4d617a" : "#2d3f52" }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar — bottom of hero */}
        <div className="relative z-10 border-t" style={{ borderColor: "#1c2530", background: "rgba(5,8,12,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-4">
            {[
              { value: String(totalSites || "15").padStart(2, "0"), label: "Documented Sites", sub: "and growing" },
              { value: String(regions.length || "6").padStart(2, "0"), label: "World Regions", sub: "across 3 continents" },
              { value: "10+", label: "Countries", sub: "documented" },
              { value: "1,400", label: "Years of History", sub: "610 CE to present" },
            ].map((s, i) => (
              <div key={i} className="px-6 py-5 border-r last:border-r-0" style={{ borderColor: "#1c2530" }}>
                <div className="text-3xl font-mono font-bold" style={{ color: "#39b163", letterSpacing: "-0.03em" }}>{s.value}</div>
                <div className="text-[12px] font-medium mt-0.5" style={{ color: "#d8e0ea" }}>{s.label}</div>
                <div className="text-[11px] font-mono mt-0.5" style={{ color: "#3d5066" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROADCAST STRIP ─────────────────────────────────────── */}
      <div className="border-b" style={{ borderColor: "#1c2530", background: "#070c10" }}>
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center gap-6 overflow-hidden">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase flex-shrink-0" style={{ color: "#39b163" }}>// ARCHIVE STATUS</span>
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
            {[
              `${totalSites || 15} SITES CATALOGUED`,
              `${regions.length || 6} REGIONS COVERED`,
              "3D MODELS: ACTIVE",
              "HOTSPOT ANNOTATIONS: ENABLED",
              "LAST UPDATED: 2025",
            ].map((item) => (
              <span key={item} className="text-[10px] font-mono tracking-[0.15em] whitespace-nowrap flex-shrink-0" style={{ color: "#3d5066" }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURED SITES ──────────────────────────────────────── */}
      <section id="sites" className="py-20 px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 border-b pb-5" style={{ borderColor: "#1c2530" }}>
          <div>
            <p className="text-[11px] font-mono tracking-[0.25em] uppercase mb-2" style={{ color: "#39b163" }}>// Featured Sites</p>
            <h2 className="text-3xl font-bold" style={{ color: "#edf2f7", letterSpacing: "-0.02em" }}>Iconic Landmarks</h2>
            <p className="font-arabic text-base mt-1" style={{ color: "#3d5066" }} dir="rtl">المواقع المميزة</p>
          </div>
          <Link href="/explore">
            <button
              className="flex items-center gap-2 text-[12px] font-mono tracking-[0.1em] uppercase transition-all hover:text-[#39b163]"
              style={{ color: "#3d5066" }}
            >
              View All Sites
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse" style={{ background: "#0c1219", borderRadius: "2px" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Custom row: Masjid Al-Haram (55%) + Masjid An-Nabawi (45%) */}
            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-4">
              {featured
                .filter((s) => s.name === "Masjid Al-Haram")
                .map((site) => (
                  <SiteCard key={site.id} site={site} wide />
                ))}
              {featured
                .filter((s) => s.name === "Masjid An-Nabawi")
                .map((site) => (
                  <SiteCard key={site.id} site={site} wide />
                ))}
            </div>
            {/* Four normal cards */}
            {featured
              .filter((s) =>
                ["Dome of the Rock", "Al-Azhar Mosque", "Alhambra Palace", "Great Mosque of Cordoba"].includes(s.name)
              )
              .map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
          </div>
        )}
      </section>

      {/* ── HISTORICAL RECORD ───────────────────────────────────── */}
      <section className="py-20 px-8 border-t" style={{ borderColor: "#1c2530", background: "#060a0e" }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-[11px] font-mono tracking-[0.25em] uppercase mb-2" style={{ color: "#39b163" }}>// Historical Record</p>
            <h2 className="text-3xl font-bold" style={{ color: "#edf2f7", letterSpacing: "-0.02em" }}>Key Moments in Islamic History</h2>
          </div>

          <div className="space-y-0">
            {HISTORY.map((item, i) => (
              <div
                key={i}
                className="group grid grid-cols-12 gap-6 border-t py-5 transition-all hover:bg-white/[0.02]"
                style={{ borderColor: "#131c25" }}
              >
                <div className="col-span-12 sm:col-span-2">
                  <span className="text-[13px] font-mono font-bold" style={{ color: "#39b163" }}>{item.year}</span>
                </div>
                <div className="col-span-12 sm:col-span-3">
                  <span className="text-[11px] font-mono tracking-[0.08em] uppercase" style={{ color: "#3d5066" }}>{item.loc}</span>
                </div>
                <div className="col-span-12 sm:col-span-7">
                  <p className="text-[14px] leading-relaxed" style={{ color: "#8a9eb5" }}>{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGIONS TABLE ──────────────────────────────────────── */}
      <section className="py-20 px-8 border-t" style={{ borderColor: "#1c2530" }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-[11px] font-mono tracking-[0.25em] uppercase mb-2" style={{ color: "#39b163" }}>// Geographic Distribution</p>
            <h2 className="text-3xl font-bold" style={{ color: "#edf2f7", letterSpacing: "-0.02em" }}>Explore by Region</h2>
          </div>

          <div className="border" style={{ borderColor: "#1c2530", borderRadius: "2px" }}>
            {/* Table header */}
            <div
              className="grid grid-cols-12 gap-4 px-5 py-3 border-b text-[10px] font-mono tracking-[0.2em] uppercase"
              style={{ borderColor: "#1c2530", color: "#3d5066", background: "#070c10" }}
            >
              <span className="col-span-1">#</span>
              <span className="col-span-4">Region</span>
              <span className="col-span-3">Arabic Name</span>
              <span className="col-span-2">Sites</span>
              <span className="col-span-2 text-right">Explore</span>
            </div>
            {regions.map((group, i) => (
              <Link key={group.region} href="/explore">
                <div
                  className="grid grid-cols-12 gap-4 px-5 py-4 border-b last:border-b-0 cursor-pointer group transition-all hover:bg-[#39b163]/[0.04]"
                  style={{ borderColor: "#131c25" }}
                >
                  <span className="col-span-1 text-[11px] font-mono" style={{ color: "#2a3a4d" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="col-span-4 text-[14px] font-medium group-hover:text-[#39b163] transition-colors" style={{ color: "#c8d4e0" }}>
                    {group.region}
                  </span>
                  <span className="col-span-3 font-arabic text-base" dir="rtl" style={{ color: "#3d5066" }}>
                    {REGION_ARABIC[group.region] ?? ""}
                  </span>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-sm overflow-hidden" style={{ background: "#1c2530" }}>
                      <div
                        className="h-full"
                        style={{ width: `${(group.count / Math.max(...regions.map(r => r.count))) * 100}%`, background: "#39b163", opacity: 0.7 }}
                      />
                    </div>
                    <span className="text-[12px] font-mono" style={{ color: "#6b8099" }}>{group.count}</span>
                  </div>
                  <div className="col-span-2 flex justify-end items-center">
                    <span className="text-[11px] font-mono tracking-[0.1em] uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" style={{ color: "#39b163" }}>
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-8 border-t" style={{ borderColor: "#1c2530", background: "#060a0e" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-mono tracking-[0.25em] uppercase mb-4" style={{ color: "#39b163" }}>// Begin Exploration</p>
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#edf2f7", letterSpacing: "-0.02em" }}>Discover the Islamic World</h2>
          <p className="text-[15px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "#5a7080" }}>
            Navigate an interactive map, explore 3D architectural models, and read the history of each site — from the Kaaba to the Alhambra.
          </p>
          <Link href="/explore">
            <button
              className="inline-flex items-center gap-3 px-8 py-4 text-[13px] font-mono tracking-[0.15em] uppercase font-bold transition-all hover:brightness-110 active:scale-[0.99]"
              style={{ background: "#39b163", color: "#05080c", borderRadius: "2px" }}
            >
              <Map className="w-4 h-4" />
              Launch Interactive Map
            </button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t py-8 px-8" style={{ borderColor: "#131c25" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="30,4 34.2,19.8 48.4,11.6 40.2,25.8 56,30 40.2,34.2 48.4,48.4 34.2,40.2 30,56 25.8,40.2 11.6,48.4 19.8,34.2 4,30 19.8,25.8 11.6,11.6 25.8,19.8" fill="none" stroke="#39b163" strokeWidth="1.5" opacity="0.6" />
            </svg>
            <span className="text-[11px] font-mono tracking-[0.15em] uppercase" style={{ color: "#2a3a4d" }}>The Muslim World — Heritage Archive</span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: "#1e2d3d" }}>Documentation ongoing · All regions</span>
        </div>
      </footer>
    </div>
  );
}
