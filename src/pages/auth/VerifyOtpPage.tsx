// src/pages/auth/VerifyOtpPage.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiAuth }                      from "@/lib/api";
import { useAuthStore }                 from "@/store/authStore";
import { useNotifStore }                from "@/store/notifStore";
import { MOCK_NOTIFICATIONS }           from "@/mock/data";
import { cn }                           from "@/lib/utils";

const ROLE_REDIRECTS: Record<string, string> = {
  CANDIDATE: "/candidate/dashboard",
  EMPLOYER:  "/employer/dashboard",
  ADMIN:     "/admin/overview",
};

export default function VerifyOtpPage() {
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const setUser    = useAuthStore(s => s.setUser);
  const setNotifs  = useNotifStore(s => s.setNotifs);
  const userId     = params.get("userId") ?? "";
  const email      = params.get("email") ?? "";

  const [digits,  setDigits]  = useState(["","","","","",""]);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [secs,    setSecs]    = useState(585);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  const m = Math.floor(secs / 60), s = secs % 60;
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
      const user = await apiAuth.verifyOtp(userId, code);
      setUser({ id: user.id, email: user.email, role: user.role as any });
      setNotifs(MOCK_NOTIFICATIONS as any);
      navigate(ROLE_REDIRECTS[user.role] ?? "/");
    } catch (err: any) {
      setError(err.message ?? "Invalid OTP");
    } finally {
      setLoading(false);
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
                "w-11 h-13 text-center border rounded-xl text-xl font-bold font-mono transition-all",
                "text-[#0F0B1A] bg-white focus:outline-none",
                d ? "border-rose-400 bg-rose-50" : "border-[#E8E1F0]",
                "focus:ring-2 focus:ring-rose-500/15 focus:border-rose-400"
              )}
              style={{ height: "52px" }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-500 text-[11px] font-bold px-3 py-1.5 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
          {secs > 0 ? `Expires in ${m}:${s < 10 ? "0" : ""}${s}` : "Expired"}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">⚠ {error}</div>
        )}

        <p className="text-sm text-[#6B6480] mb-5">
          Didn't receive it?{" "}
          <button onClick={() => setSecs(585)} className="text-rose-500 font-semibold hover:text-rose-600">
            Resend code
          </button>
        </p>

        <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 mb-5 text-[11px] text-violet-600">
          <strong>Dev mode:</strong> Type any 6 digits (e.g. 123456) to verify.
        </div>

        <button
          onClick={handleVerify}
          disabled={code.length < 6 || loading}
          className="w-full py-3 rounded-full text-sm font-bold text-white bg-gradient-to-br from-rose-500 to-rose-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? "Verifying…" : "Verify & continue →"}
        </button>

        <button onClick={() => navigate("/auth/signup")}
                className="w-full mt-3 py-2 text-xs text-[#6B6480] hover:text-[#0F0B1A] transition-colors">
          ← Change email
        </button>
      </div>
    </div>
  );
}
