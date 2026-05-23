import { Link } from "wouter";
import { useListFeaturedSites, useListSitesByRegion } from "@workspace/api-client-react";
import { MapPin, Globe, ChevronRight, Star } from "lucide-react";

export default function Home() {
  const { data: featured, isLoading: featuredLoading } = useListFeaturedSites();
  const { data: regions } = useListSitesByRegion();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <span className="text-primary text-sm font-arabic font-bold">م</span>
          </div>
          <span className="text-lg font-bold tracking-wide text-foreground">The Muslim World</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/explore">
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors">Explore</button>
          </Link>
          <Link href="/explore">
            <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
              Open Globe
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 geometric-bg overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto page-enter">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-8">
            <Star className="w-3.5 h-3.5" />
            <span>Explore 1,400 Years of Islamic Heritage</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-4 leading-tight">
            The Muslim
            <span className="text-primary"> World</span>
          </h1>

          <p className="font-arabic text-2xl sm:text-3xl text-primary/70 mb-6 tracking-wider" dir="rtl">
            العالم الإسلامي
          </p>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Journey through centuries of Islamic civilization. Explore sacred mosques, 
            historic palaces, and holy sites across the globe — each telling a story 
            of faith, knowledge, and human achievement.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore">
              <button className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all gold-glow">
                <Globe className="w-5 h-5" />
                Explore the Globe
              </button>
            </Link>
            <a href="#featured" className="flex items-center gap-2 px-8 py-4 border border-border rounded-xl text-foreground font-semibold text-lg hover:bg-card transition-colors">
              View Featured Sites
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Decorative Arabic calligraphy */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-primary/10 font-arabic text-6xl pointer-events-none select-none" dir="rtl">
          بسم الله الرحمن الرحيم
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-border/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "14+", label: "Heritage Sites" },
              { value: "10+", label: "Countries" },
              { value: "6", label: "Regions" },
              { value: "1,400", label: "Years of History" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Sites */}
      <section id="featured" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Featured Sites</h2>
            <p className="text-muted-foreground font-arabic text-lg" dir="rtl">المواقع المميزة</p>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Begin your journey with these iconic landmarks of Islamic heritage
            </p>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-card animate-pulse border border-border" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured?.map((site) => (
                <Link key={site.id} href={`/site/${site.id}`}>
                  <div className="group cursor-pointer rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 overflow-hidden">
                    {/* Site image placeholder with gradient */}
                    <div className="h-40 bg-gradient-to-br from-secondary/20 to-primary/10 relative overflow-hidden geometric-bg">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-arabic text-4xl text-primary/30" dir="rtl">
                          {site.arabicName.slice(0, 2)}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>{site.country}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 text-xs rounded-full border border-primary/30 bg-primary/10 text-primary capitalize">
                          {site.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors mb-0.5">
                        {site.name}
                      </h3>
                      <p className="font-arabic text-sm text-primary/60 mb-3" dir="rtl">{site.arabicName}</p>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                        {site.shortDescription}
                      </p>
                      <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium">
                        <span>Explore Site</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Regions */}
      {regions && regions.length > 0 && (
        <section className="py-20 px-6 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3">Explore by Region</h2>
              <p className="text-muted-foreground">Islamic heritage spans every corner of the world</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {regions.map((group) => (
                <Link key={group.region} href="/explore">
                  <div className="group cursor-pointer rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:bg-card/80 transition-all">
                    <div className="font-arabic text-xl text-primary/40 mb-2 text-right" dir="rtl">
                      {getArabicRegion(group.region)}
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{group.region}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{group.count} site{group.count !== 1 ? "s" : ""}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-6 geometric-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Explore?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Spin the globe, discover sacred sites, and dive into the details of 1,400 years of Islamic civilization.
          </p>
          <Link href="/explore">
            <button className="flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg mx-auto hover:bg-primary/90 transition-all gold-glow">
              <Globe className="w-6 h-6" />
              Launch the Globe
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6 text-center text-muted-foreground text-sm">
        <p className="font-arabic text-base text-primary/40 mb-2" dir="rtl">بسم الله الرحمن الرحيم</p>
        <p>The Muslim World — An interactive journey through Islamic heritage</p>
      </footer>
    </div>
  );
}

function getArabicRegion(region: string): string {
  const map: Record<string, string> = {
    "Arabian Peninsula": "الجزيرة العربية",
    "Levant": "بلاد الشام",
    "Anatolia": "الأناضول",
    "Andalusia": "الأندلس",
    "Persia": "بلاد فارس",
    "South Asia": "جنوب آسيا",
    "North Africa": "شمال أفريقيا",
    "Sub-Saharan Africa": "أفريقيا جنوب الصحراء",
    "Central Asia": "آسيا الوسطى",
    "Southeast Asia": "جنوب شرق آسيا",
  };
  return map[region] ?? region;
}
