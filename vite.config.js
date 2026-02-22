import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': {}
    },
    server: {
        port: 3000,
        open: true,
        host: true
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                result: resolve(__dirname, 'result.html'),
            },
            output: {
                manualChunks: {
                    'vendor': ['react', 'react-dom', 'framer-motion'],
                    'ui': [
                        './src/components/design-system',
                        './src/pages',
                    ],
                    'services': [
                        './src/services/aiService',
                        './src/services/orchestratorEngine',
                        './src/services/databaseService',
                    ],
                    'data': [
                        './src/data/agents',
                        './src/data/agent-routing',
                        './src/data/intelligence',
                    ],
                }
            }
        },
        chunkSizeWarningLimit: 600,
    },
})
