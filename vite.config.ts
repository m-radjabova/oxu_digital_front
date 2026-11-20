import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createLogger, defineConfig } from 'vite'

const viteLogger = createLogger()
const customLogger = {
  ...viteLogger,
  error(message: string, options?: Parameters<typeof viteLogger.error>[1]) {
    if (
      message.includes('http proxy error:')
      || message.includes('ws proxy error:')
      || message.includes('ws proxy socket error:')
    ) return
    viteLogger.error(message, options)
  },
}

// https://vite.dev/config/
export default defineConfig({
  customLogger,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:5050',
      '/academic-structure': 'http://127.0.0.1:5050',
      '/attendance': 'http://127.0.0.1:5050',
      '/users': 'http://127.0.0.1:5050',
      '/groups': 'http://127.0.0.1:5050',
      '/subjects': 'http://127.0.0.1:5050',
      '/lessons': 'http://127.0.0.1:5050',
      '/buildings': 'http://127.0.0.1:5050',
      '/rooms': 'http://127.0.0.1:5050',
      '/teacher-availability': 'http://127.0.0.1:5050',
      '/telegram': 'http://127.0.0.1:5050',
      '/health': 'http://127.0.0.1:5050',
      '/socket.io': {
        target: 'http://127.0.0.1:5050',
        ws: true,
      },
    },
  },
})
