
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  return {
    // Base is set to '/' by default, which is perfect for Vercel.
    // We removed 'base: ./' which was specific for GitHub Pages.
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      emptyOutDir: true,
    },
    define: {
      // Prioritize process.env.API_KEY (from Vercel Environment Variables)
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
    },
  };
});
