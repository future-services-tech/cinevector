import { useEffect } from "react";
import { useSettings } from "../state/SettingsContext";

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

/** Nessun output visivo: applica settings.theme al documento come data-theme="light"|"dark". In modalità
 * "sistema" risolve la preferenza del sistema operativo e resta in ascolto di matchMedia per aggiornarsi in
 * tempo reale se l'utente cambia tema di sistema mentre l'app è aperta (senza bisogno di un reload). */
export function ThemeEffect() {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;

    if (settings.theme === "chiaro") {
      root.dataset.theme = "light";
      return;
    }
    if (settings.theme === "scuro") {
      root.dataset.theme = "dark";
      return;
    }

    const media = window.matchMedia(MEDIA_QUERY);
    const apply = () => {
      root.dataset.theme = media.matches ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme]);

  return null;
}
