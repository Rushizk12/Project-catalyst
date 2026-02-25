import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    loadEnv(mode, '.', '');
    return {
      server: {
        proxy: {
          '/api': {
            // Use IPv4 loopback to avoid localhost resolution issues on some Windows setups
            target: 'http://127.0.0.1:3001',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
