// src/pages/auth/SignupPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import { Eye, EyeOff, ArrowRight, Building2, User, Mail, Lock } from "lucide-react";
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
            style={{ background: i <= s ? colors[s] : "hsl(var(--border))" }} />
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
    <div className="min-h-screen flex items-center justify-center bg-background bg-arcs px-4 py-10 relative overflow-hidden">
      {/* Dynamic ambient blur spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.08] pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle, #C8528C, transparent 70%)" }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full opacity-[0.08] pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle, #3DAA7D, transparent 70%)" }} />

      <div className="w-full max-w-[460px] relative z-10 bg-card/70 backdrop-blur-xl border border-border/50 rounded-[28px] p-8 md:p-10 shadow-lg animate-fade-in">

        {/* Brand */}
        <div className="flex items-center justify-center mb-6">
          <img
            src={logo}
            alt="SheEnableAI logo"
            className="w-48 h-20 object-contain"
          />
        </div>

        <h1 className="font-serif text-3xl text-foreground text-center mb-1.5 tracking-tight">
          {role === "CANDIDATE" ? "Join SheEnableAI" : "Hire with SheEnableAI"}
        </h1>
        <p className="text-[13px] text-muted-foreground text-center mb-6">
          {role === "CANDIDATE"
            ? "Free forever for women professionals."
            : "Reach 50,000+ qualified women. First job free."}
        </p>

        {/* Role switcher */}
        <div className="flex bg-secondary border border-border/40 rounded-full p-1 mb-6">
          {(["CANDIDATE", "EMPLOYER"] as Role[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError(""); }}
              className={cn(
                "flex-1 h-10 rounded-full text-[12px] font-bold press transition-all duration-300 inline-flex items-center justify-center gap-1.5",
                role === r ? "bg-card text-primary shadow-soft border border-border/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r === "CANDIDATE" ? <User size={13} /> : <Building2 size={13} />}
              {r === "CANDIDATE" ? "I'm a Candidate" : "I'm an Employer"}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5 text-[12px] text-rose-700 animate-shake">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {role === "CANDIDATE" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-foreground/70 uppercase tracking-wider">First name</label>
                <div className={cn(
                  "relative flex items-center border rounded-xl bg-card transition-all duration-300",
                  focusedField === 'fname' 
                    ? "border-primary ring-4 ring-primary/5 shadow-md scale-[1.01]" 
                    : "border-border shadow-sm hover:border-primary/30"
                )}>
                  <input 
                    value={fname} 
                    onChange={e => setFname(e.target.value)}
                    onFocus={() => setFocusedField('fname')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Ayesha" 
                    className="w-full h-12 px-4 bg-transparent border-none rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Last name</label>
                <div className={cn(
                  "relative flex items-center border rounded-xl bg-card transition-all duration-300",
                  focusedField === 'lname' 
                    ? "border-primary ring-4 ring-primary/5 shadow-md scale-[1.01]" 
                    : "border-border shadow-sm hover:border-primary/30"
                )}>
                  <input 
                    value={lname} 
                    onChange={e => setLname(e.target.value)}
                    onFocus={() => setFocusedField('lname')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Khan" 
                    className="w-full h-12 px-4 bg-transparent border-none rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Company name</label>
                <div className={cn(
                  "relative flex items-center border rounded-xl bg-card transition-all duration-300",
                  focusedField === 'companyName' 
                    ? "border-primary ring-4 ring-primary/5 shadow-md scale-[1.01]" 
                    : "border-border shadow-sm hover:border-primary/30"
                )}>
                  <Building2 className={cn(
                    "absolute left-4 transition-colors duration-300",
                    focusedField === 'companyName' ? "text-primary" : "text-muted-foreground"
                  )} size={15} />
                  <input 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)}
                    onFocus={() => setFocusedField('companyName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Acme Inc." 
                    className="w-full h-12 pl-11 pr-4 bg-transparent border-none rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Company size</label>
                <div className={cn(
                  "relative flex items-center border rounded-xl bg-card transition-all duration-300",
                  focusedField === 'companySize' 
                    ? "border-primary ring-4 ring-primary/5 shadow-md scale-[1.01]" 
                    : "border-border shadow-sm hover:border-primary/30"
                )}>
                  <select 
                    value={companySize} 
                    onChange={e => setCompanySize(e.target.value)} 
                    onFocus={() => setFocusedField('companySize')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full h-12 px-4 bg-transparent border-none rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-foreground/70 uppercase tracking-wider">
              {role === "EMPLOYER" ? "Work email" : "Email address"}
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
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder={role === "EMPLOYER" ? "you@company.com" : "you@example.com"}
                autoComplete="email"
                className="w-full h-12 pl-11 pr-4 bg-transparent border-none rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
              />
            </div>
            {role === "EMPLOYER" && (
              <p className="text-[10px] text-muted-foreground/80 mt-1">We verify employers via your work email domain.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Password</label>
            <div className={cn(
              "relative flex items-center border rounded-xl bg-card transition-all duration-300",
              focusedField === 'pwd' 
                ? "border-primary ring-4 ring-primary/5 shadow-md scale-[1.01]" 
                : "border-border shadow-sm hover:border-primary/30"
            )}>
              <Lock className={cn(
                "absolute left-4 transition-colors duration-300",
                focusedField === 'pwd' ? "text-primary" : "text-muted-foreground"
              )} size={15} />
              <input 
                type={showPwd ? "text" : "password"} 
                value={pwd} 
                onChange={e => setPwd(e.target.value)}
                onFocus={() => setFocusedField('pwd')}
                onBlur={() => setFocusedField(null)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className="w-full h-12 pl-11 pr-11 bg-transparent border-none rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-4 text-muted-foreground hover:text-primary transition-colors">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <PwdStrength pwd={pwd} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Confirm password</label>
            <div className={cn(
              "relative flex items-center border rounded-xl bg-card transition-all duration-300",
              focusedField === 'confirm' 
                ? "border-primary ring-4 ring-primary/5 shadow-md scale-[1.01]" 
                : "border-border shadow-sm hover:border-primary/30"
            )}>
              <input 
                type="password" 
                value={confirm} 
                onChange={e => setConfirm(e.target.value)}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                placeholder="Repeat password"
                autoComplete="new-password"
                className="w-full h-12 px-4 bg-transparent border-none rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0" 
              />
            </div>
          </div>

          {/* Women-only confirmation */}
          {role === "CANDIDATE" && (
            <label className={cn(
              "flex items-start gap-3 rounded-2xl border-l-[3px] p-4 cursor-pointer transition-all duration-300 press",
              identityOk
                ? "bg-mint-50/60 border-mint-200 border border-l-mint-500 shadow-sm"
                : "bg-mauve-50/70 border-mauve-100 border border-l-primary hover:bg-mauve-50"
            )}>
              <input
                type="checkbox"
                checked={identityOk}
                onChange={e => { setIdentityOk(e.target.checked); setError(""); }}
                className="mt-0.5 w-4 h-4 accent-primary cursor-pointer flex-shrink-0"
              />
              <span className="text-[11px] text-foreground/80 leading-relaxed">
                <strong className="text-foreground">I confirm I identify as a woman or non-binary individual.</strong>
                <br />
                <span className="text-muted-foreground/90">SheEnableAI exists to create safer, focused career opportunities for women — this confirmation is required.</span>
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full text-[13px] font-bold text-white transition-all duration-300 hover:shadow-lg press disabled:opacity-50 disabled:transform-none mt-3 inline-flex items-center justify-center gap-2"
            style={{ background: "var(--grad-mauve-rose)" }}
          >
            {loading ? "Creating account…" : <><span>Create account</span> <ArrowRight size={14} /></>}
          </button>
        </form>

        <p className="text-center text-[12px] text-muted-foreground mt-6">
          Already registered?{" "}
          <Link to="/auth/login" className="text-primary font-bold hover:text-mauve-600 transition-colors">Sign in</Link>
        </p>

        <div className="text-center text-[10px] text-muted-foreground mt-6 opacity-75">
          By signing up you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}