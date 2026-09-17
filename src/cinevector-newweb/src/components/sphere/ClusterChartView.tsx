import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFilters } from "../../state/FilterContext";
import { useMovieData } from "../../state/MovieDataContext";
import { useSelection } from "../../state/SelectionContext";

const AXIS_COLOR = "#64748b";
const TOOLTIP_STYLE = {
  background: "rgba(6,9,19,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  color: "#e2e8f0",
  fontSize: 12,
};

/** Visualizzazione 2D immediata di "quanti film per cluster" — sostituisce quello che nel mockup era un
 * bottone "Cluster" senza alcuna vista collegata. Click su una barra isola quel cluster e torna alla sfera. */
export function ClusterChartView() {
  const { clusters } = useMovieData();
  const { isolateCluster } = useFilters();
  const { setViewMode } = useSelection();

  const data = [...clusters].sort((a, b) => b.count - a.count).map((c) => ({ ...c, shortName: c.name.length > 22 ? `${c.name.slice(0, 20)}…` : c.name }));

  function handleBarClick(clusterId: number) {
    isolateCluster(clusterId);
    setViewMode("sphere");
  }

  return (
    <div className="scrollbar-thin flex h-full flex-col overflow-y-auto p-6 pt-24">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-ink">Distribuzione Film per Cluster</h2>
        <p className="text-xs text-slate-400">Quanti film appartengono a ciascun cluster semantico — clicca una barra per isolarlo sulla sfera.</p>
      </div>

      <div className="glass-card flex-1 rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%" minHeight={Math.max(320, data.length * 34)}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <XAxis type="number" stroke={AXIS_COLOR} fontSize={10} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="shortName" stroke={AXIS_COLOR} fontSize={11} tickLine={false} width={160} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(value) => [`${value} film`, "Conteggio"]} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(entry) => handleBarClick((entry as unknown as { id: number }).id)}>
              {data.map((c) => (
                <Cell key={c.id} fill={c.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
