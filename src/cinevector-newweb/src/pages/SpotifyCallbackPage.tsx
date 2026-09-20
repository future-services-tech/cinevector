import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { exchangeSpotifyCode, spotifyLoginUrl } from "../api/spotify";

type Status = "exchanging" | "success" | "error";

/** Destinazione del redirect_uri registrato su Spotify: riceve "code"/"state" dopo il login one-time
 * dell'amministratore e li inoltra al backend, che fa lo scambio vero e proprio (client secret mai nel browser). */
export function SpotifyCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("exchanging");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const spotifyError = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (spotifyError) {
      setStatus("error");
      setMessage(`Spotify ha rifiutato l'accesso: ${spotifyError}`);
      return;
    }
    if (!code || !state) {
      setStatus("error");
      setMessage("Parametri mancanti nel redirect di Spotify.");
      return;
    }

    exchangeSpotifyCode(code, state)
      .then(() => setStatus("success"))
      .catch(() => {
        setStatus("error");
        setMessage("Scambio del codice con Spotify fallito. Riprova il collegamento.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-space-900 p-6 text-center text-slate-200">
      <div className="glass-card max-w-md rounded-xl p-6">
        {status === "exchanging" && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
            Completamento collegamento a Spotify...
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
            <p className="text-sm font-semibold text-ink">Account Spotify collegato.</p>
            <p className="text-xs text-slate-400">La ricerca musicale e la colonna sonora reale sono ora attive per tutta l'app.</p>
            <Link to="/music" className="inline-block rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-neon-cyan">
              Vai a Musica
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <XCircle size={32} className="mx-auto text-rose-400" />
            <p className="text-sm font-semibold text-ink">Collegamento non riuscito.</p>
            <p className="text-xs text-slate-400">{message}</p>
            <a href={spotifyLoginUrl()} className="inline-block rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-neon-cyan">
              Riprova
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
