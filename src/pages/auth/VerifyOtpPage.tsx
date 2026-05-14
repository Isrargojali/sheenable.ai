// src/pages/auth/VerifyOtpPage.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiAuth }        from "@/lib/api";
import { useAuthStore }   from "@/store/authStore";
import { useNotifStore }  from "@/store/notifStore";
import { MOCK_NOTIFICATIONS } from "@/mock/data";
import { cn }             from "@/lib/utils";
import { UserRole }       from "@/store/authStore";

const ROLE_REDIRECTS: Record<string, string> = {
  CANDIDATE:   "/candidate/dashboard",
  EMPLOYER:    "/employer/dashboard",
  ADMIN:       "/admin/overview",
  SUPER_ADMIN: "/super-admin/overview",
};

export default function VerifyOtpPage() {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const setSession  = useAuthStore(s => s.setSession);
  const setNotifs   = useNotifStore(s => s.setNotifs);

  const userId = params.get("userId") ?? "";
  const email  = params.get("email")  ?? "";

  const [digits,   setDigits]   = useState(["","","","","",""]);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resending,setResending]= useState(false);
  const [devOtp,   setDevOtp]   = useState(params.get("devOtp") ?? "");
  const [secs,     setSecs]     = useState(585); // 9m 45s
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  // Redirect back to signup if userId is missing (stale link after server restart)
  useEffect(() => {
    if (!userId) {
      navigate("/auth/signup", { replace: true });
    }
  }, [userId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [secs]);

  const m    = Math.floor(secs / 60);
  const s    = secs % 60;
  const code = digits.join("");

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs[i + 1].current?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  }

  async function handleVerify() {
    if (code.length < 6) return setError("Enter all 6 digits");
    setError("");
    setLoading(true);

    try {
      const response = await apiAuth.verifyOTP(userId, code);
      
      // axios wraps response body in .data, backend wraps result in .data wrapper
      // So response.data = { success: true, data: { token, user } }
      const payload = response.data?.data || response.data;
      
      if (!payload || !payload.user || !payload.token) {
        console.error('❌ Invalid API response:', response.data);
        setError("Invalid response from server. Please try again.");
        return;
      }

      // Extract user and token
      const userRole = payload.user.role as UserRole;
      const redirectPath = ROLE_REDIRECTS[userRole];
      
      if (!redirectPath) {
        console.error('❌ No redirect path for role:', userRole);
        setError("Invalid user role. Please contact support.");
        return;
      }

      // Set session with complete user data
      setSession(
        {
          id:        payload.user.id,
          email:     payload.user.email,
          role:      userRole,
          firstName: payload.user.firstName ?? "",
          lastName:  payload.user.lastName  ?? "",
          avatarUrl: payload.user.avatarUrl ?? "",
        },
        payload.token
      );

      setNotifs(MOCK_NOTIFICATIONS);
      
      console.log(`✅ OTP verified for ${payload.user.email}. Redirecting to ${redirectPath}`);
      
      // Hard replace to prevent back button to verify page
      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message  = axiosErr.response?.data?.message ?? "Invalid OTP";

      console.error('❌ OTP verification failed:', message);

      // If user session expired, redirect to signup
      if (message.toLowerCase().includes("not found")) {
        navigate("/auth/signup", {
          state: { notice: "Your session expired. Please sign up again." },
          replace: true
        });
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // FIX — Resend actually calls the API, not just resets the timer
  async function handleResend() {
    if (resending || !userId) return;
    setResending(true);
    setError("");
    try {
      const { data } = await apiAuth.resendOTP(userId);
      setSecs(585); // reset countdown
      setDigits(["","","","","",""]);
      refs[0].current?.focus();
      if (data.devOtp) setDevOtp(data.devOtp);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message  = axiosErr.response?.data?.message ?? "Could not resend code";
      // If user no longer exists, bounce back to signup
      if (message.toLowerCase().includes("not found")) {
        navigate("/auth/signup", {
          state: { notice: "Your session expired. Please sign up again." },
        });
        return;
      }
      setError(message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8FC] px-4">
      <div className="w-full max-w-[360px] text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h1 className="font-serif text-3xl text-[#0F0B1A] mb-2">Check your inbox</h1>
        <p className="text-sm text-[#6B6480] mb-6 leading-relaxed">
          We sent a 6-digit code to<br /><strong className="text-[#0F0B1A]">{email}</strong>
        </p>

        {/* OTP inputs */}
        <div className="flex gap-2 justify-center mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              value={d}
              maxLength={1}
              inputMode="numeric"
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={cn(
                "w-11 text-center border rounded-xl text-xl font-bold font-mono transition-all",
                "text-[#0F0B1A] bg-white focus:outline-none",
                d ? "border-rose-400 bg-rose-50" : "border-[#E8E1F0]",
                "focus:ring-2 focus:ring-rose-500/15 focus:border-rose-400"
              )}
              style={{ height: "52px" }}
            />
          ))}
        </div>

        {/* Countdown timer */}
        <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-500 text-[11px] font-bold px-3 py-1.5 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
          {secs > 0 ? `Expires in ${m}:${s < 10 ? "0" : ""}${s}` : "Code expired"}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
            ⚠ {error}
          </div>
        )}

        {/* Dev OTP hint */}
        {devOtp ? (
          <div
            className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 mb-5 text-[11px] text-violet-700 cursor-pointer select-all"
            title="Click to auto-fill"
            onClick={() => {
              const otp = devOtp.split("");
              setDigits([...otp, ...Array(6 - otp.length).fill("")].slice(0, 6));
            }}
          >
            <strong>Dev OTP:</strong> {devOtp}{" "}
            <span className="opacity-60">(click to auto-fill)</span>
          </div>
        ) : (
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 mb-5 text-[11px] text-violet-600">
            <strong>Dev mode:</strong> Check backend console for your OTP code.
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={code.length < 6 || loading}
          className="w-full py-3 rounded-full text-sm font-bold text-white bg-gradient-to-br from-rose-500 to-rose-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? "Verifying…" : "Verify & continue →"}
        </button>

        <p className="text-sm text-[#6B6480] mt-4 mb-2">
          Didn't receive it?{" "}
          <button
            onClick={handleResend}
            disabled={resending || secs > 540} // allow resend only after 45s
            className="text-rose-500 font-semibold hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </p>

        <button
          onClick={() => navigate("/auth/signup")}
          className="w-full mt-1 py-2 text-xs text-[#6B6480] hover:text-[#0F0B1A] transition-colors"
        >
          ← Change email / Start over
        </button>
      </div>
    </div>
  );
}