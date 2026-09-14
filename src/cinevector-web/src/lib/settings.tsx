import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface AppSettings {
  /** Interruttore generale: se falso disattiva ogni transizione/animazione CSS nell'app. */
  animationsEnabled: boolean;
  /** Effetto di sollevamento/glow al passaggio del mouse sulle card film. */
  cardHoverEffects: boolean;
  /** Dissolvenza tra le pagine quando si naviga nel menu. */
  pageTransitions: boolean;
  /** Mostra il carosello a scorrimento automatico ovunque ci sia una lista di film (Movies, Dashboard, Dettaglio). */
  carouselEnabled: boolean;
  /** Millisecondi tra un avanzamento e l'altro del carosello. */
  carouselIntervalMs: number;
  /** "step": la card scatta e si ferma fino al prossimo avanzamento. "continuous": scorrimento fluido e ininterrotto. */
  carouselMotion: "step" | "continuous";
  /** Opacità delle sfere nella Mappa Semantica 3D — "leggera" le rende più trasparenti/meno dense. */
  sphereDensity: "leggera" | "media" | "piena";
  /** Intensità del bagliore al passaggio del mouse sulle sfere — "sottile" è più discreto, meno invadente. */
  haloIntensity: "sottile" | "normale" | "intenso";
}

export const DEFAULT_SETTINGS: AppSettings = {
  animationsEnabled: true,
  cardHoverEffects: true,
  pageTransitions: true,
  carouselEnabled: true,
  carouselIntervalMs: 3500,
  carouselMotion: "step",
  sphereDensity: "leggera",
  haloIntensity: "sottile",
};

const STORAGE_KEY = "cinevector.settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage non disponibile (es. modalità privata): le preferenze restano solo in memoria.
    }

    document.documentElement.dataset.animations = settings.animationsEnabled ? "on" : "off";
    document.documentElement.classList.toggle("no-hover-fx", !settings.cardHoverEffects);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(() => ({ settings, updateSettings, resetSettings }), [settings, updateSettings, resetSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings deve essere usato dentro <SettingsProvider>.");
  }
  return ctx;
}
