import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
  server: {
    // Allow serving files from examples directory
    fs: {
      allow: ['./examples']
    }
  }
}); 