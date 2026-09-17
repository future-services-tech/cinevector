import { Bell, Music, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_SETTINGS, useSettings, type AppSettings } from "../../state/SettingsContext";

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-200">{label}</div>
        <p className="text-[11px] text-slate-500">{description}</p>
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <div className="peer h-5 w-9 rounded-full bg-slate-700 transition-colors peer-checked:bg-cyan-500 peer-disabled:opacity-40 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:after:translate-x-4" />
      </label>
    </div>
  );
}

function SelectRow<T extends string>({
  label,
  description,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-200">{label}</div>
        <p className="text-[11px] text-slate-500">{description}</p>
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="glass-pill shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none disabled:opacity-40"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-space-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type TabId = "aspetto" | "catalogo" | "musica" | "notifiche";

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: "aspetto", label: "Aspetto", icon: Sparkles },
  { id: "catalogo", label: "Catalogo", icon: Sparkles },
  { id: "musica", label: "Musica", icon: Music },
  { id: "notifiche", label: "Notifiche", icon: Bell },
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [tab, setTab] = useState<TabId>("aspetto");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Portal su document.body: il bottone che apre questo modal vive dentro l'header (classe glass-card, che
  // applica backdrop-filter). Un discendente con backdrop-filter/transform/filter diventa il containing block
  // per i suoi figli position:fixed — senza portal "fixed inset-0" si ancora all'header (alto 64px) invece
  // che al viewport, e il modal appare tagliato/fuori schermo invece che centrato.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900/95 shadow-2xl shadow-cyan-950/60"
      >
        <div className="glass-card flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-sm font-bold text-white">Impostazioni</h2>
          <button onClick={onClose} aria-label="Chiudi" className="glass-pill rounded-full p-1.5 text-slate-300 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-white/5 px-3 pt-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition ${
                tab === t.id ? "bg-white/5 text-cyan-300" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
          {tab === "aspetto" && (
            <>
              <div className="glass-card rounded-xl p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-300">Animazioni ed effetti</div>
                <ToggleRow
                  label="Animazioni e transizioni"
                  description="Interruttore generale: se disattivato, disabilita anche le opzioni sotto."
                  checked={settings.animationsEnabled}
                  onChange={(v) => updateSettings({ animationsEnabled: v })}
                />
                <ToggleRow
                  label="Effetti hover sulle card"
                  description="Sollevamento e bagliore al passaggio del mouse su poster e card cluster."
                  checked={settings.cardHoverEffects}
                  disabled={!settings.animationsEnabled}
                  onChange={(v) => updateSettings({ cardHoverEffects: v })}
                />
              </div>

              <div className="glass-card rounded-xl p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-300">Sfera Semantica 3D</div>
                <SelectRow
                  label="Densità nodi"
                  description="Dimensione/opacità dei punti film sulla sfera."
                  value={settings.sphereDensity}
                  options={[
                    { value: "leggera", label: "Leggera" },
                    { value: "media", label: "Media" },
                    { value: "piena", label: "Piena" },
                  ]}
                  onChange={(v) => updateSettings({ sphereDensity: v as AppSettings["sphereDensity"] })}
                />
                <SelectRow
                  label="Intensità alone"
                  description="Bagliore sul nodo selezionato/in hover."
                  value={settings.haloIntensity}
                  options={[
                    { value: "sottile", label: "Sottile" },
                    { value: "normale", label: "Normale" },
                    { value: "intenso", label: "Intenso" },
                  ]}
                  onChange={(v) => updateSettings({ haloIntensity: v as AppSettings["haloIntensity"] })}
                />
                <ToggleRow
                  label="Pannello Cluster Tematici aperto di default"
                  description="Se attivo, il pannello dei cluster in sidebar parte già espanso."
                  checked={settings.clusterPanelDefaultOpen}
                  onChange={(v) => updateSettings({ clusterPanelDefaultOpen: v })}
                />
              </div>
            </>
          )}

          {tab === "catalogo" && (
            <div className="glass-card rounded-xl p-4">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-300">Vista "Catalogo" (sfera)</div>
              <ToggleRow
                label="Scorrimento automatico"
                description="Se disattivato, il muro di poster resta una griglia statica invece di scorrere."
                checked={settings.carouselEnabled}
                onChange={(v) => updateSettings({ carouselEnabled: v })}
              />
              <SelectRow
                label="Velocità di scorrimento"
                description="Secondi per un giro completo di una riga."
                value={String(settings.carouselSpeedSec)}
                disabled={!settings.carouselEnabled}
                options={[
                  { value: "90", label: "Lenta" },
                  { value: "65", label: "Normale" },
                  { value: "35", label: "Veloce" },
                ]}
                onChange={(v) => updateSettings({ carouselSpeedSec: Number(v) })}
              />
            </div>
          )}

          {tab === "musica" && (
            <div className="glass-card rounded-xl p-4">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-300">Musica</div>
              <ToggleRow
                label="Match automatico Spotify"
                description="Cerca in automatico la colonna sonora reale su Spotify aprendo un film. Disattivalo per evitare chiamate inutili se l'account non è collegato."
                checked={settings.spotifyAutoMatchEnabled}
                onChange={(v) => updateSettings({ spotifyAutoMatchEnabled: v })}
              />
              <SelectRow
                label="Volume iniziale"
                description="Volume di partenza per colonna sonora e anteprime."
                value={String(settings.defaultPlayerVolume)}
                options={[
                  { value: "40", label: "Basso" },
                  { value: "80", label: "Medio" },
                  { value: "100", label: "Alto" },
                ]}
                onChange={(v) => updateSettings({ defaultPlayerVolume: Number(v) })}
              />
            </div>
          )}

          {tab === "notifiche" && (
            <div className="glass-card rounded-xl p-4">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-300">Notifiche</div>
              <ToggleRow
                label="Centro notifiche"
                description="Avvisi per ricerche completate, errori e nuovi film aggiunti al catalogo."
                checked={settings.notificationsEnabled}
                onChange={(v) => updateSettings({ notificationsEnabled: v })}
              />
            </div>
          )}

          <button onClick={resetSettings} className="glass-pill w-full rounded-lg px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white">
            Ripristina predefiniti
          </button>
          <p className="text-center text-[10px] text-slate-500">
            Predefiniti: animazioni {DEFAULT_SETTINGS.animationsEnabled ? "attive" : "disattive"}, carosello {DEFAULT_SETTINGS.carouselEnabled ? "attivo" : "disattivo"}.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
