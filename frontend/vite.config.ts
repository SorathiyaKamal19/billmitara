import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) return 'react';
          if (/[\\/]node_modules[\\/]recharts[\\/]/.test(id)) return 'charts';
          if (/[\\/]node_modules[\\/](lucide-react|react-hot-toast|clsx)[\\/]/.test(id)) return 'ui';
          return undefined;
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
