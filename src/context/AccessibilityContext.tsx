// src/context/AccessibilityContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from "react";

export const COLOR_PRESETS = [
  { name: "Default Theme", bg: "transparent", text: "inherit" },
  { name: "Cream & Charcoal", bg: "#fdf6e3", text: "#586e75" },
  { name: "Black & High-Contrast Yellow", bg: "#000000", text: "#ffff00" },
  { name: "Black & Pure White", bg: "#000000", text: "#ffffff" },
  { name: "White & Black", bg: "#ffffff", text: "#000000" },
  { name: "Dark Night Blue", bg: "#0b0f19", text: "#cbd5e1" },
];

export interface AccessibilitySettings {
  profile: "epilepsy" | "visually-impaired" | "cognitive" | "adhd" | "blindness" | "colorblind" | null;
  // B. Readable Experience
  contentScaling: number; // 80 - 200, default 100
  textMagnifier: boolean;
  readableFont: boolean;
  dyslexiaFont: boolean;
  highlightTitles: boolean;
  highlightLinks: boolean;
  fontSizing: 0 | 1 | 2 | 3;
  lineHeight: 0 | 1 | 2 | 3;
  letterSpacing: 0 | 1 | 2 | 3;
  textAlignment: "default" | "left" | "center" | "right";
  
  // C. Visually Pleasing Experience
  contrastTheme: "default" | "dark-contrast" | "light-contrast";
  monochrome: boolean;
  highContrastAAA: boolean;
  saturation: number; // 0 - 200, default 100
  colorPreset: number; // 0 (default), 1, 2, 3, 4, 5
  
  // D. Easy Orientation
  muteSounds: boolean;
  hideImages: boolean;
  virtualKeyboard: boolean;
  readingGuide: boolean;
  stopAnimations: boolean;
  readingMask: boolean;
  highlightHover: boolean;
  highlightFocus: boolean;
  bigCursor: "none" | "dark" | "light";
  screenReaderOptimize: boolean;
  colorblindPalette: boolean;
  hideTriggerButton: boolean; // New requirement: hide toggle button option
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  profile: null,
  contentScaling: 100,
  textMagnifier: false,
  readableFont: false,
  dyslexiaFont: false,
  highlightTitles: false,
  highlightLinks: false,
  fontSizing: 0,
  lineHeight: 0,
  letterSpacing: 0,
  textAlignment: "default",
  contrastTheme: "default",
  monochrome: false,
  highContrastAAA: false,
  saturation: 100,
  colorPreset: 0,
  muteSounds: false,
  hideImages: false,
  virtualKeyboard: false,
  readingGuide: false,
  stopAnimations: false,
  readingMask: false,
  highlightHover: false,
  highlightFocus: false,
  bigCursor: "none",
  screenReaderOptimize: false,
  colorblindPalette: false,
  hideTriggerButton: false,
};

type AccessibilityAction =
  | { type: "TOGGLE_SETTING"; key: keyof AccessibilitySettings }
  | { type: "SET_FONT_SIZE"; value: AccessibilitySettings["fontSizing"] }
  | { type: "SET_LINE_HEIGHT"; value: AccessibilitySettings["lineHeight"] }
  | { type: "SET_LETTER_SPACING"; value: AccessibilitySettings["letterSpacing"] }
  | { type: "SET_ALIGNMENT"; value: AccessibilitySettings["textAlignment"] }
  | { type: "SET_SCALING"; value: number }
  | { type: "SET_SATURATION"; value: number }
  | { type: "SET_CONTRAST_THEME"; value: AccessibilitySettings["contrastTheme"] }
  | { type: "SET_COLOR_PRESET"; value: number }
  | { type: "SET_CURSOR"; value: AccessibilitySettings["bigCursor"] }
  | { type: "APPLY_PROFILE"; profile: AccessibilitySettings["profile"] }
  | { type: "RESET_ALL" };

const STORAGE_KEY = "she-enable-a11y-context-settings";

