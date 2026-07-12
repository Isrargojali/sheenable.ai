import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans:  ['Satoshi', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Satoshi', 'sans-serif'],
        serif: ['Cabinet Grotesk', 'Satoshi', 'Playfair Display', 'serif'],
        mono:  ['ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      screens: {
        // Briefed: 375 / 768 / 1280 / 1440
        xs: "375px",
      },
      colors: {
        "brand-pink": "var(--brand-pink)",
        "ink-900": "var(--ink-900)",
        "ink-700": "var(--ink-700)",
        "ink-500": "var(--ink-500)",
        "ink-300": "var(--ink-300)",
        "ink-100": "var(--ink-100)",
        surface: "var(--surface)",
        "accent-green": "var(--accent-green)",
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Mauve scale
        mauve: {
          50:  "#FBF5F8",
          100: "#F7E9F1",
          200: "#EFD5E3",
          300: "#D8A3BF",
          400: "#B86F95",
          500: "#7C3B6E",
          600: "#5E2A53",
          700: "#3F1C37",
          800: "#2A1428",
          900: "#1A0E1F",
        },
        // Mint scale
        mint: {
          50:  "#E5F5EE",
          100: "#C8EAD8",
          200: "#92D6B6",
          300: "#5DBE93",
          400: "#3DAA7D",
          500: "#2C8862",
          600: "#226B4D",
          700: "#1A523B",
        },
        // Legacy "ink" scale (keep so older dashboard pages don't break)
        ink: {
          50:  "#F3EFF8",
          100: "#EDE8F5",
          200: "#D4CDE8",
          300: "#A89EC0",
          400: "#6B6480",
          500: "#3D3656",
          600: "#211B33",
          700: "#211B33",
          800: "#14101F",
          900: "#14101F",
        },
      },
      borderRadius: {
        // shadcn-compat keys (keep)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        // Design token keys — use these in new components
        "token-sm": "var(--radius-sm)",  /*  6px — badges/chips    */
        "token-md": "var(--radius-md)",  /* 10px — row items       */
        "token-lg": "var(--radius-lg)",  /* 14px — cards/sections  */
        "token-xl": "var(--radius-xl)",  /* 20px — modals/panels   */
      },
      boxShadow: {
        card:    "0 1px 2px rgba(14, 14, 18, 0.04)",
        soft:    "0 1px 2px hsl(264 31% 9% / 0.04)",
        elev1:   "0 6px 16px -4px hsl(317 35% 36% / 0.08)",
        elev2:   "0 20px 40px -16px hsl(317 35% 36% / 0.18)",
        elev3:   "0 30px 60px -20px hsl(317 35% 36% / 0.25)",
        mint:    "0 20px 40px -16px hsl(159 47% 45% / 0.35)",
        ring:    "0 0 0 4px hsl(317 35% 36% / 0.12)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in":   { "0%": { opacity: "0", transform: "translate3d(0, 4px, 0)" }, "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" } },
        "page-fade":  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up":  { "0%": { opacity: "0", transform: "translate3d(0, 24px, 0)" }, "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" } },
        "pulse-ring":{ "0%, 100%": { boxShadow: "0 0 0 0 rgba(61, 170, 125, 0.4)" }, "60%": { boxShadow: "0 0 0 6px rgba(61, 170, 125, 0)" } },
        "float":     { "0%, 100%": { transform: "translate3d(0, 0, 0)" }, "50%": { transform: "translate3d(0, -6px, 0)" } },
        "marquee":   { "0%": { transform: "translate3d(0, 0, 0)" }, "100%": { transform: "translate3d(-50%, 0, 0)" } },
        "shimmer":   { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "glow-pulse":{ "0%, 100%": { opacity: "0.4" }, "50%": { opacity: "0.8" } },
        "ticker":    { "0%": { transform: "translate3d(0, 0, 0)" }, "100%": { transform: "translate3d(-50%, 0, 0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.3s ease-out",
        "page-fade":       "page-fade 0.25s ease-out",
        "slide-up":       "slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-ring":     "pulse-ring 2s infinite",
        "float":          "float 6s ease-in-out infinite",
        "marquee":        "marquee 40s linear infinite",
        "shimmer":        "shimmer 3s linear infinite",
        "glow-pulse":     "glow-pulse 4s ease-in-out infinite",
        "ticker":         "ticker 35s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
