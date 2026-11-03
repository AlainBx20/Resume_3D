import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BASE = '/Resume_3D/'

// Asset URLs in the source are root-absolute ("/models/..."); on GitHub Pages
// the site lives under a sub-path, so prefix them at build time only.
const prefixAssets = {
  name: 'prefix-public-assets',
  apply: 'build' as const,
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!/[\\/]src[\\/].*\.(ts|tsx)$/.test(id)) return null
    const out = code.replace(/(["'`])\/(models|textures|env|fonts)\//g, `$1${BASE}$2/`)
    return out === code ? null : { code: out, map: null }
  },
}

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [prefixAssets, react()],
})