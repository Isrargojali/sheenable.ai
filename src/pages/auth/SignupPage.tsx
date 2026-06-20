// src/pages/auth/SignupPage.tsx
// Premium split-screen register. Brand mission left, form right.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import { Eye, EyeOff, ArrowRight, Building2, User, Mail, Lock, Heart, Sparkles, ShieldCheck } from "lucide-react";
import { apiAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

type Role = "CANDIDATE" | "EMPLOYER";

function PwdStrength({ pwd }: { pwd: string }) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[!@#$%^&*]/.test(pwd)) s++;
  const colors = ["", "#DC2626", "#D97706", "#D97706", "#3DAA7D", "#2C8862"];
  const labels = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= s ? colors[s] : "var(--auth-border)" }} />
        ))}
      </div>
      {pwd && <p className="text-[10px] mt-1.5 font-medium transition-colors duration-300" style={{ color: colors[s] }}>{labels[s]}</p>}
    </div>
  );
}

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const initialRole: Role = params.get("role") === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";
  const applyJobId = params.get("applyJobId");

  // Show notice if redirected back from a stale OTP session
  const notice = (location.state as { notice?: string })?.notice ?? "";

  const [role,        setRole]        = useState<Role>(initialRole);
  const [fname,       setFname]       = useState("");
  const [lname,       setLname]       = useState("");
  const [email,       setEmail]       = useState("");
  const [pwd,         setPwd]         = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [identityOk,  setIdentityOk]  = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState(COMPANY_SIZES[1]);
  const [error,       setError]       = useState(notice);
  const [loading,     setLoading]     = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Join SheEnableAI — Free for women, forever";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (role === "CANDIDATE") {
      if (!fname.trim())  return setError("First name is required");
      if (!lname.trim())  return setError("Last name is required");
      if (!identityOk)    return setError("Please confirm your identity to continue.");
    } else {
      if (!companyName.trim()) return setError("Company name is required");
    }

    if (!email.trim())        return setError("Email is required");
    if (pwd.length < 8)       return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(pwd))   return setError("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(pwd))   return setError("Password must contain at least one lowercase letter");
    if (!/[0-9]/.test(pwd))   return setError("Password must contain at least one number");
    if (pwd !== confirm)      return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await apiAuth.register({
        email,
        password: pwd,
        firstName: role === "CANDIDATE" ? fname : companyName,
        lastName:  role === "CANDIDATE" ? lname : companySize,
        role,
        gender: role === "CANDIDATE" ? "female" : "prefer-not-to-say",
      });
      // Pass devOtp in URL so VerifyOtpPage can show it for easy copy/auto-fill
      const devOtpParam = res.data.devOtp ? `&devOtp=${res.data.devOtp}` : "";
      const applyJobParam = applyJobId ? `&applyJobId=${applyJobId}` : "";
      navigate(`/auth/verify?userId=${res.data.userId}&email=${encodeURIComponent(email)}${devOtpParam}${applyJobParam}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: { msg: string }[] } } };
      console.log("REGISTER ERROR:", axiosErr.response?.data);
      const message =
        axiosErr.response?.data?.errors?.[0]?.msg ??
        axiosErr.response?.data?.message ??
        "Signup failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[40fr_60fr] xl:grid-cols-[50fr_50fr] bg-[var(--auth-surface-muted)] relative overflow-hidden">
      {/* ── Left: Brand & mission ─────────────────── */}
      <aside
        className="flex flex-col justify-between relative overflow-hidden text-white px-6 py-10 lg:px-12 lg:py-12 bg-[var(--auth-ink-900)] h-auto lg:h-full lg:min-h-screen"
      >
        {/* Soft dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.18]" aria-hidden="true">
          <defs>
            <pattern id="signup-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#signup-dots)" />
        </svg>

        {/* Top: Logo */}
        <div className="relative z-10 flex items-center justify-center lg:justify-start">
          <Link to="/" className="group" aria-label="SheEnableAI home">
            <img
              src={logo}
              alt="SheEnableAI logo"
              className="w-40 lg:w-48 h-16 lg:h-24 object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Center: Headline & Subtitles */}
        <div className="relative z-10 mt-6 lg:mt-0 text-center lg:text-left">
          <h2 className="font-serif text-3xl lg:text-4xl xl:text-5xl text-white leading-[1.1] lg:leading-[1.05] tracking-tight mb-4 lg:mb-5">
            Your next<br className="hidden lg:inline" /> <span className="italic text-[var(--brand-pink)] font-bold">opportunity</span><br />awaits.
          </h2>
          <p className="text-xs lg:text-sm text-white/65 leading-7 mb-8 lg:mb-10 max-w-md mx-auto lg:mx-0 hidden lg:block">
            Join 12,400+ women professionals and 500+ inclusive employers on Pakistan's premium AI-powered hiring platform.
          </p>

          {/* Trust badges */}
          <div className="hidden lg:flex flex-col gap-2.5 max-w-md">
            {[
              { icon: Sparkles, title: "AI-powered matching", sub: "96% match accuracy across 47 industries" },
              { icon: Heart, title: "Built for women", sub: "Verified inclusive employers only" },
              { icon: ShieldCheck, title: "Bank-grade security", sub: "End-to-end encrypted, never sold" },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-card)] border border-white/10 bg-white/5 transition-all duration-300 hover:scale-[1.02]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--brand-pink)]/20 text-[var(--brand-pink)]">
                  <Icon size={15} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white">{title}</div>
                  <div className="text-[11px] text-white/50 mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Testimonial */}
        <div className="relative z-10 mt-8 lg:mt-0 hidden lg:block text-left">
          <div className="text-[11px] text-white/70 max-w-sm px-4 py-3 rounded-[var(--radius-card)] border border-white/10 backdrop-blur-md bg-white/5 shadow-soft">
            <span className="text-[var(--brand-pink)] italic font-semibold font-serif">"</span>I landed my dream role in 11 days. The match accuracy was scary good.<span className="text-[var(--brand-pink)] italic font-semibold font-serif">"</span> — Aisha K., Senior Frontend Engineer
          </div>
        </div>
      </aside>

      {/* ── Right: Form Panel ──────────────────────────────────────── */}
      <div className="relative flex items-center justify-center px-6 py-10 lg:py-12 bg-[var(--auth-surface-muted)] overflow-hidden">
        <div className="w-full max-w-[440px] relative z-10 bg-[var(--auth-surface)] border border-[var(--auth-border)] rounded-[var(--radius-card)] p-8 md:p-10 shadow-sm animate-fade-in">
          <div className="lg:hidden flex items-center justify-center mb-6">
            <Link to="/" className="flex items-center justify-center group" aria-label="SheEnableAI home">
              <img
                src={logo}
                alt="SheEnableAI logo"
                className="w-48 h-20 object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          <h1 className="font-serif text-3xl text-[var(--auth-ink-900)] text-center mb-1.5 tracking-tight">
            {role === "CANDIDATE" ? "Join SheEnableAI" : "Hire with SheEnableAI"}
          </h1>
          <p className="text-[13px] text-muted-foreground text-center mb-6">
            {role === "CANDIDATE"
              ? "Free forever for women professionals."
              : "Reach 50,000+ qualified women. First job free."}
          </p>

          {/* Role switcher tabs */}
          <div className="w-full h-11 bg-[#F4F4F6] rounded-[10px] p-1 flex items-center mb-6">
            {(["CANDIDATE", "EMPLOYER"] as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setError(""); }}
                className={cn(
                  "flex-1 h-9 rounded-[8px] text-[14px] font-semibold transition-all duration-150 ease-in-out press",
                  role === r 
                    ? "bg-white text-[var(--brand-pink)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]" 
                    : "bg-transparent text-[var(--ink-500)] hover:text-[var(--ink-700)]"
                )}
              >
                {r === "CANDIDATE" ? "Candidate" : "Employer"}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-[var(--radius-input)] px-4 py-3 mb-5 text-[12px] text-rose-700 animate-shake">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {role === "CANDIDATE" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[var(--ink-700)] uppercase tracking-wider">First name</label>
                  <div className={cn(
                    "relative flex items-center border bg-[var(--auth-surface)] transition-all duration-200",
                    focusedField === 'fname' 
                      ? "border-[var(--auth-border-focus)] ring-2 ring-[var(--brand-pink)]/10 rounded-[var(--radius-input)]" 
                      : "border-[var(--auth-border)] rounded-[var(--radius-input)]"
                  )}>
                    <input 
                      value={fname} 
                      onChange={e => setFname(e.target.value)}
                      onFocus={() => setFocusedField('fname')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ayesha" 
                      className="w-full h-12 px-4 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[var(--ink-700)] uppercase tracking-wider">Last name</label>
                  <div className={cn(
                    "relative flex items-center border bg-[var(--auth-surface)] transition-all duration-200",
                    focusedField === 'lname' 
                      ? "border-[var(--auth-border-focus)] ring-2 ring-[var(--brand-pink)]/10 rounded-[var(--radius-input)]" 
                      : "border-[var(--auth-border)] rounded-[var(--radius-input)]"
                  )}>
                    <input 
                      value={lname} 
                      onChange={e => setLname(e.target.value)}
                      onFocus={() => setFocusedField('lname')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Khan" 
                      className="w-full h-12 px-4 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[var(--ink-700)] uppercase tracking-wider">Company name</label>
                  <div className={cn(
                    "relative flex items-center border bg-[var(--auth-surface)] transition-all duration-200",
                    focusedField === 'companyName' 
                      ? "border-[var(--auth-border-focus)] ring-2 ring-[var(--brand-pink)]/10 rounded-[var(--radius-input)]" 
                      : "border-[var(--auth-border)] rounded-[var(--radius-input)]"
                  )}>
                    <Building2 className={cn(
                      "absolute left-4 transition-colors duration-300",
                      focusedField === 'companyName' ? "text-[var(--brand-pink)]" : "text-muted-foreground"
                    )} size={15} />
                    <input 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)}
                      onFocus={() => setFocusedField('companyName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Acme Inc." 
                      className="w-full h-12 pl-11 pr-4 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[var(--ink-700)] uppercase tracking-wider">Company size</label>
                  <div className={cn(
                    "relative flex items-center border bg-[var(--auth-surface)] transition-all duration-200",
                    focusedField === 'companySize' 
                      ? "border-[var(--auth-border-focus)] ring-2 ring-[var(--brand-pink)]/10 rounded-[var(--radius-input)]" 
                      : "border-[var(--auth-border)] rounded-[var(--radius-input)]"
                  )}>
                    <select 
                      value={companySize} 
                      onChange={e => setCompanySize(e.target.value)} 
                      onFocus={() => setFocusedField('companySize')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full h-12 px-4 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[var(--ink-700)] uppercase tracking-wider">
                {role === "EMPLOYER" ? "Work email" : "Email address"}
              </label>
              <div className={cn(
                "relative flex items-center border bg-[var(--auth-surface)] transition-all duration-200",
                focusedField === 'email' 
                  ? "border-[var(--auth-border-focus)] ring-2 ring-[var(--brand-pink)]/10 rounded-[var(--radius-input)]" 
                  : "border-[var(--auth-border)] rounded-[var(--radius-input)]"
              )}>
                <Mail className={cn(
                  "absolute left-4 transition-colors duration-300",
                  focusedField === 'email' ? "text-[var(--brand-pink)]" : "text-muted-foreground"
                )} size={15} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={role === "EMPLOYER" ? "you@company.com" : "you@example.com"}
                  autoComplete="email"
                  className="w-full h-12 pl-11 pr-4 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
                />
              </div>
              {role === "EMPLOYER" && (
                <p className="text-[10px] text-muted-foreground/80 mt-1">We verify employers via your work email domain.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[var(--ink-700)] uppercase tracking-wider">Password</label>
              <div className={cn(
                "relative flex items-center border bg-[var(--auth-surface)] transition-all duration-200",
                focusedField === 'pwd' 
                  ? "border-[var(--auth-border-focus)] ring-2 ring-[var(--brand-pink)]/10 rounded-[var(--radius-input)]" 
                  : "border-[var(--auth-border)] rounded-[var(--radius-input)]"
              )}>
                <Lock className={cn(
                  "absolute left-4 transition-colors duration-300",
                  focusedField === 'pwd' ? "text-[var(--brand-pink)]" : "text-muted-foreground"
                )} size={15} />
                <input 
                  type={showPwd ? "text" : "password"} 
                  value={pwd} 
                  onChange={e => setPwd(e.target.value)}
                  onFocus={() => setFocusedField('pwd')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="w-full h-12 pl-11 pr-11 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="absolute right-4 text-muted-foreground hover:text-[var(--brand-pink)] transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PwdStrength pwd={pwd} />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[var(--ink-700)] uppercase tracking-wider">Confirm password</label>
              <div className={cn(
                "relative flex items-center border bg-[var(--auth-surface)] transition-all duration-200",
                focusedField === 'confirm' 
                  ? "border-[var(--auth-border-focus)] ring-2 ring-[var(--brand-pink)]/10 rounded-[var(--radius-input)]" 
                  : "border-[var(--auth-border)] rounded-[var(--radius-input)]"
              )}>
                <input 
                  type="password" 
                  value={confirm} 
                  onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="w-full h-12 px-4 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
                />
              </div>
            </div>

            {/* Women-only confirmation */}
            {role === "CANDIDATE" && (
              <label className={cn(
                "flex items-start gap-3 rounded-[var(--radius-card)] border-l-[3px] p-4 cursor-pointer transition-all duration-300 press border border-[var(--auth-border)] bg-[var(--auth-surface-muted)] border-l-[var(--brand-pink)]"
              )}>
                <input
                  type="checkbox"
                  checked={identityOk}
                  onChange={e => { setIdentityOk(e.target.checked); setError(""); }}
                  className="mt-0.5 w-4 h-4 accent-[var(--brand-pink)] cursor-pointer flex-shrink-0"
                />
                <span className="text-[11px] text-[var(--ink-700)] leading-relaxed">
                  <strong className="text-[var(--ink-900)]">I confirm I identify as a woman or non-binary individual.</strong>
                  <br />
                  <span className="text-muted-foreground/90">SheEnableAI exists to create safer, focused career opportunities for women — this confirmation is required.</span>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink)]/90 text-white rounded-[var(--radius-button)] text-[13px] font-bold transition-all duration-300 press disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
            >
              {loading ? "Creating account…" : <><span>Create account</span> <ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-[12px] text-muted-foreground mt-6">
            Already registered?{" "}
            <Link to="/auth/login" className="text-[var(--brand-pink)] font-bold hover:opacity-85 transition-opacity">Sign in</Link>
          </p>

          <div className="text-center text-[10px] text-muted-foreground mt-6 opacity-75">
            By signing up you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}