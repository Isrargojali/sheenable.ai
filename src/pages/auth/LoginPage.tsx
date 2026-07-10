import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { apiAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useSEO from "@/hooks/useSEO";
import { 
  AuthLayout, 
  RoleTabs, 
  AuthInput, 
  AuthPasswordInput, 
  AuthButton, 
  SocialAuthButtons 
} from "./AuthComponents";

type Role = "CANDIDATE" | "EMPLOYER" | "ADMIN";

const ROLE_REDIRECTS: Record<string, string> = {
  CANDIDATE: "/candidate/dashboard",
  EMPLOYER: "/employer/dashboard",
  ADMIN: "/admin/overview",
  SUPER_ADMIN: "/super-admin/overview",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const applyJobId = searchParams.get("applyJobId");
  const setSession = useAuthStore(s => s.setSession);

  const isAdminMode = location.pathname === "/admin/sign-in";

  useSEO({
    title: isAdminMode ? "Admin Sign In | SheEnableAI" : "Sign In | SheEnableAI — Pakistan's Female Tech Careers",
    description: "Sign in to your SheEnableAI account to apply for verified jobs, access mentorship, and manage your hiring dashboard.",
  });

  const [role, setRole] = useState<Role>(isAdminMode ? "ADMIN" : "CANDIDATE");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getFieldError = (fieldName: string) => {
    if (!error) return null;
    const errLower = error.toLowerCase();
    if (fieldName === 'email' && errLower.includes('email')) return error;
    if (fieldName === 'password' && errLower.includes('password')) return error;
    return null;
  };

  const hasFieldSpecificError = !!error && (
    error.toLowerCase().includes('email') ||
    error.toLowerCase().includes('password')
  );

  // Simulated OAuth Modal State
  const [oauthModal, setOauthModal] = useState<{ isOpen: boolean; provider: 'Google' | 'LinkedIn' }>({
    isOpen: false,
    provider: 'Google'
  });
  const [oauthEmail, setOauthEmail] = useState("");
  const [oauthFname, setOauthFname] = useState("");
  const [oauthLname, setOauthLname] = useState("");
  const [oauthRole, setOauthRole] = useState<Role>("CANDIDATE");

  useEffect(() => {
    setRole(isAdminMode ? "ADMIN" : "CANDIDATE");
  }, [isAdminMode]);

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
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; errors?: { userId?: string; email?: string; devOtp?: string } } } };
      let errorMessage = axiosErr.response?.data?.message || "Login failed";

      if (axiosErr.response?.status === 403 && axiosErr.response?.data?.errors?.userId) {
        const { userId, email: errEmail, devOtp } = axiosErr.response.data.errors;
        const devOtpParam = devOtp ? `&devOtp=${devOtp}` : "";
        const applyJobParam = applyJobId ? `&applyJobId=${applyJobId}` : "";
        
        setError("Please verify your email first. Redirecting to verification page...");
        toast.info("Verification code sent to your email!");
        
        setTimeout(() => {
          navigate(`/auth/verify?userId=${userId}&email=${encodeURIComponent(errEmail || email)}${devOtpParam}${applyJobParam}`);
        }, 1500);
        return;
      }

      if (err instanceof Error) {
        if (!axiosErr.response?.data?.message) {
           errorMessage = err.message;
        }

        if (errorMessage.includes("Network") || errorMessage.includes("ERR_")) {
          errorMessage = "Connection error. Please check your internet connection and try again.";
        }
      }

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
    <AuthLayout
      title={isAdminMode ? "Admin Sign in" : "Welcome back"}
      subtitle={isAdminMode ? "Access the administrator console." : "Sign in to continue your journey."}
    >
      {!isAdminMode && (
        <RoleTabs role={role as any} onChange={fillRole as any} />
      )}

      {error && !hasFieldSpecificError && (
        <div className="bg-rose-50 border border-rose-200 rounded-[var(--radius-input)] px-4 py-3 mt-[28px] text-[12px] text-rose-700 animate-shake animate-fade-in">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="no-scrollbar mt-[28px] space-y-6 animate-fade-in" noValidate>
        <AuthInput
          label="Email address"
          id="login-email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }}
          placeholder="you@example.com"
          autoComplete="email"
          icon={Mail}
          error={getFieldError('email')}
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="login-pwd" className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">
              Password
            </label>
            <Link to="/auth/forgot-password" className="text-[12px] font-normal text-[var(--brand-pink)] hover:opacity-85 transition-opacity">
              Forgot password?
            </Link>
          </div>
          <AuthPasswordInput
            id="login-pwd"
            value={password}
            onChange={e => { setPass(e.target.value); setError(""); }}
            placeholder="••••••••"
            autoComplete="current-password"
            error={getFieldError('password')}
          />
        </div>

        <AuthButton loading={loading}>
          {loading ? "Signing in securely…" : <><span>Sign in securely</span> <ArrowRight size={16} /></>}
        </AuthButton>
      </form>

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

      {!isAdminMode && (
        <p className="text-center text-[12px] text-muted-foreground mt-6 animate-fade-in">
          New to SheEnableAI?{" "}
          <Link to="/auth/signup" className="text-[var(--brand-pink)] font-bold hover:opacity-85 transition-opacity">
            Join Free →
          </Link>
        </p>
      )}

      <div className="text-center text-[11px] text-[var(--ink-500)] mt-8 animate-fade-in">
        🔒 SHA-256 encrypted · httpOnly cookies · Rate limited
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
              <h2 className="font-serif text-xl font-bold text-[var(--auth-ink-900)]">Sign in with {oauthModal.provider}</h2>
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
