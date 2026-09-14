/**
 * Generic "quick view" modal companion for SphereImageGrid: opens on click with just the item's id,
 * fetches full details lazily (don't try to cram everything into the sphere's lightweight ImageData),
 * and offers a link to the full detail page. Adjust the rendered fields and the `fetchDetails` call to
 * the host app's data shape — this file only shows the modal shell, dismiss behavior, and load states.
 */
import { useEffect, useState } from "react";

export interface QuickViewProps<T> {
  itemId: string;
  onClose: () => void;
  fetchDetails: (id: string) => Promise<T>;
  renderContent: (details: T) => React.ReactNode;
}

export function QuickView<T>({ itemId, onClose, fetchDetails, renderContent }: QuickViewProps<T>) {
  const [state, setState] = useState<{ status: "loading" | "error" | "ready"; data?: T }>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetchDetails(itemId)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, fetchDetails]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          background: "var(--color-surface-container-low, #1a1a1a)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 560,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        {state.status === "loading" && <p>Loading...</p>}
        {state.status === "error" && <p>Couldn't load this item.</p>}
        {state.status === "ready" && state.data && renderContent(state.data)}
      </div>
    </div>
  );
}
