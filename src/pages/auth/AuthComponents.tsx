// src/pages/auth/AuthComponents.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Check,
  Sparkles, 
  Heart, 
  ShieldCheck 
} from "lucide-react";

// --- Spacing / Styling Constants ---
const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

// --- 1. AuthLayout Component ---
interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[40fr_60fr] xl:grid-cols-[50fr_50fr] bg-[var(--auth-surface-muted)] relative overflow-hidden">
      {/* ── Left: Brand & mission ─────────────────── */}
      <aside className="flex flex-col justify-between relative overflow-hidden text-white px-6 py-10 lg:px-12 lg:py-12 bg-[var(--auth-ink-900)] h-auto lg:h-full lg:min-h-screen">
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
          {/* Logo collapse for mobile */}
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
            {title}
          </h1>
          <p className="text-[13px] text-muted-foreground text-center mb-6">
            {subtitle}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}

// --- 2. RoleTabs Component ---
type Role = "CANDIDATE" | "EMPLOYER";

interface RoleTabsProps {
  role: Role;
  onChange: (role: Role) => void;
}

export function RoleTabs({ role, onChange }: RoleTabsProps) {
  return (
    <div className="w-full h-11 bg-[#F4F4F6] rounded-[10px] p-1 flex items-center mb-0">
      {(["CANDIDATE", "EMPLOYER"] as Role[]).map(r => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "flex-1 h-9 rounded-[8px] text-[13px] font-semibold transition-all duration-150 ease-in-out press",
            role === r 
              ? "bg-white text-[var(--brand-pink)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]" 
              : "bg-transparent text-[var(--ink-500)] hover:text-[var(--ink-700)]"
          )}
        >
          {r === "CANDIDATE" ? "Candidate" : "Employer"}
        </button>
      ))}
    </div>
  );
}

// --- 3. AuthInput Component ---
interface AuthInputProps {
  label?: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ComponentType<any>;
  error?: string | null;
  autoComplete?: string;
}

export function AuthInput({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  autoComplete,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-2 text-left">
      {label && (
        <label htmlFor={id} className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">
          {label}
        </label>
      )}
      <div className={cn(
        "relative flex items-center h-12 bg-white transition-all duration-200 border rounded-[var(--radius-input)]",
        error
          ? "border-[#D92D20] ring-1 ring-[#D92D20]"
          : focused 
            ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]" 
            : "border-[var(--auth-border)]"
      )}>
        {Icon && <Icon className="absolute left-3.5 text-[var(--ink-500)]" size={18} />}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            "w-full h-12 bg-transparent border-none rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-0",
            Icon ? "pl-11 pr-3.5" : "pl-3.5 pr-3.5"
          )}
        />
      </div>
      {error && (
        <p className="text-[12px] text-[#D92D20] mt-1.5">{error}</p>
      )}
    </div>
  );
}

