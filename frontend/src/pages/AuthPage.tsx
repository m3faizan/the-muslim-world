import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const [, navigate] = useLocation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }
        await register(email, password, displayName);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#05080c" }}>
      {/* Background pattern */}
      <div className="absolute inset-0 islamic-pattern-bg opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm mb-8 transition-colors"
          style={{ color: "#5a7a9a" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ background: "#0c1218", borderColor: "#1a2a3a" }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#c9a22720", border: "1px solid #c9a22740" }}>
                <span className="font-arabic text-sm" style={{ color: "#c9a227" }}>م</span>
              </div>
              <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "#5a7a9a" }}>The Muslim World</span>
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#d8e0ea" }}>
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-sm" style={{ color: "#5a7a9a" }}>
              {mode === "login"
                ? "Sign in to track your visits and prayers"
                : "Track the mosques you've visited and prayed at"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "#5a7a9a" }}>
                  Display name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#3d5566" }} />
                  <input
                    data-testid="auth-displayname-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: "#070d14", border: "1px solid #1a2a3a", color: "#d8e0ea" }}
                    onFocus={(e) => e.target.style.borderColor = "#c9a22760"}
                    onBlur={(e) => e.target.style.borderColor = "#1a2a3a"}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "#5a7a9a" }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#3d5566" }} />
                <input
                  data-testid="auth-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-colors"
                  style={{ background: "#070d14", border: "1px solid #1a2a3a", color: "#d8e0ea" }}
                  onFocus={(e) => e.target.style.borderColor = "#c9a22760"}
                  onBlur={(e) => e.target.style.borderColor = "#1a2a3a"}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "#5a7a9a" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#3d5566" }} />
                <input
                  data-testid="auth-password-input"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                  className="w-full pl-10 pr-10 py-3 rounded-lg text-sm outline-none transition-colors"
                  style={{ background: "#070d14", border: "1px solid #1a2a3a", color: "#d8e0ea" }}
                  onFocus={(e) => e.target.style.borderColor = "#c9a22760"}
                  onBlur={(e) => e.target.style.borderColor = "#1a2a3a"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#3d5566" }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-lg" style={{ background: "#3a100f", border: "1px solid #6a1a19", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button
              data-testid={mode === "login" ? "auth-signin-btn" : "auth-signup-btn"}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-sm transition-opacity mt-2"
              style={{ background: "#c9a227", color: "#05080c", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 pt-6 text-center text-sm" style={{ borderTop: "1px solid #1a2a3a", color: "#5a7a9a" }}>
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button data-testid="auth-toggle-register" onClick={() => { setMode("register"); setError(""); }} className="font-medium" style={{ color: "#c9a227" }}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button data-testid="auth-toggle-login" onClick={() => { setMode("login"); setError(""); }} className="font-medium" style={{ color: "#c9a227" }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
