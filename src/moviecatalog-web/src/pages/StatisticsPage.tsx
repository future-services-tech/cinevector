import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getStatistics } from "../api/statistics";

const AXIS_COLOR = "#a9b7c6";
const GRID_COLOR = "rgba(255,255,255,0.08)";
const TOOLTIP_STYLE = {
  background: "#0d1c2d",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8,
  color: "#d4e4fa",
  fontSize: 12,
};

function DistributionChart({ data, color = "#00d2ff" }: { data: { name: string; count: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="name" stroke={AXIS_COLOR} fontSize={11} tickLine={false} />
        <YAxis stroke={AXIS_COLOR} fontSize={11} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatisticsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["statistics"],
    queryFn: getStatistics,
  });

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>Statistics</h2>
          <p>Distribuzione del catalogo per genere, anno, rating e fonte.</p>
        </div>
      </div>

      {isLoading && <div className="panel empty-state">Caricamento statistiche...</div>}
      {isError && <div className="panel empty-state">Errore: {(error as Error).message}</div>}

      {data && (
        <>
          <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
            <div className="stat-card">
              <div className="stat-card__label">Film censiti</div>
              <div className="stat-card__value">{data.totalMovies}</div>
              <div className="stat-card__delta">+{data.moviesAddedToday} oggi</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Vettori attivi</div>
              <div className="stat-card__value">{data.moviesWithEmbedding}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                {data.moviesPendingEmbedding} in coda
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Cluster semantici</div>
              <div className="stat-card__value">{data.totalClusters}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Fonti</div>
              <div className="stat-card__value">{data.totalSources}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                {data.lastCrawlAt ? `Ultimo crawl ${new Date(data.lastCrawlAt).toLocaleString("it-IT")}` : "Nessun crawl eseguito"}
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
            <div className="panel">
              <div className="panel-title">Film per genere</div>
              <DistributionChart data={data.byGenre.map((g) => ({ name: g.name, count: g.count }))} />
            </div>

            <div className="panel">
              <div className="panel-title">Film per anno</div>
              <DistributionChart data={data.byYear.map((y) => ({ name: y.name, count: y.count }))} color="#3b82f6" />
            </div>

            <div className="panel">
              <div className="panel-title">Distribuzione rating</div>
              <DistributionChart
                data={data.byRating.map((r) => ({ name: `${r.name}+`, count: r.count }))}
                color="#f59e0b"
              />
            </div>

            <div className="panel">
              <div className="panel-title">Film per fonte</div>
              <DistributionChart data={data.bySource.map((s) => ({ name: s.name, count: s.count }))} color="#10b981" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
