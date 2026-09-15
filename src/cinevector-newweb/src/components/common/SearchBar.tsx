import { Search } from "lucide-react";
import { useState } from "react";
import { searchMovies } from "../../data";
import type { MovieNode } from "../../types/movie";

export function SearchBar({ onSelect }: { onSelect: (movie: MovieNode) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = query.trim() ? searchMovies(query, 6) : [];

  function handlePick(movie: MovieNode) {
    onSelect(movie);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative flex-1">
      <div className="glass-card flex items-center gap-2 rounded-full px-4 py-2">
        <Search size={16} className="text-cyan-300" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) handlePick(results[0]);
          }}
          placeholder="Cerca film per titolo, regista o tematica semantica..."
          className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
      </div>
      {open && results.length > 0 && (
        <div className="glass-card scrollbar-thin absolute top-full left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-xl">
          {results.map((movie) => (
            <button
              key={movie.id}
              onMouseDown={() => handlePick(movie)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-white/5"
            >
              <span className="truncate text-slate-200">{movie.title}</span>
              <span className="ml-2 shrink-0 text-slate-500">{movie.year}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
