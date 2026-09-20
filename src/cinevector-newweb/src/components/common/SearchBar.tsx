import { Search } from "lucide-react";
import { useState } from "react";
import type { SearchResultItemDto } from "../../api/types";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";

export function SearchBar({ onSelect }: { onSelect: (result: SearchResultItemDto) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results } = useDebouncedSearch(query);

  function handlePick(result: SearchResultItemDto) {
    onSelect(result);
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
          {results.map((result) => (
            <button
              key={result.id}
              onMouseDown={() => handlePick(result)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-white/5"
            >
              <span className="truncate text-slate-200">{result.title}</span>
              <span className="ml-2 shrink-0 text-slate-500">{result.year ?? "—"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