// --- 4. Password Strength Meter ---
export function PwdStrength({ pwd }: { pwd: string }) {
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

// --- 5. AuthPasswordInput Component ---
interface AuthPasswordInputProps {
  label?: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string | null;
  autoComplete?: string;
  showStrength?: boolean;
}

export function AuthPasswordInput({
  label,
  id,
  value,
  onChange,
  placeholder = "••••••••",
  error,
  autoComplete,
  showStrength = false,
}: AuthPasswordInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  return (
    <div className="space-y-2 text-left">
      {label && (
        <label htmlFor={id} className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">
          {label}
        </label>
      )}
      <div className={cn(
        "relative flex items-center h-12 bg-white transition-all duration-200 border rounded-[var(--radius-input)]",
        error
          ? "border-[#D92D20] ring-1 ring-[#D92D20]"
          : focused 
            ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]" 
            : "border-[var(--auth-border)]"
      )}>
        <Lock className="absolute left-3.5 text-[var(--ink-500)]" size={18} />
        <input
          id={id}
          type={showPwd ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
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
      {error && (
        <p className="text-[12px] text-[#D92D20] mt-1.5">{error}</p>
      )}
      {showStrength && <PwdStrength pwd={value} />}
    </div>
  );
}

// --- 6. AuthSelect Component ---
interface AuthSelectProps {
  label?: string;
  id: string;
  value: string;
  onChange: (value: any) => void;
  options: string[];
  error?: string | null;
  icon?: React.ComponentType<any>;
  placeholder?: string;
}

export function AuthSelect({
  label,
  id,
  value,
  onChange,
  options,
  error,
  icon: Icon,
  placeholder = "Select company size",
}: AuthSelectProps) {
  const [open, setOpen] = useState(false);

  const handleValueChange = (val: string) => {
    if (typeof onChange === "function") {
      onChange(val);
      const syntheticEvent = {
        target: { value: val, name: id, id },
        currentTarget: { value: val, name: id, id },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className="space-y-2 text-left">
      {label && (
        <label htmlFor={id} className="block text-[12px] font-semibold text-[var(--ink-700)] uppercase tracking-[0.04em]">
          {label}
        </label>
      )}

      <SelectPrimitive.Root value={value} onValueChange={handleValueChange} open={open} onOpenChange={setOpen}>
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            "relative flex items-center justify-between w-full h-12 px-3.5 bg-white transition-all duration-200 border rounded-[var(--radius-input)] text-[13px] text-[var(--ink-900)] focus:outline-none cursor-pointer select-none",
            error
              ? "border-[#D92D20] ring-1 ring-[#D92D20]"
              : open
                ? "border-[var(--brand-pink)] ring-[3px] ring-[rgba(230,0,126,0.12)]"
                : "border-[var(--auth-border)] hover:border-[var(--ink-300)]"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {Icon && <Icon className="text-[var(--ink-500)] flex-shrink-0" size={18} />}
            <SelectPrimitive.Value placeholder={placeholder}>
              {value ? `${value} employees` : placeholder}
            </SelectPrimitive.Value>
          </div>
          <SelectPrimitive.Icon asChild>
            <ChevronDown
              className={cn(
                "text-[var(--ink-500)] transition-transform duration-200 flex-shrink-0",
                open && "rotate-180 text-[var(--brand-pink)]"
              )}
              size={18}
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className="z-50 w-[var(--radix-select-trigger-width)] max-h-60 overflow-y-auto rounded-[var(--radius-input)] border border-[var(--auth-border)] bg-white p-1.5 shadow-xl shadow-black/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            <SelectPrimitive.Viewport className="p-1 space-y-1">
              {options.map((option) => {
                const isSelected = value === option;
                const displayText = `${option} employees`;
                return (
                  <SelectPrimitive.Item
                    key={option}
                    value={option}
                    className={cn(
                      "relative flex items-center justify-between w-full px-3 py-2.5 rounded-[8px] text-[13px] font-medium cursor-pointer outline-none select-none transition-all duration-150",
                      isSelected
                        ? "bg-pink-50 text-[var(--brand-pink)] font-semibold"
                        : "text-[var(--ink-800)] hover:bg-[var(--auth-surface-muted)] hover:text-[var(--ink-900)] focus:bg-pink-50/60 focus:text-[var(--brand-pink)]"
                    )}
                  >
                    <SelectPrimitive.ItemText>{displayText}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator>
                      <Check size={16} className="text-[var(--brand-pink)]" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                );
              })}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && (
        <p className="text-[12px] text-[#D92D20] mt-1.5">{error}</p>
      )}
    </div>
  );
}

// --- 7. AuthButton Component ---
interface AuthButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}

export function AuthButton({
  children,
  loading = false,
  disabled = false,
  type = "submit",
  onClick,
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="w-full btn-auth-primary press disabled:opacity-50 mt-0"
    >
      {children}
    </button>
  );
}

// --- 8. SocialAuthButtons Component ---
interface SocialAuthButtonsProps {
  onGoogleClick: () => void;
  onLinkedInClick: () => void;
}

export function SocialAuthButtons({
  onGoogleClick,
  onLinkedInClick,
}: SocialAuthButtonsProps) {
  return (
    <>
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--auth-border)]" />
        <span className="text-[10px] uppercase tracking-wider text-[var(--auth-border)]">or continue with</span>
        <div className="flex-1 h-px bg-[var(--auth-border)]" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          type="button"
          onClick={onGoogleClick}
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
          onClick={onLinkedInClick}
          className="h-12 border border-[var(--auth-border)] rounded-[var(--radius-input)] text-[13px] font-semibold text-[var(--ink-700)] bg-white hover:bg-[var(--auth-surface-muted)] transition-all duration-200 press flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          LinkedIn
        </button>
      </div>
    </>
  );
}

// --- 9. FormSection Component ---
interface FormSectionProps {
  label: string;
  children: React.ReactNode;
}

export function FormSection({ label, children }: FormSectionProps) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)] mb-3">
        {label}
      </h3>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}
