// src/components/AccessibilityWidget.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Accessibility, 
  X, 
  RotateCcw, 
  Eye, 
  Activity, 
  Brain, 
  UserCheck, 
  Palette, 
  Type, 
  Search, 
  Minus, 
  Plus, 
  FileText, 
  Check 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Settings interfaces
interface AccessibilitySettings {
  // Profiles
  profile: "epilepsy" | "visually-impaired" | "cognitive" | "adhd" | "blindness" | "colorblind" | null;
  // Granular Settings
  stopAnimations: boolean;
  fontSize: "normal" | "large" | "xlarge";
  contrast: "default" | "high" | "grayscale";
  highlightLinks: boolean;
  highlightTitles: boolean;
  dyslexiaFont: boolean;
  readingGuide: boolean;
  readingMask: boolean;
  muteImages: boolean;
  lowSaturation: boolean;
  colorblindPalette: boolean;
  screenReaderOptimize: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  profile: null,
  stopAnimations: false,
  fontSize: "normal",
  contrast: "default",
  highlightLinks: false,
  highlightTitles: false,
  dyslexiaFont: false,
  readingGuide: false,
  readingMask: false,
  muteImages: false,
  lowSaturation: false,
  colorblindPalette: false,
  screenReaderOptimize: false,
};

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem("she-enable-a11y-settings");
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [mouseY, setMouseY] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Mouse move listener for reading guide & mask
  useEffect(() => {
    if (!settings.readingGuide && !settings.readingMask) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [settings.readingGuide, settings.readingMask]);

  // Apply settings to document.documentElement attributes
  useEffect(() => {
    const root = document.documentElement;

    // Apply attributes based on current settings state
    root.setAttribute("data-a11y-stop-animations", String(settings.stopAnimations));
    root.setAttribute("data-a11y-font-size", settings.fontSize);
    root.setAttribute("data-a11y-contrast", settings.contrast);
    root.setAttribute("data-a11y-highlight-links", String(settings.highlightLinks));
    root.setAttribute("data-a11y-highlight-titles", String(settings.highlightTitles));
    root.setAttribute("data-a11y-dyslexia", String(settings.dyslexiaFont));
    root.setAttribute("data-a11y-mute-images", String(settings.muteImages));
    root.setAttribute("data-a11y-low-saturation", String(settings.lowSaturation));
    root.setAttribute("data-a11y-colorblind", String(settings.colorblindPalette));
    root.setAttribute("data-a11y-screen-reader", String(settings.screenReaderOptimize));

    localStorage.setItem("she-enable-a11y-settings", JSON.stringify(settings));
  }, [settings]);

  // Handle Keyboard Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Keep focus within panel when open (Accessibility requirement)
  useEffect(() => {
    if (isOpen) {
      // Focus the first interactive element inside panel
      const focusable = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex="0"]'
      );
      if (focusable && focusable.length > 0) {
        (focusable[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // Apply a Profile Preset
  const applyProfile = (profileType: AccessibilitySettings["profile"]) => {
    if (settings.profile === profileType) {
      // Reset if clicked again
      setSettings(DEFAULT_SETTINGS);
      return;
    }

    const newSettings = { ...DEFAULT_SETTINGS, profile: profileType };

    switch (profileType) {
      case "epilepsy":
        newSettings.stopAnimations = true;
        newSettings.lowSaturation = true;
        break;
      case "visually-impaired":
        newSettings.fontSize = "large";
        newSettings.contrast = "high";
        newSettings.highlightLinks = true;
        break;
      case "cognitive":
        newSettings.highlightTitles = true;
        newSettings.readingGuide = true;
        newSettings.dyslexiaFont = true;
        break;
      case "adhd":
        newSettings.muteImages = true;
        newSettings.stopAnimations = true;
        newSettings.readingGuide = true;
        break;
      case "blindness":
        newSettings.screenReaderOptimize = true;
        break;
      case "colorblind":
        newSettings.colorblindPalette = true;
        break;
    }

    setSettings(newSettings);
  };

  const resetAll = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const toggleSetting = (key: keyof Omit<AccessibilitySettings, "profile" | "fontSize" | "contrast">) => {
    setSettings((prev) => ({
      ...prev,
      profile: null, // Clear profile if granular setting modified
      [key]: !prev[key],
    }));
  };

  const setFontSize = (size: AccessibilitySettings["fontSize"]) => {
    setSettings((prev) => ({
      ...prev,
      profile: null,
      fontSize: size,
    }));
  };

  const setContrast = (contrastVal: AccessibilitySettings["contrast"]) => {
    setSettings((prev) => ({
      ...prev,
      profile: null,
      contrast: contrastVal,
    }));
  };

  return (
    <>
      {/* Screen Reader Skip Link */}
      {settings.screenReaderOptimize && (
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only fixed top-4 left-4 bg-[var(--brand-pink)] text-white px-4 py-2 rounded-xl font-bold z-[9999] outline-none ring-2 ring-[var(--brand-pink)]"
        >
          Skip to main content
        </a>
      )}

      {/* Floating Accessibility Action Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white shadow-xl flex items-center justify-center press z-[49] outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-pink)]/40 transition-all border border-white/10"
        aria-label="Accessibility options"
        aria-expanded={isOpen}
      >
        <Accessibility size={28} strokeWidth={2.25} />
      </button>

      {/* Reading Guide Horizontal Focus Rule */}
      {settings.readingGuide && (
        <div 
          className="fixed left-0 right-0 h-1 bg-[var(--brand-pink)] pointer-events-none z-[9999]"
          style={{ top: mouseY - 2, boxShadow: "0 0 8px var(--brand-pink)" }}
          aria-hidden="true"
        />
      )}

      {/* Reading Mask Overlay */}
      {settings.readingMask && (
        <div className="fixed inset-0 pointer-events-none z-[9998] flex flex-col" aria-hidden="true">
          <div className="bg-black/60 w-full" style={{ height: Math.max(0, mouseY - 50) }} />
          <div className="h-[100px] w-full bg-transparent border-y-2 border-dashed border-[var(--brand-pink)]" />
          <div className="bg-black/60 w-full flex-1" />
        </div>
      )}

      {/* Slide-in Widget Settings Panel */}
      {isOpen && (
        <>
          {/* Backdrop Mask */}
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] animate-fade-in"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Accessibility settings"
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-[#14101F] border-l border-white/10 shadow-2xl z-[1000] p-6 overflow-y-auto flex flex-col text-white animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Accessibility size={20} className="text-[var(--brand-pink)]" />
                <h2 className="font-sans font-bold text-base text-white">Accessibility Center</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetAll}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 press"
                  aria-label="Reset all options"
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all press"
                  aria-label="Close accessibility center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable controls */}
            <div className="flex-1 space-y-6 scrollbar-thin">
              {/* Section A: Disability Presets */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">Quick Disability Profiles</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "epilepsy", label: "Epilepsy Safe", desc: "No animations, muted colors", icon: Activity },
                    { id: "visually-impaired", label: "Visually Impaired", desc: "Large text, high contrast", icon: Eye },
                    { id: "cognitive", label: "Cognitive Friendly", desc: "Helper guide, dyslexia font", icon: Brain },
                    { id: "adhd", label: "ADHD Friendly", desc: "Minimalist layout, reading helper", icon: UserCheck },
                    { id: "blindness", label: "Screen Reader", desc: "Enhanced screen-reader attributes", icon: FileText },
                    { id: "colorblind", label: "Color Blind Safe", desc: "High contrast status indicators", icon: Palette },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isActive = settings.profile === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => applyProfile(p.id as any)}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 press",
                          isActive 
                            ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]/10 text-white" 
                            : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-white/80"
                        )}
                        aria-pressed={isActive}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon size={16} className={isActive ? "text-[var(--brand-pink)]" : "text-white/60"} />
                          {isActive && <Check size={12} className="text-[var(--brand-pink)]" />}
                        </div>
                        <div>
                          <div className="text-[12px] font-bold leading-tight">{p.label}</div>
                          <div className="text-[10px] text-white/45 mt-0.5 leading-normal">{p.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-white/10" />

              {/* Section B: Granular Settings */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">Granular Adjustments</h3>

                {/* Font Size Adjust */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-semibold">Font Size Adjustment</span>
                    <span className="text-[11px] text-white/65 uppercase tracking-wide">
                      {settings.fontSize === "normal" ? "Standard" : settings.fontSize === "large" ? "Large" : "Extra Large"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {["normal", "large", "xlarge"].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setFontSize(sz as any)}
                        className={cn(
                          "flex-1 h-9 rounded-xl text-xs font-semibold transition-all border press",
                          settings.fontSize === sz
                            ? "bg-[var(--brand-pink)] border-[var(--brand-pink)] text-white"
                            : "bg-white/5 border-white/5 text-white/80 hover:bg-white/10"
                        )}
                      >
                        {sz === "normal" ? "Aa" : sz === "large" ? "Aa+" : "Aa++"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contrast Settings */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-semibold">Contrast Themes</span>
                    <span className="text-[11px] text-white/65 uppercase tracking-wide">
                      {settings.contrast === "default" ? "Default" : settings.contrast === "high" ? "High Contrast" : "Grayscale"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {["default", "high", "grayscale"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setContrast(c as any)}
                        className={cn(
                          "flex-1 h-9 rounded-xl text-[11px] font-semibold transition-all border press",
                          settings.contrast === c
                            ? "bg-[var(--brand-pink)] border-[var(--brand-pink)] text-white"
                            : "bg-white/5 border-white/5 text-white/80 hover:bg-white/10"
                        )}
                      >
                        {c === "default" ? "Default" : c === "high" ? "Contrast" : "Monochrome"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Toggles */}
                <div className="space-y-3 pt-2">
                  {[
                    { id: "stopAnimations", label: "Epilepsy: Disable Animations", desc: "Stops all non-essential loops and page animations." },
                    { id: "dyslexiaFont", label: "Dyslexia Friendly Font", desc: "Optimizes readability and letter spacing." },
                    { id: "highlightLinks", label: "Highlight Underline Links", desc: "Adds clear border outlines and underlines to links." },
                    { id: "highlightTitles", label: "Highlight Headers & Titles", desc: "Highlights section titles with thick left borders." },
                    { id: "readingGuide", label: "Horizontal Reading Guide", desc: "Adds a pink guide line following your cursor." },
                    { id: "readingMask", label: "Visual Focus Reading Mask", desc: "Dims the page background except for a horizontal slit." },
                    { id: "muteImages", label: "ADHD: Mute Media Content", desc: "Partially dims images to avoid visual distraction." },
                    { id: "lowSaturation", label: "Sensory: Low Saturation", desc: "Mutes high-intensity colors." },
                    { id: "colorblindPalette", label: "Color Blind Safe Scheme", desc: "Applies high-contrast colors to tags and badges." },
                    { id: "screenReaderOptimize", label: "Enhanced Screen-Reader Landmarks", desc: "Injects skip-links and helper tags." },
                  ].map((item) => {
                    const isChecked = settings[item.id as keyof AccessibilitySettings] === true;
                    return (
                      <div 
                        key={item.id}
                        className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-white/5 border border-white/5"
                      >
                        <div className="space-y-0.5">
                          <label htmlFor={item.id} className="text-[12px] font-bold block cursor-pointer">{item.label}</label>
                          <span className="text-[10px] text-white/45 leading-normal block">{item.desc}</span>
                        </div>
                        <button
                          id={item.id}
                          role="switch"
                          aria-checked={isChecked}
                          onClick={() => toggleSetting(item.id as any)}
                          className={cn(
                            "w-11 h-6 rounded-full relative transition-all flex-shrink-0 press",
                            isChecked ? "bg-[var(--brand-pink)]" : "bg-white/10"
                          )}
                        >
                          <span 
                            className={cn(
                              "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm",
                              isChecked ? "right-0.5" : "left-0.5"
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-4 mt-6 text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                Self-Hosted Native A11y Suite v1.0
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
