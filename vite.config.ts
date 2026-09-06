import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Pre-bundle these up front. Discovering a dependency mid-session forces Vite
  // to re-optimize and hard-reload, and a browser still holding the previous
  // module graph reports it as a bogus "does not provide an export named X".
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'date-fns',
      'lucide-react',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/database',
      '@supabase/supabase-js',
      'three',
    ],
  },
})
