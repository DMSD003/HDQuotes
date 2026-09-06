import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
      "name": "HDQuotes",
      "short_name": "HDQuotes",
      "description": "Creation et gestion des devis",
      "start_url": "/",
      "display": "standalone",
      "theme_color": "#D9F0ED",
      "background_color": "#ffffff",
      "icons": [
          {
              "src": "/HdquoteIcon.png",
              "sizes": "192x192",
              "type": "image/png"
          }
      ]
      }
    })
  ],
})
