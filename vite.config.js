import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (no prefix filter — loads ANTHROPIC_API_KEY etc.)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Inject env vars as process.env.X so existing code works without changes
    define: {
      'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.ANTHROPIC_API_KEY || ''),
      'process.env.CLAUDE_MODEL': JSON.stringify(env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001'),
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL || ''),
    },

    server: {
      port: 3000,
      open: true,
      host: true,
    },

    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'framer-motion'],
            services: [
              './src/services/aiService',
              './src/services/orchestratorEngine',
              './src/services/databaseService',
            ],
            data: [
              './src/data/agents',
              './src/data/agent-routing',
              './src/data/intelligence',
            ],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  }
})
