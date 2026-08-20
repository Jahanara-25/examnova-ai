import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      include: ['src/**/*.{js,jsx}'],
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
