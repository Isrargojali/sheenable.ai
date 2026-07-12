// src/components/accessibility/AccessibilityWidget.tsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
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
  Check,
  VolumeX,
  Volume2,
  Maximize2,
  MousePointer,
  HelpCircle,
  Keyboard,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sun,
  Moon,
  MoveHorizontal,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccessibility, COLOR_PRESETS, AccessibilitySettings } from "@/context/AccessibilityContext";

export default function AccessibilityWidget() {
  const location = useLocation();
  const { settings, dispatch } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const [mouseY, setMouseY] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [magnifiedText, setMagnifiedText] = useState<string | null>(null);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  // Mouse move listener for reading guide, mask, and magnifier
  useEffect(() => {
    if (!settings.readingGuide && !settings.readingMask && !settings.textMagnifier) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
      setMouseX(e.clientX);

      // Text Magnifier implementation
      if (settings.textMagnifier) {
        const target = e.target as HTMLElement;
        if (
          target && 
          target.innerText && 
          target.innerText.trim().length > 0 &&
          target.innerText.length < 300 &&
          !target.closest('[role="dialog"]') && // Don't magnify text inside accessibility widget panel
          target.tagName !== "HTML" &&
          target.tagName !== "BODY"
        ) {
          setMagnifiedText(target.innerText.trim());
        } else {
          setMagnifiedText(null);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [settings.readingGuide, settings.readingMask, settings.textMagnifier]);

  // Virtual Keyboard Input tracking
  useEffect(() => {
    if (!settings.virtualKeyboard) {
      setActiveInput(null);
      return;
    }

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        setActiveInput(target as HTMLInputElement | HTMLTextAreaElement);
      }
    };

    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, [settings.virtualKeyboard]);

  // Mute Audio/Video Playback
  useEffect(() => {
    const handleMedia = () => {
      const media = document.querySelectorAll("audio, video");
      media.forEach((el) => {
        const mediaEl = el as HTMLMediaElement;
        mediaEl.muted = settings.muteSounds;
        if (settings.muteSounds && !mediaEl.paused) {
          mediaEl.pause();
        }
      });
    };

    handleMedia();
    const observer = new MutationObserver(handleMedia);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [settings.muteSounds, location.pathname]);

  // Global Keyboard Shortcuts (Alt+1 to toggle panel, Esc to close panel/modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + 1 toggles A11y Panel
      if (e.altKey && e.key === "1") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      
      // Escape closes Panel
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        if (settings.hideTriggerButton) {
          tabRef.current?.focus();
        } else {
          triggerRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, settings.hideTriggerButton]);

  // Keyboard navigation within the drawer panel
  const handlePanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex="0"]'
      );
      if (!focusable) return;

      const activeEl = document.activeElement as HTMLElement;
      const index = Array.from(focusable).indexOf(activeEl);

      if (index > -1) {
        let nextIndex = index + (e.key === "ArrowDown" ? 1 : -1);
        if (nextIndex >= focusable.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = focusable.length - 1;
        focusable[nextIndex].focus();
        e.preventDefault();
      }
    }
  };

  const applyProfile = (profile: AccessibilitySettings["profile"]) => {
    dispatch({ type: "APPLY_PROFILE", profile });
  };

  const resetAll = () => {
    dispatch({ type: "RESET_ALL" });
  };

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    dispatch({ type: "TOGGLE_SETTING", key });
  };

  // Keyboard character inserter
  const handleVirtualKeyboardClick = (char: string) => {
    if (!activeInput) return;
    const start = activeInput.selectionStart ?? 0;
    const end = activeInput.selectionEnd ?? 0;
    const val = activeInput.value;

    if (char === "Backspace") {
      activeInput.value = val.substring(0, Math.max(0, start - 1)) + val.substring(end);
      activeInput.selectionStart = activeInput.selectionEnd = Math.max(0, start - 1);
    } else if (char === "Space") {
      activeInput.value = val.substring(0, start) + " " + val.substring(end);
      activeInput.selectionStart = activeInput.selectionEnd = start + 1;
    } else if (char === "Clear") {
      activeInput.value = "";
      activeInput.selectionStart = activeInput.selectionEnd = 0;
    } else {
      activeInput.value = val.substring(0, start) + char + val.substring(end);
      activeInput.selectionStart = activeInput.selectionEnd = start + char.length;
    }

    // Fire input event for React bindings
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    activeInput.focus();
  };

  return (
    <>
      {/* Screen Reader Skip Navigation Link */}
      {settings.screenReaderOptimize && (
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only fixed top-4 left-4 bg-[var(--brand-pink)] text-white px-5 py-2.5 rounded-xl font-bold z-[9999] outline-none ring-4 ring-[var(--brand-pink)]/40"
        >
          Skip to main content
        </a>
      )}

      {/* Floating Widget Trigger: Main Button or Small Screen Tab */}
      {!settings.hideTriggerButton ? (
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white shadow-xl flex items-center justify-center press z-[60] outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-pink)]/40 transition-all border border-white/10"
          aria-label="Accessibility options"
          aria-expanded={isOpen}
        >
          <Accessibility size={28} strokeWidth={2.25} />
        </button>
      ) : (
        /* Small Edge Tab at Screen edge to bring it back */
        <button
          ref={tabRef}
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/3 w-3.5 h-16 bg-[var(--brand-pink)] hover:w-6 transition-all rounded-l-xl cursor-pointer z-[60] flex items-center justify-center text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pink)]/40 border border-r-0 border-white/20"
          aria-label="Open accessibility suite"
          title="Open accessibility suite"
        >
          <ChevronLeft size={12} className="-ml-0.5" />
        </button>
      )}

      {/* A. Text Magnifier Tooltip */}
      {settings.textMagnifier && magnifiedText && (
        <div 
          className="fixed bg-[#14101F] text-white p-4 rounded-2xl border-2 border-[var(--brand-pink)] shadow-2xl z-[10001] pointer-events-none max-w-md text-base font-bold leading-relaxed break-words"
          style={{ top: mouseY + 24, left: Math.min(window.innerWidth - 320, mouseX + 16) }}
        >
          <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--brand-pink)] mb-1">Magnifier</div>
          {magnifiedText}
        </div>
      )}

      {/* B. Horizontal Reading Guide focus line */}
      {settings.readingGuide && (
        <div 
          className="fixed left-0 right-0 h-1 bg-[var(--brand-pink)] pointer-events-none z-[9999]"
          style={{ top: mouseY - 2, boxShadow: "0 0 8px var(--brand-pink)" }}
          aria-hidden="true"
        />
      )}

      {/* C. Reading Mask Focus Slit */}
      {settings.readingMask && (
        <div className="fixed inset-0 pointer-events-none z-[9998] flex flex-col" aria-hidden="true">
          <div className="bg-black/60 w-full" style={{ height: Math.max(0, mouseY - 50) }} />
          <div className="h-[100px] w-full bg-transparent border-y-2 border-dashed border-[var(--brand-pink)]" />
          <div className="bg-black/60 w-full flex-1" />
        </div>
      )}

      {/* D. Virtual Keyboard Panel */}
      {settings.virtualKeyboard && activeInput && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0E0E12]/95 border-t border-white/10 p-4 z-[9999] shadow-2xl flex flex-col gap-2 max-w-[800px] mx-auto rounded-t-3xl animate-slide-up">
          <div className="flex items-center justify-between text-xs text-white/50 px-2">
            <span>Keyboard Active: Typing inside <strong className="text-white">{activeInput.placeholder || activeInput.name || "input field"}</strong></span>
            <button 
              onClick={() => setActiveInput(null)} 
              className="text-[var(--brand-pink)] font-bold hover:underline"
            >
              Minimize
            </button>
          </div>
          {/* QWERTY Rows */}
          {[
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
            ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
            ["a", "s", "d", "f", "g", "h", "j", "k", "l", "Clear"],
            ["z", "x", "c", "v", "b", "n", "m", ",", ".", "Space"]
          ].map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1 justify-center">
              {row.map((char) => (
                <button
                  key={char}
                  onClick={() => handleVirtualKeyboardClick(char)}
                  className={cn(
                    "h-10 rounded-lg text-sm font-semibold transition-all flex items-center justify-center hover:bg-white/10 active:scale-95 press border border-white/5",
                    char === "Backspace" || char === "Clear"
                      ? "px-4 bg-red-950/40 text-red-200"
                      : char === "Space"
                      ? "flex-1 bg-white/10 max-w-[320px]"
                      : "w-10 bg-white/5 text-white"
                  )}
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Accessibility Center Drawer */}
      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] animate-fade-in"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Accessibility settings panel"
            onKeyDown={handlePanelKeyDown}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[440px] bg-[#14101F] border-l border-white/10 shadow-2xl z-[1000] p-6 overflow-y-auto flex flex-col text-white animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Accessibility size={20} className="text-[var(--brand-pink)]" />
                <h2 className="font-sans font-bold text-base text-white">Accessibility Suite</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetAll}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 press"
                  aria-label="Reset all accessibility settings"
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all press"
                  aria-label="Close panel"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Panel Area */}
            <div className="flex-1 space-y-8 pr-1 overflow-y-auto scrollbar-thin">
              
              {/* SECTION A: Disability Presets */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">Quick Disability Profiles</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "epilepsy", label: "Epilepsy Safe", desc: "No animations, low contrast saturation", icon: Activity },
                    { id: "visually-impaired", label: "Visually Impaired", desc: "Increased size, link highlighted", icon: Eye },
                    { id: "cognitive", label: "Cognitive Friendly", desc: "Helper guide line, readable typography", icon: Brain },
                    { id: "adhd", label: "ADHD Friendly", desc: "No image distractions, focus guide", icon: UserCheck },
                    { id: "blindness", label: "Screen Reader", desc: "Alt checks, skip-links helper", icon: FileText },
                    { id: "colorblind", label: "Color Blind Safe", desc: "High contrast variable tags", icon: Palette },
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

              <div className="h-px bg-white/10" />

              {/* SECTION B: Readable Experience */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">B. Readable Experience</h3>

                {/* Content Scaling Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Content Scale</span>
                    <span className="text-[var(--brand-pink)] font-bold">{settings.contentScaling}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="200"
                    step="10"
                    value={settings.contentScaling}
                    onChange={(e) => dispatch({ type: "SET_SCALING", value: Number(e.target.value) })}
                    className="w-full accent-[var(--brand-pink)] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Font Sizing Stepper */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-white/65 block">Font Size Stepper</span>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                    {[0, 1, 2, 3].map((stepVal) => (
                      <button
                        key={stepVal}
                        onClick={() => dispatch({ type: "SET_FONT_SIZE", value: stepVal as any })}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-xs font-semibold transition-all press",
                          settings.fontSizing === stepVal ? "bg-[var(--brand-pink)] text-white" : "text-white/60 hover:text-white"
                        )}
                      >
                        {stepVal === 0 ? "Default" : `+${stepVal}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Height Stepper */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-white/65 block">Line Height Stepper</span>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                    {[0, 1, 2, 3].map((stepVal) => (
                      <button
                        key={stepVal}
                        onClick={() => dispatch({ type: "SET_LINE_HEIGHT", value: stepVal as any })}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-xs font-semibold transition-all press",
                          settings.lineHeight === stepVal ? "bg-[var(--brand-pink)] text-white" : "text-white/60 hover:text-white"
                        )}
                      >
                        {stepVal === 0 ? "Default" : `+${stepVal}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Letter Spacing Stepper */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-white/65 block">Letter Spacing Stepper</span>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                    {[0, 1, 2, 3].map((stepVal) => (
                      <button
                        key={stepVal}
                        onClick={() => dispatch({ type: "SET_LETTER_SPACING", value: stepVal as any })}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-xs font-semibold transition-all press",
                          settings.letterSpacing === stepVal ? "bg-[var(--brand-pink)] text-white" : "text-white/60 hover:text-white"
                        )}
                      >
                        {stepVal === 0 ? "Default" : `+${stepVal}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Alignment */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-white/65 block">Text Alignment</span>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                    {[
                      { id: "default", label: "Default", icon: AlignLeft },
                      { id: "left", label: "Left", icon: AlignLeft },
                      { id: "center", label: "Center", icon: AlignCenter },
                      { id: "right", label: "Right", icon: AlignRight },
                    ].map((align) => {
                      const Icon = align.icon;
                      return (
                        <button
                          key={align.id}
                          onClick={() => dispatch({ type: "SET_ALIGNMENT", value: align.id as any })}
                          className={cn(
                            "flex-1 h-8 rounded-lg text-xs font-semibold transition-all press flex items-center justify-center gap-1",
                            settings.textAlignment === align.id ? "bg-[var(--brand-pink)] text-white" : "text-white/60 hover:text-white"
                          )}
                        >
                          <Icon size={12} />
                          <span>{align.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Granular readable switches */}
                <div className="space-y-2.5">
                  {[
                    { id: "textMagnifier", label: "Hover Text Magnifier Tooltip", desc: "Shows floating magnifier popup for text hovered." },
                    { id: "readableFont", label: "Readable Sans-Serif Font", desc: "Swaps body fonts to a highly-legible layout." },
                    { id: "dyslexiaFont", label: "Dyslexia Friendly Font spacing", desc: "Swaps text to OpenDyslexic structural spacing." },
                    { id: "highlightTitles", label: "Highlight All Headers & Titles", desc: "Adds thick pink background borders to headings." },
                    { id: "highlightLinks", label: "Highlight Links (Underline & Bold)", desc: "Underlines and applies colorblind safe blue outlines." },
                  ].map((item) => {
                    const isChecked = settings[item.id as keyof AccessibilitySettings] === true;
                    return (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="space-y-0.5">
                          <span className="text-[12px] font-bold block">{item.label}</span>
                          <span className="text-[10px] text-white/45 block leading-normal">{item.desc}</span>
                        </div>
                        <button
                          role="switch"
                          aria-checked={isChecked}
                          onClick={() => toggleSetting(item.id as any)}
                          className={cn(
                            "w-11 h-6 rounded-full relative transition-all flex-shrink-0 press",
                            isChecked ? "bg-[var(--brand-pink)]" : "bg-white/10"
                          )}
                        >
                          <span className={cn("w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm", isChecked ? "right-0.5" : "left-0.5")} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-white/10" />

              {/* SECTION C: Visually Pleasing Experience */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">C. Visually Pleasing Experience</h3>

                {/* Contrast Themes */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-white/65 block">Contrast Themes</span>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                    {[
                      { id: "default", label: "Default", icon: Sun },
                      { id: "dark-contrast", label: "Dark Contrast", icon: Moon },
                      { id: "light-contrast", label: "Light Contrast", icon: Sun },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => dispatch({ type: "SET_CONTRAST_THEME", value: theme.id as any })}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-xs font-semibold transition-all press flex items-center justify-center gap-1",
                          settings.contrastTheme === theme.id ? "bg-[var(--brand-pink)] text-white" : "text-white/60 hover:text-white"
                        )}
                      >
                        <theme.icon size={12} />
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Saturation Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Color Saturation</span>
                    <span className="text-[var(--brand-pink)] font-bold">{settings.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={settings.saturation}
                    onChange={(e) => dispatch({ type: "SET_SATURATION", value: Number(e.target.value) })}
                    className="w-full accent-[var(--brand-pink)] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Safe Color Presets Combos */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-white/65 block">Contrast Color Preset Combos</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {COLOR_PRESETS.map((preset, idx) => {
                      const isSelected = settings.colorPreset === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => dispatch({ type: "SET_COLOR_PRESET", value: idx })}
                          className={cn(
                            "p-2 rounded-xl text-[10px] font-semibold text-left border flex items-center justify-between press",
                            isSelected ? "border-[var(--brand-pink)]" : "border-white/5 bg-white/5"
                          )}
                          style={{ backgroundColor: preset.bg === "transparent" ? "#1e1e2d" : preset.bg, color: preset.text === "inherit" ? "#ffffff" : preset.text }}
                        >
                          <span>{preset.name}</span>
                          {isSelected && <Check size={10} className="text-[var(--brand-pink)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Individual switches */}
                <div className="space-y-2.5">
                  {[
                    { id: "monochrome", label: "Monochrome (Grayscale Filter)", desc: "Reduces visual cognitive loading by removing color." },
                    { id: "highContrastAAA", label: "WCAG AAA High Contrast", desc: "Forces absolute high-contrast black/white layouts." },
                  ].map((item) => {
                    const isChecked = settings[item.id as keyof AccessibilitySettings] === true;
                    return (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="space-y-0.5">
                          <span className="text-[12px] font-bold block">{item.label}</span>
                          <span className="text-[10px] text-white/45 block leading-normal">{item.desc}</span>
                        </div>
                        <button
                          role="switch"
                          aria-checked={isChecked}
                          onClick={() => toggleSetting(item.id as any)}
                          className={cn(
                            "w-11 h-6 rounded-full relative transition-all flex-shrink-0 press",
                            isChecked ? "bg-[var(--brand-pink)]" : "bg-white/10"
                          )}
                        >
                          <span className={cn("w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm", isChecked ? "right-0.5" : "left-0.5")} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-white/10" />

              {/* SECTION D: Easy Orientation */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">D. Easy Orientation</h3>

                {/* Large Cursors options */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Large Cursor</span>
                    <span className="text-[var(--brand-pink)] font-bold uppercase tracking-wide">{settings.bigCursor}</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { id: "none", label: "Normal" },
                      { id: "dark", label: "Big Dark" },
                      { id: "light", label: "Big Light" },
                    ].map((cursor) => (
                      <button
                        key={cursor.id}
                        onClick={() => dispatch({ type: "SET_CURSOR", value: cursor.id as any })}
                        className={cn(
                          "flex-1 h-9 rounded-xl text-xs font-semibold transition-all border press",
                          settings.bigCursor === cursor.id
                            ? "bg-[var(--brand-pink)] border-[var(--brand-pink)] text-white"
                            : "bg-white/5 border-white/5 text-white/80 hover:bg-white/10"
                        )}
                      >
                        {cursor.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual switches */}
                <div className="space-y-2.5">
                  {[
                    { id: "muteSounds", label: "Mute All Autoplay Sounds & Video", desc: "Automatically stops and mutes video or audio feeds." },
                    { id: "hideImages", label: "Hide Images (Replace with Alt text)", desc: "Hides graphics and renders placeholder description boxes." },
                    { id: "virtualKeyboard", label: "On-Screen Virtual Keyboard", desc: "Injects layout keyboard when input fields are selected." },
                    { id: "readingGuide", label: "Horizontal Reading Guide Line", desc: "Renders horizontal follow line next to the cursor." },
                    { id: "readingMask", label: "Focus Reading Mask Overlay", desc: "Dims page except for focused horizontal slit." },
                    { id: "stopAnimations", label: "Stop Animations & Motion", desc: "Stops carousels, transitions, and slider animations." },
                    { id: "highlightHover", label: "Highlight Hovered Interactive Elements", desc: "Draws active borders around hovered items." },
                    { id: "highlightFocus", label: "Highlight Focused Keyboard Elements", desc: "Highlights tab-focused inputs and links." },
                    { id: "colorblindPalette", label: "Color Blind Safe Scheme", desc: "Modifies status colors globally to safe equivalents." },
                    { id: "screenReaderOptimize", label: "Screen-Reader Skip Navigation Link", desc: "Adds page-skip markers and optimized ARIA roles." },
                    { id: "hideTriggerButton", label: "Hide Floating Suite Button", desc: "Removes floating circular button (restored via edge tab)." },
                  ].map((item) => {
                    const isChecked = settings[item.id as keyof AccessibilitySettings] === true;
                    return (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="space-y-0.5">
                          <span className="text-[12px] font-bold block">{item.label}</span>
                          <span className="text-[10px] text-white/45 block leading-normal">{item.desc}</span>
                        </div>
                        <button
                          role="switch"
                          aria-checked={isChecked}
                          onClick={() => toggleSetting(item.id as any)}
                          className={cn(
                            "w-11 h-6 rounded-full relative transition-all flex-shrink-0 press",
                            isChecked ? "bg-[var(--brand-pink)]" : "bg-white/10"
                          )}
                        >
                          <span className={cn("w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm", isChecked ? "right-0.5" : "left-0.5")} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-4 mt-6 text-center">
              <div className="text-[9px] text-white/30 uppercase tracking-widest font-black leading-tight">
                Self-Hosted Native A11y Suite v3.0
              </div>
              <div className="text-[8px] text-white/20 mt-1">
                Alt+1 to Open/Close panel | Escape to exit panel
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
