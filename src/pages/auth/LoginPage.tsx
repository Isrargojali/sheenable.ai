// src/pages/auth/LoginPage.tsx
// Premium split-screen login. Brand mission left, form right.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import { Eye, EyeOff, Mail, Lock, Heart, Sparkles, ShieldCheck, ArrowRight, Building2, User } from "lucide-react";
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Simulated OAuth Modal State
  const [oauthModal, setOauthModal] = useState<{ isOpen: boolean; provider: 'Google' | 'LinkedIn' }>({
    isOpen: false,
    provider: 'Google'
  });
  const [oauthEmail, setOauthEmail] = useState("");
  const [oauthFname, setOauthFname] = useState("");
  const [oauthLname, setOauthLname] = useState("");
  const [oauthRole, setOauthRole] = useState<Role>("CANDIDATE");

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
        isVerified: user.isVerified
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

  async function handleOauthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!oauthEmail.trim()) return setError("Email is required");
    if (!oauthFname.trim()) return setError("First name is required");
    if (!oauthLname.trim()) return setError("Last name is required");

    setLoading(true);
    setOauthModal(prev => ({ ...prev, isOpen: false }));
    try {
      let response;
      if (oauthModal.provider === 'Google') {
        response = await apiAuth.googleOAuth(undefined, true, {
          email: oauthEmail.trim().toLowerCase(),
          firstName: oauthFname.trim(),
          lastName: oauthLname.trim(),
        }, oauthRole);
      } else {
        response = await apiAuth.linkedinOAuth(undefined, true, {
          email: oauthEmail.trim().toLowerCase(),
          firstName: oauthFname.trim(),
          lastName: oauthLname.trim(),
        }, oauthRole);
      }

      const { user, token } = response.data.data;
      if (!user || !token) {
        return setError("Invalid OAuth response from server");
      }

      setSession({
        id: user.id,
        email: user.email,
        role: user.role as Role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified
      }, token);

      if (applyJobId && user.role === "CANDIDATE") {
        navigate(`/candidate/jobs?applyJobId=${applyJobId}`);
      } else {
        navigate(ROLE_REDIRECTS[user.role] ?? "/");
      }
    } catch (err: unknown) {
      console.error("OAuth login error:", err);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || `${oauthModal.provider} OAuth authentication failed.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-background relative overflow-hidden">
      {/* Premium Visual Flourish Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-blob-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.15); }
          66% { transform: translate(-30px, 30px) scale(0.90); }
        }
        @keyframes float-blob-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 40px) scale(1.10); }
        }
        .animate-blob-1 {
          animation: float-blob-1 18s ease-in-out infinite;
        }
        .animate-blob-2 {
          animation: float-blob-2 22s ease-in-out infinite;
        }
        .animate-shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .animate-shimmer-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -60%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: rotate(30deg);
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-shimmer-btn:hover::after {
          transform: translate(65%, 65%) rotate(30deg);
        }
      `}} />

      {/* ── Left: Brand & mission (Desktop only) ─────────────────── */}
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
          <img
            src={logo}
            alt="SheEnableAI logo"
            className="w-48 h-24 object-contain transition-transform group-hover:scale-105"
          />
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
            <div key={title} className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-2.5 max-w-md transition-all duration-300 hover:scale-[1.02]"
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

        <div className="relative z-10 text-[11px] text-white/70 max-w-sm px-4 py-3 rounded-2xl border border-white/10 backdrop-blur-md bg-white/5 shadow-soft">
          <span className="text-shimmer italic font-semibold font-serif">"</span>I landed my dream role in 11 days. The match accuracy was scary good.<span className="text-shimmer italic font-semibold font-serif">"</span> — Aisha K., Senior Frontend Engineer
        </div>
      </aside>

      {/* ── Right: Form ───────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center px-6 py-10 lg:py-12 bg-background/40 backdrop-blur-md overflow-hidden">
        {/* Ambient background glow spots */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full opacity-[0.10] pointer-events-none blur-3xl animate-blob-1"
          style={{ background: "radial-gradient(circle, #C8528C, transparent 70%)" }} />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 rounded-full opacity-[0.08] pointer-events-none blur-3xl animate-blob-2"
          style={{ background: "radial-gradient(circle, #3DAA7D, transparent 70%)" }} />

        <div className="w-full max-w-[440px] relative z-10 bg-card/70 backdrop-blur-xl border border-border/50 rounded-[28px] p-8 md:p-10 shadow-lg animate-fade-in">
          <div className="lg:hidden flex items-center justify-center mb-6">
             <img
              src={logo}
              alt="SheEnableAI logo"
              className="w-48 h-20 object-contain"
            />
          </div>

          <h1 className="font-serif text-3xl text-foreground text-center mb-1.5 tracking-tight">Welcome back</h1>
          <p className="text-[13px] text-muted-foreground text-center mb-6">Sign in to continue your journey.</p>

          {/* Role tabs */}
          <div className="flex bg-secondary border border-border/40 rounded-full p-1 mb-6">
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
                  "flex-1 h-9 rounded-full text-[12px] font-bold press transition-all duration-300",
                  role === r.key ? "bg-card text-primary shadow-soft border border-border/20" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5 text-[12px] text-rose-700 animate-shake">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-[11px] font-bold text-foreground/70 uppercase tracking-wider">
                Email address
              </label>
              <div className={cn(
                "relative flex items-center border rounded-xl bg-card transition-all duration-300",
                focusedField === 'email' 
                  ? "border-primary ring-4 ring-primary/5 shadow-md scale-[1.01]" 
                  : "border-border shadow-sm hover:border-primary/30"
              )}>
                <Mail className={cn(
                  "absolute left-4 transition-colors duration-300",
                  focusedField === 'email' ? "text-primary" : "text-muted-foreground"
                )} size={15} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-12 pl-11 pr-4 bg-transparent border-none rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-pwd" className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/auth/forgot-password" className="text-[11px] font-semibold text-primary hover:text-mauve-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className={cn(
                "relative flex items-center border rounded-xl bg-card transition-all duration-300",
                focusedField === 'password' 
                  ? "border-primary ring-4 ring-primary/5 shadow-md scale-[1.01]" 
                  : "border-border shadow-sm hover:border-primary/30"
              )}>
                <Lock className={cn(
                  "absolute left-4 transition-colors duration-300",
                  focusedField === 'password' ? "text-primary" : "text-muted-foreground"
                )} size={15} />
                <input
                  id="login-pwd"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => { setPass(e.target.value); setError(""); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-12 pl-11 pr-11 bg-transparent border-none rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="absolute right-4 text-muted-foreground hover:text-primary transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-[13px] font-bold text-white transition-all duration-300 hover:shadow-lg press disabled:opacity-50 disabled:transform-none mt-2 inline-flex items-center justify-center gap-2 animate-shimmer-btn"
              style={{ background: "var(--grad-mauve-rose)" }}
            >
              {loading ? "Signing in securely…" : <>Sign in securely <ArrowRight size={14} /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              type="button"
              onClick={() => {
                setOauthEmail("ayesha.k@gmail.com");
                setOauthFname("Ayesha");
                setOauthLname("Khan");
                setOauthRole("CANDIDATE");
                setOauthModal({ isOpen: true, provider: 'Google' });
              }}
              className="h-11 border border-border rounded-xl text-[13px] font-semibold text-foreground bg-card hover:bg-secondary hover:border-foreground/20 transition-all duration-200 press flex items-center justify-center gap-2 shadow-sm animate-shimmer-btn"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button 
              type="button"
              onClick={() => {
                setOauthEmail("ayesha.k@linkedin.com");
                setOauthFname("Ayesha");
                setOauthLname("Khan");
                setOauthRole("CANDIDATE");
                setOauthModal({ isOpen: true, provider: 'LinkedIn' });
              }}
              className="h-11 border border-border rounded-xl text-[13px] font-semibold text-foreground bg-card hover:bg-secondary hover:border-foreground/20 transition-all duration-200 press flex items-center justify-center gap-2 shadow-sm animate-shimmer-btn"
            >
              <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              LinkedIn
            </button>
          </div>

          <p className="text-center text-[12px] text-muted-foreground">
            New to SheEnableAI?{" "}
            <Link to="/auth/signup" className="text-primary font-bold hover:text-mauve-600 transition-colors">
              Join Free →
            </Link>
          </p>

          <div className="text-center text-[10px] text-muted-foreground mt-8 opacity-75">
            🔒 SHA-256 encrypted · httpOnly cookies · Rate limited
          </div>
        </div>
      </div>

      {/* Simulated OAuth Modal Overlay */}
      {oauthModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14101F]/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-[420px] bg-card border border-border rounded-[28px] p-6 shadow-xl relative overflow-hidden transition-all duration-300 scale-[1.02]">
            {/* Modal branding header */}
            <div className="flex flex-col items-center mb-6">
              {oauthModal.provider === 'Google' ? (
                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center shadow-sm mb-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shadow-sm mb-3">
                  <svg className="w-6 h-6 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </div>
              )}
              <h2 className="font-serif text-xl font-bold text-foreground">Sign in with {oauthModal.provider}</h2>
              <p className="text-[11px] text-muted-foreground mt-1">To verify your connection to SheEnableAI</p>
            </div>

            <form onSubmit={handleOauthSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-foreground/75 uppercase tracking-wide">Select Your Account Role</label>
                <div className="flex bg-secondary border border-border/40 rounded-full p-1">
                  {(["CANDIDATE", "EMPLOYER"] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setOauthRole(r)}
                      className={cn(
                        "flex-1 h-9 rounded-full text-[11px] font-bold transition-all duration-200 press",
                        oauthRole === r ? "bg-card text-primary shadow-soft border border-border/20" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {r === "CANDIDATE" ? "Candidate" : "Employer"}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground/80 mt-1">
                  Role is only applied if creating a new account. Existing users are signed in automatically to their saved profile.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-foreground/70 uppercase tracking-wide">First Name</label>
                <input 
                  type="text" 
                  value={oauthFname} 
                  onChange={e => setOauthFname(e.target.value)}
                  className="w-full h-11 px-3.5 border border-border rounded-xl text-[13px] bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-foreground/70 uppercase tracking-wide">Last Name</label>
                <input 
                  type="text" 
                  value={oauthLname} 
                  onChange={e => setOauthLname(e.target.value)}
                  className="w-full h-11 px-3.5 border border-border rounded-xl text-[13px] bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-foreground/70 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={oauthEmail} 
                  onChange={e => setOauthEmail(e.target.value)}
                  className="w-full h-11 px-3.5 border border-border rounded-xl text-[13px] bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setOauthModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 h-11 rounded-full text-[12px] font-bold border border-border bg-card hover:bg-secondary transition-colors press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-full text-[12px] font-bold text-white transition-colors animate-shimmer-btn press"
                  style={{ background: "var(--grad-mauve-rose)" }}
                >
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
