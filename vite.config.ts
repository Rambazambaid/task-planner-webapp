import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = process.env.BACKEND_URL ?? env.BACKEND_URL ?? 'http://localhost:8080';

  return {
    plugins: [react()],
    server: { port: 5173, proxy: { '/graphql': { target, changeOrigin: true } } },
    preview: { port: 4173, proxy: { '/graphql': { target, changeOrigin: true } } },
  };
});
