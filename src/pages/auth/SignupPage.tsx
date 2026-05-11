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
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= s ? colors[s] : "hsl(var(--border))" }} />
        ))}
      </div>
      {pwd && <p className="text-[10px] mt-1 font-medium" style={{ color: colors[s] }}>{labels[s]}</p>}
    </div>
  );
}

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

const inputCls =
  "w-full h-11 px-3.5 border border-border rounded-xl text-[13px] bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-foreground/75 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const initialRole: Role = params.get("role") === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";

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
      });
      // Pass devOtp in URL so VerifyOtpPage can show it for easy copy/auto-fill
      const devOtpParam = res.data.devOtp ? `&devOtp=${res.data.devOtp}` : "";
      navigate(`/auth/verify?userId=${res.data.userId}&email=${encodeURIComponent(email)}${devOtpParam}`);
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
    <div className="min-h-screen flex items-center justify-center bg-background bg-arcs px-4 py-10">
      <div className="w-full max-w-[440px]">

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-7">
          <img
            src={logo}
            alt="SheEnableAI logo"
            className="w-48 h-24 object-contain transition-transform group-hover:scale-105"
          />
        </div>

        <h1 className="font-serif text-4xl text-foreground mb-1.5 tracking-tight">
          {role === "CANDIDATE" ? "Join SheEnableAI" : "Hire with SheEnableAI"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {role === "CANDIDATE"
            ? "Free forever for women professionals."
            : "Reach 50,000+ qualified women. First job free."}
        </p>

        {/* Role switcher */}
        <div className="flex bg-secondary rounded-full p-1 mb-5">
          {(["CANDIDATE", "EMPLOYER"] as Role[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError(""); }}
              className={cn(
                "flex-1 h-10 rounded-full text-[12px] font-bold press transition-colors inline-flex items-center justify-center gap-1.5",
                role === r ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r === "CANDIDATE" ? <User size={13} /> : <Building2 size={13} />}
              {r === "CANDIDATE" ? "I'm a Candidate" : "I'm an Employer"}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4 text-[12px] text-rose-700">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {role === "CANDIDATE" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <input value={fname} onChange={e => setFname(e.target.value)}
                  placeholder="Ayesha" className={inputCls} />
              </Field>
              <Field label="Last name">
                <input value={lname} onChange={e => setLname(e.target.value)}
                  placeholder="Khan" className={inputCls} />
              </Field>
            </div>
          ) : (
            <>
              <Field label="Company name">
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="Acme Inc." className={cn(inputCls, "pl-10")} />
                </div>
              </Field>
              <Field label="Company size">
                <select value={companySize} onChange={e => setCompanySize(e.target.value)} className={inputCls}>
                  {COMPANY_SIZES.map(s => <option key={s}>{s} employees</option>)}
                </select>
              </Field>
            </>
          )}

          <Field label={role === "EMPLOYER" ? "Work email" : "Email address"}>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={role === "EMPLOYER" ? "you@company.com" : "you@example.com"}
                autoComplete="email"
                className={cn(inputCls, "pl-10")} />
            </div>
            {role === "EMPLOYER" && (
              <p className="text-[10px] text-muted-foreground mt-1.5">We verify employers via your work email domain.</p>
            )}
          </Field>

          <Field label="Password">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input type={showPwd ? "text" : "password"} value={pwd} onChange={e => setPwd(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className={cn(inputCls, "pl-10 pr-10")} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <PwdStrength pwd={pwd} />
          </Field>

          <Field label="Confirm password">
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              className={inputCls} />
          </Field>

          {/* Women-only confirmation */}
          {role === "CANDIDATE" && (
            <label className={cn(
              "flex items-start gap-3 rounded-2xl border-l-[3px] p-4 cursor-pointer press",
              identityOk
                ? "bg-mint-50 border-mint-300 border border-l-mint-500"
                : "bg-mauve-50 border-mauve-200 border border-l-primary"
            )}>
              <input
                type="checkbox"
                checked={identityOk}
                onChange={e => { setIdentityOk(e.target.checked); setError(""); }}
                className="mt-0.5 w-4 h-4 accent-primary cursor-pointer flex-shrink-0"
              />
              <span className="text-[12px] text-foreground/85 leading-relaxed">
                <strong className="text-foreground">I confirm I identify as a woman or non-binary individual.</strong>
                <br />
                <span className="text-muted-foreground">SheEnableAI exists to create safer, focused career opportunities for women — this confirmation is required.</span>
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full text-[13px] font-bold bg-primary text-primary-foreground hover:bg-mauve-600 hover:-translate-y-0.5 hover:shadow-elev2 press disabled:opacity-50 disabled:transform-none mt-3 inline-flex items-center justify-center gap-2"
          >
            {loading ? "Creating account…" : <><span>Create account</span> <ArrowRight size={14} /></>}
          </button>
        </form>

        <p className="text-center text-[12px] text-muted-foreground mt-5">
          Already registered?{" "}
          <Link to="/auth/login" className="text-primary font-bold hover:text-mauve-600">Sign in</Link>
        </p>

        <div className="text-center text-[10px] text-muted-foreground mt-6">
          By signing up you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}