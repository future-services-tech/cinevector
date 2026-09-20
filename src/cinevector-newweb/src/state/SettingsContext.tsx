import { useMutation, useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSettings, updateSettings as putSettings } from "../api/settings";

export interface AppSettings {
  /** "sistema" segue la preferenza del sistema operativo (prefers-color-scheme) e si aggiorna in tempo reale. */
  theme: "chiaro" | "scuro" | "sistema";
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
  /** Dimensione (zoom) della vista "Sfera Film": più film ci sono, più serve una sfera grande per restare leggibile. */
  posterSphereZoom: "compatta" | "normale" | "grande";
  /** Quanti film caricare per pagina nella vista "Sfera Film" — il catalogo cresce nel tempo, va sfogliato a pagine. */
  posterSpherePageSize: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "scuro",
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
  posterSphereZoom: "normale",
  posterSpherePageSize: 30,
};

// Le preferenze vivono nel database (tabella app_settings, riga singola — nessun utente/autenticazione ancora
// esistente) tramite GET/PUT /api/settings. La cache locale serve solo per un primo render immediato (niente
// flash sui valori di default mentre arriva la risposta dal server) e come fallback se l'API non risponde —
// non è più la fonte di verità. notificationStore.ts legge ancora direttamente questa chiave (deve funzionare
// anche fuori dall'albero React), quindi resta sincronizzata ad ogni GET/PUT riuscita.
const STORAGE_KEY = "cinevector-newweb:settings";

function loadCachedSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function cacheSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage non disponibile (es. modalità privata): niente cache locale, resta solo il database.
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadCachedSettings());

  const query = useQuery({ queryKey: ["app-settings"], queryFn: getSettings, staleTime: 60_000 });

  useEffect(() => {
    if (!query.data) return;
    setSettings(query.data as AppSettings);
    cacheSettings(query.data as AppSettings);
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: putSettings,
    onSuccess: (saved) => {
      setSettings(saved as AppSettings);
      cacheSettings(saved as AppSettings);
    },
  });

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        cacheSettings(next);
        mutation.mutate(next);
        return next;
      });
    },
    [mutation],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    cacheSettings(DEFAULT_SETTINGS);
    mutation.mutate(DEFAULT_SETTINGS);
  }, [mutation]);

  const value = useMemo(() => ({ settings, updateSettings, resetSettings }), [settings, updateSettings, resetSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings deve essere usato dentro <SettingsProvider>");
  return ctx;
}
