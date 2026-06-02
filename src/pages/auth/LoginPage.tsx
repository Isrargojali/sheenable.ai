// src/pages/auth/LoginPage.tsx
// Premium split-screen login. Brand mission left, form right.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import { Eye, EyeOff, Mail, Lock, Heart, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNotifStore } from "@/store/notifStore";
import { apiAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

type Role = "CANDIDATE" | "EMPLOYER" | "ADMIN";

const ROLE_REDIRECTS: Record<string, string> = {
  CANDIDATE: "/candidate/dashboard",
  EMPLOYER: "/employer/dashboard",
  ADMIN: "/admin/overview",
  SUPER_ADMIN: "/super-admin/overview",
};



export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applyJobId = searchParams.get("applyJobId");
  const setSession = useAuthStore(s => s.setSession);
  const setNotifs = useNotifStore(s => s.setNotifs);

  const [role, setRole] = useState<Role>("CANDIDATE");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Sign in · SheEnableAI"; }, []);

  function fillRole(r: Role) {
    setRole(r);
    setEmail("");
    setPass("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Email is required");
    if (!password) return setError("Password is required");

    setLoading(true);
    try {
      const response = await apiAuth.login(email.trim().toLowerCase(), password, role);
      const { user, token } = response.data.data;

      if (!user || !token) {
        return setError("Invalid response from server");
      }

      // Store both user AND token in authStore using setSession
      setSession({
        id: user.id,
        email: user.email,
        role: user.role as Role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      }, token);
      if (applyJobId && user.role === "CANDIDATE") {
        navigate(`/candidate/jobs?applyJobId=${applyJobId}`);
      } else {
        navigate(ROLE_REDIRECTS[user.role] ?? "/");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      let errorMessage = axiosErr.response?.data?.message || "Login failed";

      if (err instanceof Error) {
        if (!axiosErr.response?.data?.message) {
           errorMessage = err.message;
        }

        // Check if it's a network error or Chrome extension interference
        if (errorMessage.includes("Network") || errorMessage.includes("ERR_")) {
          errorMessage = "Connection error. Please check your internet connection and try again.";
        }
      }

      // Log the full error for debugging
      console.error("Login error details:", err);

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">

      {/* ── Left: Brand & mission ─────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col justify-between relative overflow-hidden text-white px-12 py-12"
        style={{ background: "var(--grad-hero)" }}
      >
        {/* Soft dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.18]" aria-hidden="true">
          <defs>
            <pattern id="login-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dots)" />
        </svg>
        <div className="absolute -top-32 -right-20 w-[450px] h-[450px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(200,82,140,.30),transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute -bottom-32 -left-20 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(61,170,125,.20),transparent 65%)", filter: "blur(70px)" }} />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-2.5 group" aria-label="SheEnableAI home">
          {/* <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
               style={{ background: "linear-gradient(135deg,#C8528C,#7C3B6E)" }}>
            <Heart size={16} className="text-white" fill="white" />
          </div> */}
          <img
            src={logo}
            alt="SheEnableAI logo"
            className="w-48 h-24 object-contain transition-transform group-hover:scale-105"
          />
          {/* <div>
            <div className="font-serif text-xl text-white leading-none">SheEnableAI</div>
            <div className="text-[9px] text-white/40 uppercase tracking-[2px] mt-1">Women's platform</div>
          </div> */}
        </Link>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="font-serif text-4xl xl:text-5xl text-white leading-[1.05] tracking-tight mb-5">
            Your next<br /><span className="italic text-shimmer">opportunity</span><br />awaits.
          </h2>
          <p className="text-sm text-white/65 leading-7 mb-10 max-w-md">
            Join 12,400+ women professionals and 500+ inclusive employers on Pakistan's premium AI-powered hiring platform.
          </p>

          {[
            { icon: Sparkles, title: "AI-powered matching", sub: "96% match accuracy across 47 industries" },
            { icon: Heart, title: "Built for women", sub: "Verified inclusive employers only" },
            { icon: ShieldCheck, title: "Bank-grade security", sub: "End-to-end encrypted, never sold" },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-2.5 max-w-md"
              style={{ background: "rgba(255,255,255,.05)", borderColor: "rgba(255,255,255,.08)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(200,82,140,.22)" }}>
                <Icon size={15} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-white">{title}</div>
                <div className="text-[11px] text-white/50 mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-[11px] text-white/45 max-w-md">
          "I landed my dream role in 11 days. The match accuracy was scary good." — Aisha K., Senior Frontend Engineer
        </div>
      </aside>

      {/* ── Right: Form ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center px-5 py-10 lg:py-12 bg-background">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2 mb-7">
            {/* <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--grad-mauve-rose)" }}>
              <Heart size={14} className="text-white" fill="white" />
            </div> */}
             <img
            src={logo}
            alt="SheEnableAI logo"
            className="w-48 h-24 object-contain transition-transform group-hover:scale-105"
          />
            {/* <span className="font-serif text-xl">SheEnableAI</span> */}
          </div>

          <h1 className="font-serif text-4xl text-foreground mb-1.5 tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-7">Sign in to continue your journey.</p>

          {/* Role tabs */}
          <div className="flex bg-secondary rounded-full p-1 mb-5">
            {([
              { key: "CANDIDATE", label: "Candidate" },
              { key: "EMPLOYER", label: "Employer" },
              { key: "ADMIN", label: "Admin" },
            ] as { key: Role; label: string }[]).map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => fillRole(r.key)}
                className={cn(
                  "flex-1 h-9 rounded-full text-[12px] font-bold press transition-colors",
                  role === r.key ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>



          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4 text-[12px] text-rose-700">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-bold text-foreground/75 uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-11 pl-10 pr-4 border border-border rounded-xl text-[13px] bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-pwd" className="text-[11px] font-bold text-foreground/75 uppercase tracking-wide">Password</label>
                <Link to="/auth/forgot-password" className="text-[11px] font-semibold text-primary hover:text-mauve-600">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  id="login-pwd"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => { setPass(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-10 border border-border rounded-xl text-[13px] bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-[13px] font-bold text-primary-foreground bg-primary hover:bg-mauve-600 hover:-translate-y-0.5 hover:shadow-elev2 press disabled:opacity-50 disabled:transform-none mt-2 inline-flex items-center justify-center gap-2"
            >
              {loading ? "Signing in…" : <>Sign in securely <ArrowRight size={14} /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {["Google", "LinkedIn"].map(s => (
              <button key={s}
                className="h-10 border border-border rounded-xl text-[12px] font-semibold text-foreground bg-card hover:bg-secondary hover:border-foreground/20 press">
                {s}
              </button>
            ))}
          </div>

          <p className="text-center text-[12px] text-muted-foreground">
            New to SheEnableAI?{" "}
            <Link to="/auth/signup" className="text-primary font-bold hover:text-mauve-600">
              Join Free →
            </Link>
          </p>

          <div className="text-center text-[10px] text-muted-foreground mt-6">
            🔒 SHA-256 encrypted · httpOnly cookies · Rate limited
          </div>
        </div>
      </div>
    </div>
  );
}
