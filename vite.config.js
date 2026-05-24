import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Caminhos relativos (./) funcionam em GitHub Pages em qualquer nome de repo
var base = process.env.VITE_BASE_PATH || './'
if (base !== './' && base !== '/' && !base.endsWith('/')) base += '/'

export default defineConfig({
  base: base,
  plugins: [react()],
  define: {
    __APP_SYNC_REV__: JSON.stringify('sync-v11'),
  },
})
