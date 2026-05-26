// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge }               from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "";
  const fmt = (n: number) => `PKR ${n.toLocaleString("en-US")}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return min ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`;
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