function accessibilityReducer(state: AccessibilitySettings, action: AccessibilityAction): AccessibilitySettings {
  switch (action.type) {
    case "TOGGLE_SETTING":
      return {
        ...state,
        profile: null, // Clear profile preset on manual modification
        [action.key]: !state[action.key as keyof AccessibilitySettings],
      } as any;
    case "SET_FONT_SIZE":
      return { ...state, profile: null, fontSizing: action.value };
    case "SET_LINE_HEIGHT":
      return { ...state, profile: null, lineHeight: action.value };
    case "SET_LETTER_SPACING":
      return { ...state, profile: null, letterSpacing: action.value };
    case "SET_ALIGNMENT":
      return { ...state, profile: null, textAlignment: action.value };
    case "SET_SCALING":
      return { ...state, profile: null, contentScaling: action.value };
    case "SET_SATURATION":
      return { ...state, profile: null, saturation: action.value };
    case "SET_CONTRAST_THEME":
      return { ...state, profile: null, contrastTheme: action.value };
    case "SET_COLOR_PRESET":
      return { ...state, profile: null, colorPreset: action.value };
    case "SET_CURSOR":
      return { ...state, profile: null, bigCursor: action.value };
    case "APPLY_PROFILE": {
      if (state.profile === action.profile) {
        return DEFAULT_SETTINGS;
      }
      const newSettings = { ...DEFAULT_SETTINGS, profile: action.profile };
      switch (action.profile) {
        case "epilepsy":
          newSettings.stopAnimations = true;
          newSettings.saturation = 60;
          break;
        case "visually-impaired":
          newSettings.contentScaling = 130;
          newSettings.contrastTheme = "light-contrast";
          newSettings.highlightLinks = true;
          newSettings.fontSizing = 2;
          break;
        case "cognitive":
          newSettings.dyslexiaFont = true;
          newSettings.readingGuide = true;
          newSettings.highlightTitles = true;
          break;
        case "adhd":
          newSettings.stopAnimations = true;
          newSettings.readingGuide = true;
          newSettings.muteSounds = true;
          newSettings.hideImages = true;
          break;
        case "blindness":
          newSettings.screenReaderOptimize = true;
          newSettings.stopAnimations = true;
          break;
        case "colorblind":
          newSettings.colorblindPalette = true;
          break;
      }
      return newSettings;
    }
    case "RESET_ALL":
      return DEFAULT_SETTINGS;
    default:
      return state;
  }
}

const AccessibilityContext = createContext<{
  settings: AccessibilitySettings;
  dispatch: React.Dispatch<AccessibilityAction>;
} | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, dispatch] = useReducer(accessibilityReducer, DEFAULT_SETTINGS, (initial) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...initial, ...JSON.parse(saved) };
      } catch (e) {
        return initial;
      }
    }
    return initial;
  });

  // Apply settings to document element on changes
  useEffect(() => {
    const root = document.documentElement;

    // Apply scale multiplier variable (used for responsive rem scaling in index.css)
    root.style.setProperty("--a11y-scale", String(settings.contentScaling / 100));
    root.style.setProperty("--a11y-saturation", String(settings.saturation / 100));

    // Handle HTML data attributes
    root.setAttribute("data-a11y-stop-animations", String(settings.stopAnimations));
    root.setAttribute("data-a11y-readable-font", String(settings.readableFont));
    root.setAttribute("data-a11y-dyslexia", String(settings.dyslexiaFont));
    root.setAttribute("data-a11y-highlight-titles", String(settings.highlightTitles));
    root.setAttribute("data-a11y-highlight-links", String(settings.highlightLinks));
    root.setAttribute("data-a11y-font-sizing", String(settings.fontSizing));
    root.setAttribute("data-a11y-line-height", String(settings.lineHeight));
    root.setAttribute("data-a11y-letter-spacing", String(settings.letterSpacing));
    root.setAttribute("data-a11y-align", settings.textAlignment);
    root.setAttribute("data-a11y-contrast-theme", settings.contrastTheme);
    root.setAttribute("data-a11y-monochrome", String(settings.monochrome));
    root.setAttribute("data-a11y-high-contrast-aaa", String(settings.highContrastAAA));
    root.setAttribute("data-a11y-has-saturation", String(settings.saturation !== 100));
    root.setAttribute("data-a11y-color-preset", String(settings.colorPreset));
    root.setAttribute("data-a11y-hide-images", String(settings.hideImages));
    root.setAttribute("data-a11y-highlight-hover", String(settings.highlightHover));
    root.setAttribute("data-a11y-highlight-focus", String(settings.highlightFocus));
    root.setAttribute("data-a11y-cursor", settings.bigCursor);
    root.setAttribute("data-a11y-screen-reader", String(settings.screenReaderOptimize));
    root.setAttribute("data-a11y-colorblind", String(settings.colorblindPalette));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <AccessibilityContext.Provider value={{ settings, dispatch }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};
