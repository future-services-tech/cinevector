import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getStatistics } from "../api/statistics";
import { pushNotification } from "../lib/notificationStore";
import { useSettings } from "../state/SettingsContext";

/** Nessun output visivo: poll leggero di /api/statistics ogni 60s per notificare quando arrivano nuovi film
 * (es. dopo un crawl completato altrove nell'app, senza dover tenere aperta la pagina Crawler). */
export function NotificationWatcher() {
  const { settings } = useSettings();
  const { data } = useQuery({
    queryKey: ["notification-watcher", "statistics"],
    queryFn: getStatistics,
    refetchInterval: 60_000,
  });
  const previousTotal = useRef<number | null>(null);

  useEffect(() => {
    if (!data || !settings.notificationsEnabled) return;
    if (previousTotal.current !== null && data.totalMovies > previousTotal.current) {
      const added = data.totalMovies - previousTotal.current;
      pushNotification("info", `${added} nuov${added === 1 ? "o film aggiunto" : "i film aggiunti"} al catalogo.`);
    }
    previousTotal.current = data.totalMovies;
  }, [data, settings.notificationsEnabled]);

  return null;
}
