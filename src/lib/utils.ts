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

  // Normalize inputs (scale values less than 5 digits, e.g. 200 -> 200000)
  const normalize = (val?: number) => {
    if (val === undefined || val === null || val <= 0) return undefined;
    if (val < 10000) {
      return val * 1000;
    }
    return val;
  };

  const normMin = normalize(min);
  const normMax = normalize(max);

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
  if (!name) return "";
  const words = name
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, "")) // Keep only letters
    .filter(Boolean);

  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function getCompanyGradient(name: string): string {
  if (!name) return "from-violet-500 to-violet-700 text-white";
  const charCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
  const gradients = [
    "from-pink-500 to-rose-500 text-white",
    "from-violet-500 to-indigo-500 text-white",
    "from-cyan-500 to-blue-500 text-white",
    "from-emerald-500 to-teal-500 text-white",
    "from-amber-500 to-orange-500 text-white",
    "from-fuchsia-500 to-purple-500 text-white"
  ];
  return gradients[charCode % gradients.length];
}

export function truncate(str: string, max = 60): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function getDownloadUrl(url?: string | null): string {
  if (!url) return "";
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
}
