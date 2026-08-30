import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dir, './src'),
    },
  },
  // Domaine racine (profund.vc), pas de sous-chemin.
  // Tant que le DNS n'est pas basculé, le site servi sur
  // proplace-co.github.io/profund-vc/ affichera des 404 sur les assets :
  // c'est attendu, ne pas "corriger" cette valeur.
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
