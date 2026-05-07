import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (mode !== 'production') {
    console.log('Build mode:', mode);
    console.log('VITE_SUPABASE_URL configured?:', Boolean(env.VITE_SUPABASE_URL));
    console.log('VITE_SUPABASE_ANON_KEY configured?:', Boolean(env.VITE_SUPABASE_ANON_KEY));
  }

  return {
    plugins: [react()],
    base: '/',
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
