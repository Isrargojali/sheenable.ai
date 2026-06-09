// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge }               from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min?: number, max?: number, currency?: string): string {
  if (!min && !max) return "";

  // Internally flag missing currency unit and fall back to default 'PKR'
  let activeCurrency = currency;
  if (!activeCurrency) {
    console.warn(`[Review Required] Salary currency not specified for min: ${min}, max: ${max}. Defaulting to PKR.`);
    activeCurrency = "PKR";
  }

  // Normalize inputs (scale values less than 1000 to thousands, e.g. 200 -> 200000)
  let normMin = min;
  let normMax = max;

  if (normMin !== undefined && normMin > 0 && normMin < 1000) {
    normMin = normMin * 1000;
  }
  if (normMax !== undefined && normMax > 0 && normMax < 1000) {
    normMax = normMax * 1000;
  }

  const fmt = (n: number) => {
    if (n >= 1000) {
      return `${activeCurrency} ${Math.round(n / 1000)}K`;
    }
    return `${activeCurrency} ${n}`;
  };

  let salaryStr = "";
  if (normMin && normMax) {
    salaryStr = `${fmt(normMin)} – ${fmt(normMax)}`;
  } else if (normMin) {
    salaryStr = `From ${fmt(normMin)}`;
  } else if (normMax) {
    salaryStr = `Up to ${fmt(normMax)}`;
  }

  return salaryStr ? `${salaryStr} per month` : "";
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

export function truncate(str: string, max = 60): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}
