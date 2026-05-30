import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useListSites } from "@workspace/api-client-react";
import { apiFetch } from "@/lib/api";
import { MapPin, CheckCircle2, BookOpen, ArrowLeft, Globe } from "lucide-react";

type SiteLog = {
  siteId: number;
  visited: boolean;
  prayed: boolean;
};

export default function TrackerPage() {
  const { user } = useAuth();
  const { data: sites = [] } = useListSites();
  const [logs, setLogs] = useState<SiteLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/auth/logs")
      .then((r) => r.json())
      .then((data) => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async (siteId: number, field: "visited" | "prayed") => {
    const existing = logs.find((l) => l.siteId === siteId);
    const current = existing?.[field] ?? false;
    const res = await apiFetch(`/api/auth/logs/${siteId}`, {
      method: "POST",
      body: JSON.stringify({ [field]: !current }),
    });
    if (res.ok) {
      const updated: SiteLog = await res.json();
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.siteId === siteId);
        if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
        return [...prev, updated];
      });
    }
  };

  const visitedCount = logs.filter((l) => l.visited).length;
  const prayedCount = logs.filter((l) => l.prayed).length;

  const getLog = (siteId: number) => logs.find((l) => l.siteId === siteId);

  return (
    <div className="min-h-screen text-[#d8e0ea]" style={{ background: "#05080c" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1a2a3a" }}>
        <Link href="/">
          <button className="flex items-center gap-2 text-sm transition-colors" style={{ color: "#5a7a9a" }}>
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#c9a22720", border: "1px solid #c9a22740" }}>
            <span className="font-arabic text-xs" style={{ color: "#c9a227" }}>م</span>
          </div>
          <span className="text-sm font-bold">The Muslim World</span>
        </div>
        <div className="text-sm" style={{ color: "#5a7a9a" }}>{user?.displayName}</div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: "#c9a227" }}>Personal Archive</p>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#d8e0ea" }}>My Journey</h1>
          <p className="text-sm" style={{ color: "#5a7a9a" }}>Track the sacred sites you've visited and prayed at</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="rounded-xl p-6 border" style={{ background: "#0c1218", borderColor: "#1a2a3a" }}>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: "#c9a227" }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Visited</span>
            </div>
            <div className="text-4xl font-bold" style={{ color: "#c9a227" }}>{visitedCount}</div>
            <div className="text-xs mt-1" style={{ color: "#5a7a9a" }}>of {sites.length} sites</div>
          </div>
          <div className="rounded-xl p-6 border" style={{ background: "#0c1218", borderColor: "#1a2a3a" }}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5" style={{ color: "#40b4a0" }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Prayed At</span>
            </div>
            <div className="text-4xl font-bold" style={{ color: "#40b4a0" }}>{prayedCount}</div>
            <div className="text-xs mt-1" style={{ color: "#5a7a9a" }}>of {sites.length} sites</div>
          </div>
        </div>

        {/* Sites table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#c9a22740", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#1a2a3a" }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: "#0c1218", borderColor: "#1a2a3a" }}>
              <Globe className="w-4 h-4" style={{ color: "#c9a227" }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "#5a7a9a" }}>All Heritage Sites</span>
            </div>
            <div className="divide-y divide-[#1a2a3a]">
              {sites.map((site) => {
                const log = getLog(site.id);
                return (
                  <div
                    key={site.id}
                    className="flex items-center gap-4 px-5 py-4"
                    style={{ background: "#070d14" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/site/${site.id}`}>
                          <span className="font-medium text-sm hover:underline cursor-pointer" style={{ color: "#d8e0ea" }}>{site.name}</span>
                        </Link>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1a2a3a", color: "#5a7a9a" }}>{site.category}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" style={{ color: "#3d5566" }} />
                        <span className="text-xs" style={{ color: "#3d5566" }}>{site.country}</span>
                      </div>
                    </div>

                    {/* Visited toggle */}
                    <button
                      onClick={() => toggle(site.id, "visited")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: log?.visited ? "#c9a22720" : "#0c1218",
                        border: `1px solid ${log?.visited ? "#c9a22760" : "#1a2a3a"}`,
                        color: log?.visited ? "#c9a227" : "#5a7a9a",
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {log?.visited ? "Visited" : "Mark visited"}
                    </button>

                    {/* Prayed toggle */}
                    <button
                      onClick={() => toggle(site.id, "prayed")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: log?.prayed ? "#40b4a020" : "#0c1218",
                        border: `1px solid ${log?.prayed ? "#40b4a060" : "#1a2a3a"}`,
                        color: log?.prayed ? "#40b4a0" : "#5a7a9a",
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {log?.prayed ? "Prayed" : "Mark prayed"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
