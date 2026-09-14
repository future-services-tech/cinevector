import { useSettings, DEFAULT_SETTINGS } from "../lib/settings";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="settings-row">
      <div>
        <div className="settings-row__label">{label}</div>
        <p className="settings-row__description">{description}</p>
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-switch__track" />
      </label>
    </div>
  );
}

const CAROUSEL_SPEEDS = [
  { label: "Lento", value: 6000 },
  { label: "Normale", value: 3500 },
  { label: "Veloce", value: 1800 },
];

const CAROUSEL_MOTIONS: { label: string; value: "step" | "continuous"; description: string }[] = [
  { label: "A scatti", value: "step", description: "la card avanza con uno scatto rapido e resta ferma fino al prossimo turno" },
  { label: "Continuo", value: "continuous", description: "scorrimento fluido e ininterrotto, senza soste tra una card e l'altra" },
];

const SPHERE_DENSITIES: { label: string; value: "leggera" | "media" | "piena"; description: string }[] = [
  { label: "Leggera", value: "leggera", description: "sfere più trasparenti, la mappa risulta meno affollata alla vista" },
  { label: "Media", value: "media", description: "via di mezzo tra trasparenza e pieno" },
  { label: "Piena", value: "piena", description: "sfere completamente opache" },
];

const HALO_INTENSITIES: { label: string; value: "sottile" | "normale" | "intenso"; description: string }[] = [
  { label: "Sottile", value: "sottile", description: "un bagliore discreto e contenuto attorno al pallino" },
  { label: "Normale", value: "normale", description: "bagliore ben visibile ma non invadente" },
  { label: "Intenso", value: "intenso", description: "bagliore ampio e marcato" },
];

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>Settings</h2>
          <p>Preferenze di visualizzazione salvate in questo browser.</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-title">Animazioni ed effetti</div>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Controllano le transizioni e gli effetti visivi dell'interfaccia. Disattivarle non cambia i dati mostrati,
          solo come vengono animati.
        </p>

        <div style={{ marginTop: "0.75rem" }}>
          <ToggleRow
            label="Animazioni e transizioni"
            description="Interruttore generale: se disattivato, disabilita anche tutte le opzioni sotto, indipendentemente dal loro stato."
            checked={settings.animationsEnabled}
            onChange={(v) => updateSettings({ animationsEnabled: v })}
          />
          <ToggleRow
            label="Effetti hover sulle card"
            description="Sollevamento e bagliore quando il mouse passa sopra una card film o cluster."
            checked={settings.cardHoverEffects}
            disabled={!settings.animationsEnabled}
            onChange={(v) => updateSettings({ cardHoverEffects: v })}
          />
          <ToggleRow
            label="Dissolvenza tra le pagine"
            description="Effetto di comparsa quando navighi da una pagina all'altra del menu."
            checked={settings.pageTransitions}
            disabled={!settings.animationsEnabled}
            onChange={(v) => updateSettings({ pageTransitions: v })}
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-title">Carosello film</div>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Striscia a scorrimento automatico ovunque compaia una lista di film — in cima alla Ricerca (su tutto il
          catalogo), nella Dashboard ("Aggiunte recenti") e nel Dettaglio Film ("Film simili"). Si ferma quando ci
          passi sopra il mouse, che evidenzia la card con un bordo, per permetterti di aprire un dettaglio.
        </p>

        <div style={{ marginTop: "0.75rem" }}>
          <ToggleRow
            label="Mostra il carosello"
            description="Se disattivato, ovunque comparirebbe il carosello viene mostrata una normale griglia statica."
            checked={settings.carouselEnabled}
            onChange={(v) => updateSettings({ carouselEnabled: v })}
          />

          <div className="settings-row">
            <div>
              <div className="settings-row__label">Velocità di scorrimento</div>
              <p className="settings-row__description">Tempo di permanenza su ogni film prima di avanzare al successivo.</p>
            </div>
            <select
              className="select-control"
              style={{ width: "auto" }}
              value={settings.carouselIntervalMs}
              disabled={!settings.carouselEnabled}
              onChange={(e) => updateSettings({ carouselIntervalMs: Number(e.target.value) })}
            >
              {CAROUSEL_SPEEDS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-row__label">Movimento</div>
              <p className="settings-row__description">
                {CAROUSEL_MOTIONS.find((m) => m.value === settings.carouselMotion)?.description}
              </p>
            </div>
            <select
              className="select-control"
              style={{ width: "auto" }}
              value={settings.carouselMotion}
              disabled={!settings.carouselEnabled || !settings.animationsEnabled}
              onChange={(e) => updateSettings({ carouselMotion: e.target.value as "step" | "continuous" })}
            >
              {CAROUSEL_MOTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-title">Mappa Semantica 3D</div>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Aspetto delle sfere nella Mappa Semantica 3D e nella vista dei film dentro un cluster.
        </p>

        <div style={{ marginTop: "0.75rem" }}>
          <div className="settings-row">
            <div>
              <div className="settings-row__label">Densità sfere</div>
              <p className="settings-row__description">
                {SPHERE_DENSITIES.find((d) => d.value === settings.sphereDensity)?.description}
              </p>
            </div>
            <select
              className="select-control"
              style={{ width: "auto" }}
              value={settings.sphereDensity}
              onChange={(e) => updateSettings({ sphereDensity: e.target.value as "leggera" | "media" | "piena" })}
            >
              {SPHERE_DENSITIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-row__label">Intensità alone</div>
              <p className="settings-row__description">
                {HALO_INTENSITIES.find((h) => h.value === settings.haloIntensity)?.description}
              </p>
            </div>
            <select
              className="select-control"
              style={{ width: "auto" }}
              value={settings.haloIntensity}
              onChange={(e) => updateSettings({ haloIntensity: e.target.value as "sottile" | "normale" | "intenso" })}
            >
              {HALO_INTENSITIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button className="btn btn--ghost" onClick={resetSettings}>
        Ripristina predefiniti
      </button>
      <p className="muted" style={{ fontSize: 11, marginTop: "1.5rem" }}>
        Predefiniti: animazioni {DEFAULT_SETTINGS.animationsEnabled ? "attive" : "disattive"}, carosello{" "}
        {DEFAULT_SETTINGS.carouselEnabled ? "attivo" : "disattivo"}.
      </p>
    </div>
  );
}
