import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-space-900 text-slate-300">
      <h1 className="text-xl font-bold text-white">Pagina non trovata</h1>
      <Link to="/" className="text-cyan-300 hover:underline">
        Torna a CineVector
      </Link>
    </div>
  );
}
