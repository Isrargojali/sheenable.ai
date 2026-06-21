// src/pages/auth/SignupPage.tsx
// Premium split-screen register. Brand mission left, form right.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import { Eye, EyeOff, ArrowRight, Building2, User, Mail, Lock, Heart, Sparkles, ShieldCheck, ChevronDown } from "lucide-react";
import { apiAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

type Role = "CANDIDATE" | "EMPLOYER";

const ROLE_REDIRECTS: Record<string, string> = {
  CANDIDATE: "/candidate/dashboard",
  EMPLOYER: "/employer/dashboard",
  ADMIN: "/admin/overview",
  SUPER_ADMIN: "/super-admin/overview",
};

function PwdStrength({ pwd }: { pwd: string }) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[!@#$%^&*]/.test(pwd)) s++;
  const labels = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-1 h-[3px] rounded-full transition-all duration-300"
            style={{ background: i <= s ? "var(--brand-pink)" : "#E6E6EA" }} />
        ))}
      </div>
      {pwd && <p className="text-[10px] mt-1 font-semibold text-[var(--brand-pink)] transition-colors duration-300">{labels[s]}</p>}
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

  const getFieldError = (fieldName: string) => {
    if (!error) return null;
    const errLower = error.toLowerCase();
    if (fieldName === 'fname' && errLower.includes('first name')) return error;
    if (fieldName === 'lname' && errLower.includes('last name')) return error;
    if (fieldName === 'companyName' && errLower.includes('company name')) return error;
    if (fieldName === 'email' && errLower.includes('email')) return error;
    if (fieldName === 'pwd' && errLower.includes('password')) return error;
    if (fieldName === 'confirm' && errLower.includes('match')) return error;
    return null;
  };

  const hasFieldSpecificError = !!error && (
    error.toLowerCase().includes('first name') ||
    error.toLowerCase().includes('last name') ||
    error.toLowerCase().includes('company name') ||
    error.toLowerCase().includes('email') ||
    error.toLowerCase().includes('password') ||
    error.toLowerCase().includes('match')
  );

  const setSession = useAuthStore(s => s.setSession);

  // Simulated OAuth Modal State
  const [oauthModal, setOauthModal] = useState<{ isOpen: boolean; provider: 'Google' | 'LinkedIn' }>({
    isOpen: false,
    provider: 'Google'
  });
  const [oauthEmail, setOauthEmail] = useState("");
  const [oauthFname, setOauthFname] = useState("");
  const [oauthLname, setOauthLname] = useState("");
  const [oauthRole, setOauthRole] = useState<Role>("CANDIDATE");

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
        role: user.role as any,
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
        {/* Subtle dot pattern */}
        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <pattern id="auth-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" fillOpacity="0.04" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-dots)" />
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
      <div className="relative flex items-center justify-center px-6 py-10 lg:py-12 bg-white overflow-hidden">
        <div className="w-full max-w-[440px] relative z-10 px-4 md:px-0 py-8 md:py-10 animate-fade-in">
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

          {error && !hasFieldSpecificError && (
            <div className="bg-rose-50 border border-rose-200 rounded-[var(--radius-input)] px-4 py-3 mb-5 text-[12px] text-rose-700 animate-shake">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {role === "CANDIDATE" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">First name</label>
                  <div className={cn(
                    "relative flex items-center h-12 bg-white transition-all duration-200 border rounded-[var(--radius-input)]",
                    getFieldError('fname')
                      ? "border-[#D92D20] ring-1 ring-[#D92D20]"
                      : focusedField === 'fname' 
                        ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]" 
                        : "border-[var(--auth-border)]"
                  )}>
                    <input 
                      value={fname} 
                      onChange={e => setFname(e.target.value)}
                      onFocus={() => setFocusedField('fname')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ayesha" 
                      className="w-full h-12 pl-3.5 pr-3.5 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-0" 
                    />
                  </div>
                  {getFieldError('fname') && (
                    <p className="text-[12px] text-[#D92D20] mt-1.5">{getFieldError('fname')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">Last name</label>
                  <div className={cn(
                    "relative flex items-center h-12 bg-white transition-all duration-200 border rounded-[var(--radius-input)]",
                    getFieldError('lname')
                      ? "border-[#D92D20] ring-1 ring-[#D92D20]"
                      : focusedField === 'lname' 
                        ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]" 
                        : "border-[var(--auth-border)]"
                  )}>
                    <input 
                      value={lname} 
                      onChange={e => setLname(e.target.value)}
                      onFocus={() => setFocusedField('lname')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Khan" 
                      className="w-full h-12 pl-3.5 pr-3.5 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-0" 
                    />
                  </div>
                  {getFieldError('lname') && (
                    <p className="text-[12px] text-[#D92D20] mt-1.5">{getFieldError('lname')}</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">Company name</label>
                  <div className={cn(
                    "relative flex items-center h-12 bg-white transition-all duration-200 border rounded-[var(--radius-input)]",
                    getFieldError('companyName')
                      ? "border-[#D92D20] ring-1 ring-[#D92D20]"
                      : focusedField === 'companyName' 
                        ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]" 
                        : "border-[var(--auth-border)]"
                  )}>
                    <Building2 className="absolute left-3.5 text-[var(--ink-500)]" size={18} />
                    <input 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)}
                      onFocus={() => setFocusedField('companyName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Acme Inc." 
                      className="w-full h-12 pl-11 pr-3.5 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-0" 
                    />
                  </div>
                  {getFieldError('companyName') && (
                    <p className="text-[12px] text-[#D92D20] mt-1.5">{getFieldError('companyName')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">Company size</label>
                  <div className={cn(
                    "relative flex items-center h-12 bg-white transition-all duration-200 border rounded-[var(--radius-input)]",
                    focusedField === 'companySize' 
                      ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]" 
                      : "border-[var(--auth-border)]"
                  )}>
                    <select 
                      value={companySize} 
                      onChange={e => setCompanySize(e.target.value)} 
                      onFocus={() => setFocusedField('companySize')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full h-12 pl-3.5 pr-10 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] focus:outline-none focus:ring-0 cursor-pointer appearance-none"
                    >
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 text-[var(--ink-500)] pointer-events-none" size={18} />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">
                {role === "EMPLOYER" ? "Work email" : "Email address"}
              </label>
              <div className={cn(
                "relative flex items-center h-12 bg-white transition-all duration-200 border rounded-[var(--radius-input)]",
                getFieldError('email')
                  ? "border-[#D92D20] ring-1 ring-[#D92D20]"
                  : focusedField === 'email' 
                    ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]" 
                    : "border-[var(--auth-border)]"
              )}>
                <Mail className="absolute left-3.5 text-[var(--ink-500)]" size={18} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={role === "EMPLOYER" ? "you@company.com" : "you@example.com"}
                  autoComplete="email"
                  className="w-full h-12 pl-11 pr-3.5 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-0" 
                />
              </div>
              {getFieldError('email') && (
                <p className="text-[12px] text-[#D92D20] mt-1.5">{getFieldError('email')}</p>
              )}
              {role === "EMPLOYER" && !getFieldError('email') && (
                <p className="text-[10px] text-muted-foreground/80 mt-1">We verify employers via your work email domain.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">Password</label>
              <div className={cn(
                "relative flex items-center h-12 bg-white transition-all duration-200 border rounded-[var(--radius-input)]",
                getFieldError('pwd')
                  ? "border-[#D92D20] ring-1 ring-[#D92D20]"
                  : focusedField === 'pwd' 
                    ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]" 
                    : "border-[var(--auth-border)]"
              )}>
                <Lock className="absolute left-3.5 text-[var(--ink-500)]" size={18} />
                <input 
                  type={showPwd ? "text" : "password"} 
                  value={pwd} 
                  onChange={e => setPwd(e.target.value)}
                  onFocus={() => setFocusedField('pwd')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="w-full h-12 pl-11 pr-11 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-0" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="absolute right-3.5 w-8 h-8 rounded-md flex items-center justify-center text-[var(--ink-500)] hover:text-[var(--brand-pink)] transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {getFieldError('pwd') && (
                <p className="text-[12px] text-[#D92D20] mt-1.5">{getFieldError('pwd')}</p>
              )}
              <PwdStrength pwd={pwd} />
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">Confirm password</label>
              <div className={cn(
                "relative flex items-center h-12 bg-white transition-all duration-200 border rounded-[var(--radius-input)]",
                getFieldError('confirm')
                  ? "border-[#D92D20] ring-1 ring-[#D92D20]"
                  : focusedField === 'confirm' 
                    ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]" 
                    : "border-[var(--auth-border)]"
              )}>
                <input 
                  type="password" 
                  value={confirm} 
                  onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="w-full h-12 pl-3.5 pr-3.5 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-0" 
                />
              </div>
              {getFieldError('confirm') && (
                <p className="text-[12px] text-[#D92D20] mt-1.5">{getFieldError('confirm')}</p>
              )}
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
              className="w-full btn-auth-primary press disabled:opacity-50 mt-3"
            >
              {loading ? "Creating account…" : <><span>Create account</span> <ArrowRight size={16} /></>}
            </button>
          </form>

          {role === "CANDIDATE" && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[var(--auth-border)]" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or continue with</span>
                <div className="flex-1 h-px bg-[var(--auth-border)]" />
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
                  className="h-12 border border-[var(--auth-border)] rounded-[var(--radius-input)] text-[13px] font-semibold text-[var(--ink-700)] bg-white hover:bg-[var(--auth-surface-muted)] transition-all duration-200 press flex items-center justify-center gap-2"
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
                  className="h-12 border border-[var(--auth-border)] rounded-[var(--radius-input)] text-[13px] font-semibold text-[var(--ink-700)] bg-white hover:bg-[var(--auth-surface-muted)] transition-all duration-200 press flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </button>
              </div>
            </>
          )}

          <p className="text-center text-[12px] text-muted-foreground mt-6">
            Already registered?{" "}
            <Link to="/auth/login" className="text-[var(--brand-pink)] font-bold hover:opacity-85 transition-opacity">Sign in</Link>
          </p>

          <div className="text-center text-[10px] text-muted-foreground mt-6 opacity-75">
            By signing up you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
          </div>
        </div>
      </div>

      {/* Simulated OAuth Modal Overlay */}
      {oauthModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14101F]/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-[420px] bg-[var(--auth-surface)] border border-[var(--auth-border)] rounded-[var(--radius-card)] p-6 shadow-xl relative overflow-hidden transition-all duration-300 scale-[1.02]">
            {/* Modal branding header */}
            <div className="flex flex-col items-center mb-6">
              {oauthModal.provider === 'Google' ? (
                <div className="w-12 h-12 rounded-full bg-[var(--auth-surface-muted)] border border-[var(--auth-border)] flex items-center justify-center shadow-sm mb-3">
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
              <h2 className="font-serif text-xl font-bold text-[var(--auth-ink-900)]">Register with {oauthModal.provider}</h2>
              <p className="text-[11px] text-muted-foreground mt-1">To verify your connection to SheEnableAI</p>
            </div>

            <form onSubmit={handleOauthSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-foreground/75 uppercase tracking-wide">Select Your Account Role</label>
                <div className="flex bg-[var(--auth-surface-muted)] border border-[var(--auth-border)] rounded-[var(--radius-input)] p-1">
                  {(["CANDIDATE", "EMPLOYER"] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setOauthRole(r)}
                      className={cn(
                        "flex-1 h-9 rounded-[8px] text-[11px] font-bold transition-all duration-200 press",
                        oauthRole === r 
                          ? "bg-[var(--auth-surface)] text-[var(--brand-pink)] shadow-sm border border-[var(--auth-border)]" 
                          : "text-muted-foreground hover:text-foreground"
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
                <label className="block text-[10px] font-bold text-[var(--ink-700)] uppercase tracking-wide">First Name</label>
                <input 
                  type="text" 
                  value={oauthFname} 
                  onChange={e => setOauthFname(e.target.value)}
                  className="w-full h-11 px-3.5 border border-[var(--auth-border)] rounded-[var(--radius-input)] text-[13px] bg-[var(--auth-surface)] text-[var(--ink-900)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/10 focus:border-[var(--brand-pink)] transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[var(--ink-700)] uppercase tracking-wide">Last Name</label>
                <input 
                  type="text" 
                  value={oauthLname} 
                  onChange={e => setOauthLname(e.target.value)}
                  className="w-full h-11 px-3.5 border border-[var(--auth-border)] rounded-[var(--radius-input)] text-[13px] bg-[var(--auth-surface)] text-[var(--ink-900)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/10 focus:border-[var(--brand-pink)] transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[var(--ink-700)] uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={oauthEmail} 
                  onChange={e => setOauthEmail(e.target.value)}
                  className="w-full h-11 px-3.5 border border-[var(--auth-border)] rounded-[var(--radius-input)] text-[13px] bg-[var(--auth-surface)] text-[var(--ink-900)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/10 focus:border-[var(--brand-pink)] transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setOauthModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 h-11 rounded-[var(--radius-button)] text-[12px] font-bold border border-[var(--auth-border)] bg-[var(--auth-surface)] hover:bg-[var(--auth-surface-muted)] transition-colors press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-[var(--radius-button)] text-[12px] font-bold text-white bg-[var(--brand-pink)] hover:bg-[var(--brand-pink)]/90 transition-colors press"
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