import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getNotifications, subscribeNotifications, type AppNotification } from "../../lib/notificationStore";

const ICON: Record<AppNotification["type"], typeof Info> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const COLOR: Record<AppNotification["type"], string> = {
  success: "text-emerald-300",
  error: "text-rose-300",
  info: "text-cyan-300",
};

function relativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (diffSec < 10) return "adesso";
  if (diffSec < 60) return `${diffSec}s fa`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m fa`;
  const diffHour = Math.round(diffMin / 60);
  return `${diffHour}h fa`;
}

export function NotificationsDropdown() {
  const notifications = useSyncExternalStore(subscribeNotifications, getNotifications);

  return (
    <div className="glass-card scrollbar-thin absolute right-0 top-full z-30 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl">
      <div className="border-b border-white/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Notifiche</div>
      {notifications.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-slate-500">Nessuna notifica.</p>
      ) : (
        <div className="divide-y divide-white/5">
          {notifications.map((n) => {
            const Icon = ICON[n.type];
            return (
              <div key={n.id} className={`flex items-start gap-2.5 px-4 py-3 ${n.read ? "" : "bg-cyan-500/5"}`}>
                <Icon size={14} className={`mt-0.5 shrink-0 ${COLOR[n.type]}`} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-200">{n.message}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{relativeTime(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
