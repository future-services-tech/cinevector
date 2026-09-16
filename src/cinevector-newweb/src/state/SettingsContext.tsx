import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface AppSettings {
  /** Interruttore generale: se falso disattiva ogni transizione/animazione CSS nell'app. */
  animationsEnabled: boolean;
  /** Effetto di sollevamento/glow al passaggio del mouse sulle poster card (Catalogo, Rete). */
  cardHoverEffects: boolean;
  /** Mostra lo scorrimento automatico nella vista "Catalogo" della sfera (altrimenti griglia statica). */
  carouselEnabled: boolean;
  /** Secondi per un giro completo di una riga del carosello — più basso = più veloce. */
  carouselSpeedSec: number;
  /** Opacità/dimensione dei nodi sulla sfera 3D — "leggera" li rende più piccoli/trasparenti. */
  sphereDensity: "leggera" | "media" | "piena";
  /** Intensità del bagliore su hover/selezione dei nodi sulla sfera. */
  haloIntensity: "sottile" | "normale" | "intenso";
  /** Se il pannello "Cluster Tematici" in sidebar parte aperto o chiuso. */
  clusterPanelDefaultOpen: boolean;
  /** Interruttore generale del centro notifiche (campanella). */
  notificationsEnabled: boolean;
  /** Se disattivato, il modal di dettaglio non cerca automaticamente un match reale su Spotify. */
  spotifyAutoMatchEnabled: boolean;
  /** Volume iniziale (0-100) di SoundtrackPlayer e delle anteprime nella pagina Musica. */
  defaultPlayerVolume: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  animationsEnabled: true,
  cardHoverEffects: true,
  carouselEnabled: true,
  carouselSpeedSec: 65,
  sphereDensity: "leggera",
  haloIntensity: "sottile",
  clusterPanelDefaultOpen: false,
  notificationsEnabled: true,
  spotifyAutoMatchEnabled: true,
  defaultPlayerVolume: 80,
};

const STORAGE_KEY = "cinevector-newweb:settings";

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
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(() => ({ settings, updateSettings, resetSettings }), [settings, updateSettings, resetSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings deve essere usato dentro <SettingsProvider>");
  return ctx;
}
