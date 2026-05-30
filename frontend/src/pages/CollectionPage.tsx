import { Link } from "wouter";
import { ArrowLeft, Star, MapPin, Trash2, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/context/CollectionContext";
import { useListSites } from "@workspace/api-client-react";

export default function CollectionPage() {
  const { user } = useAuth();
  const { collectedIds, toggle, isLoaded } = useCollection();
  const { data: allSites = [] } = useListSites();

  const savedSites = allSites.filter(s => collectedIds.has(s.id));

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4" style={{ background: "#05080c" }}>
        <Star className="w-12 h-12" style={{ color: "#39b16340" }} />
        <h1 className="text-2xl font-bold text-white">My Collection</h1>
        <p className="text-sm max-w-xs" style={{ color: "#5a7a9a" }}>
          Sign in to save and manage your personal collection of Islamic heritage sites.
        </p>
        <Link href="/auth">
          <button
            className="px-6 py-2.5 text-sm font-mono tracking-widest uppercase transition-all"
            style={{ background: "#39b16320", border: "1px solid #39b16360", color: "#39b163", borderRadius: "2px" }}
          >
            Sign In
          </button>
        </Link>
        <Link href="/">
          <button className="text-xs" style={{ color: "#3d5066" }}>← Back to home</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#05080c", color: "#d8e0ea" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1a2a3a" }}>
        <Link href="/">
          <button className="flex items-center gap-2 text-sm transition-colors" style={{ color: "#5a7a9a" }}>
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" style={{ color: "#39b163" }} fill="#39b163" />
          <span className="text-sm font-mono tracking-widest uppercase" style={{ color: "#39b163" }}>My Collection</span>
        </div>
        <div className="text-xs font-mono" style={{ color: "#3d5066" }}>
          {collectedIds.size} {collectedIds.size === 1 ? "site" : "sites"}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#39b163" }}>// SAVED SITES</p>
          <h1 className="text-3xl font-bold text-white">My Collection</h1>
          <p className="text-sm mt-1" style={{ color: "#5a7a9a" }}>
            {user.displayName}'s curated archive of Islamic heritage sites
          </p>
        </div>

        {!isLoaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-lg animate-pulse" style={{ background: "#0d1520" }} />
            ))}
          </div>
        ) : savedSites.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#39b16310", border: "1px solid #39b16330" }}>
              <Star className="w-7 h-7" style={{ color: "#39b16360" }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white mb-1">No sites saved yet</p>
              <p className="text-sm max-w-xs" style={{ color: "#5a7a9a" }}>
                Star any mosque, shrine, or heritage site to add it here.
              </p>
            </div>
            <Link href="/explore">
              <button
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-mono tracking-widest uppercase transition-all"
                style={{ background: "#39b16320", border: "1px solid #39b16360", color: "#39b163", borderRadius: "2px" }}
              >
                <BookOpen className="w-4 h-4" /> Explore Sites
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSites.map(site => (
              <div
                key={site.id}
                className="group relative rounded-lg overflow-hidden transition-all duration-200"
                style={{ background: "#0d1520", border: "1px solid #1a2a3a" }}
              >
                <Link href={`/site/${site.id}`}>
                  <div className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5"
                        style={{ color: "#39b163", background: "#39b16315", border: "1px solid #39b16330", borderRadius: "2px" }}
                      >
                        {site.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors leading-tight">
                      {site.name}
                    </h3>
                    <p className="font-arabic text-base mb-3" dir="rtl" style={{ color: "#39b16360" }}>
                      {site.arabicName}
                    </p>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#5a7a9a" }}>
                      {site.shortDescription}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: "#3d5066" }}>
                      <MapPin className="w-3 h-3" />
                      <span>{site.country} · {site.region}</span>
                    </div>
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  onClick={(e) => { e.preventDefault(); toggle(site.id); }}
                  title="Remove from collection"
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-all"
                  style={{ background: "#1a0808", border: "1px solid #ff444430", color: "#ff6666" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
