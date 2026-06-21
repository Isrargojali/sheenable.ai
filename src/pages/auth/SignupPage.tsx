// src/pages/auth/SignupPage.tsx
// Refactored with premium modular AuthComponents.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowRight, Building2, Mail } from "lucide-react";
import { apiAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { 
  AuthLayout, 
  RoleTabs, 
  AuthInput, 
  AuthPasswordInput, 
  AuthSelect, 
  AuthButton, 
  SocialAuthButtons, 
  FormSection 
} from "./AuthComponents";

type Role = "CANDIDATE" | "EMPLOYER";

const ROLE_REDIRECTS: Record<string, string> = {
  CANDIDATE: "/candidate/dashboard",
  EMPLOYER: "/employer/dashboard",
  ADMIN: "/admin/overview",
  SUPER_ADMIN: "/super-admin/overview",
};

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const initialRole: Role = params.get("role") === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";
  const applyJobId = params.get("applyJobId");

  const notice = (location.state as { notice?: string })?.notice ?? "";

  const [role,        setRole]        = useState<Role>(initialRole);
  const [fname,       setFname]       = useState("");
  const [lname,       setLname]       = useState("");
  const [email,       setEmail]       = useState("");
  const [pwd,         setPwd]         = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [identityOk,  setIdentityOk]  = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState(COMPANY_SIZES[1]);
  const [error,       setError]       = useState(notice);
  const [loading,     setLoading]     = useState(false);

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
    <AuthLayout
      title={role === "CANDIDATE" ? "Join SheEnableAI" : "Hire with SheEnableAI"}
      subtitle={role === "CANDIDATE" ? "Free forever for women professionals." : "Reach 50,000+ qualified women. First job free."}
    >
      <RoleTabs role={role} onChange={role => { setRole(role); setError(""); }} />

      {error && !hasFieldSpecificError && (
        <div className="bg-rose-50 border border-rose-200 rounded-[var(--radius-input)] px-4 py-3 mt-[28px] text-[12px] text-rose-700 animate-shake animate-fade-in">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="no-scrollbar mt-[28px] space-y-6 animate-fade-in" noValidate>
        {role === "CANDIDATE" ? (
          <FormSection label="ACCOUNT">
            <div className="grid grid-cols-2 gap-4">
              <AuthInput
                label="First name"
                id="fname"
                value={fname}
                onChange={e => setFname(e.target.value)}
                placeholder="Ayesha"
                error={getFieldError('fname')}
              />
              <AuthInput
                label="Last name"
                id="lname"
                value={lname}
                onChange={e => setLname(e.target.value)}
                placeholder="Khan"
                error={getFieldError('lname')}
              />
            </div>

            <AuthInput
              label="Email address"
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              icon={Mail}
              error={getFieldError('email')}
            />

            <AuthPasswordInput
              label="Password"
              id="pwd"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              showStrength={true}
              error={getFieldError('pwd')}
            />

            <AuthPasswordInput
              label="Confirm password"
              id="confirm"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              error={getFieldError('confirm')}
            />
          </FormSection>
        ) : (
          <div className="space-y-8">
            <FormSection label="COMPANY">
              <AuthInput
                label="Company name"
                id="companyName"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                icon={Building2}
                error={getFieldError('companyName')}
              />
              <AuthSelect
                label="Company size"
                id="companySize"
                value={companySize}
                onChange={e => setCompanySize(e.target.value)}
                options={COMPANY_SIZES}
              />
            </FormSection>

            <FormSection label="ACCOUNT">
              <div className="space-y-2">
                <AuthInput
                  label="Work email"
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  icon={Mail}
                  error={getFieldError('email')}
                />
                {!getFieldError('email') && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1 pl-1">
                    We verify employers via your work email domain.
                  </p>
                )}
              </div>

              <AuthPasswordInput
                label="Password"
                id="pwd"
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                showStrength={true}
                error={getFieldError('pwd')}
              />

              <AuthPasswordInput
                label="Confirm password"
                id="confirm"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                error={getFieldError('confirm')}
              />
            </FormSection>
          </div>
        )}

        {role === "CANDIDATE" && (
          <label className="flex items-start gap-3 rounded-[var(--radius-card)] border-l-[3px] p-4 cursor-pointer transition-all duration-300 press border border-[var(--auth-border)] bg-[var(--auth-surface-muted)] border-l-[var(--brand-pink)]">
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

        <AuthButton loading={loading}>
          {loading ? "Creating account…" : <><span>Create account</span> <ArrowRight size={16} /></>}
        </AuthButton>
      </form>

      {role === "CANDIDATE" && (
        <SocialAuthButtons
          onGoogleClick={() => {
            setOauthEmail("ayesha.k@gmail.com");
            setOauthFname("Ayesha");
            setOauthLname("Khan");
            setOauthRole("CANDIDATE");
            setOauthModal({ isOpen: true, provider: 'Google' });
          }}
          onLinkedInClick={() => {
            setOauthEmail("ayesha.k@linkedin.com");
            setOauthFname("Ayesha");
            setOauthLname("Khan");
            setOauthRole("CANDIDATE");
            setOauthModal({ isOpen: true, provider: 'LinkedIn' });
          }}
        />
      )}

      <p className="text-center text-[13px] font-normal text-[var(--ink-500)] mt-6 animate-fade-in">
        Already registered?{" "}
        <Link to="/auth/login" className="text-[var(--brand-pink)] hover:opacity-85 transition-opacity">Sign in</Link>
      </p>

      <div className="text-center text-[11px] text-[var(--ink-500)] mt-6 animate-fade-in">
        By signing up you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
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
    </AuthLayout>
  );
}