import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    // "localhost" può risolvere solo su IPv6 (::1) a seconda del sistema: il redirect OAuth di Spotify punta
    // letteralmente a 127.0.0.1 (obbligatorio da policy Spotify 2026, "localhost" non è più accettato come
    // redirect URI), quindi il dev server deve ascoltare esplicitamente anche su quell'interfaccia IPv4.
    host: true,
  },
})
