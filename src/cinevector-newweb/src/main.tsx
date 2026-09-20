import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { pushNotification } from "./lib/notificationStore";

// Un solo punto per notificare QUALUNQUE errore di query in tutta l'app (ricerca, Spotify, crawler, ecc.) —
// pushNotification ha già il suo de-dup, così un poll che fallisce ripetutamente non spamma notifiche identiche.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      pushNotification("error", error instanceof Error ? error.message : "Si è verificato un errore imprevisto.");
    },
  }),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
