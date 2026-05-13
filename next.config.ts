import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'

const nextConfig: NextConfig = {
  /** Pin workspace root so Turbopack does not pick a parent `package-lock.json` (e.g. `~/`). */
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
}

export default nextConfig
