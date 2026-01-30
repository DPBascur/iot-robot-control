/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Fondos
        'app-dark': '#0B0F0E',
        'app-light': '#F5F7F6',
        
        // Sidebar/Navbar
        'sidebar-dark': '#064E3B',
        'sidebar-dark-hover': '#065F46',
        'sidebar-light': '#16A34A',
        'sidebar-light-hover': '#15803D',
        'sidebar-text': '#ECFDF5',
        
        // Cards
        'card-dark': '#111827',
        'card-light': '#FFFFFF',
        
        // Bordes
        'border-dark': '#1F2933',
        'border-light': '#E5E7EB',
        
        // Textos
        'text-primary-dark': '#F9FAFB',
        'text-secondary-dark': '#9CA3AF',
        'text-primary-light': '#0F172A',
        'text-secondary-light': '#475569',
        'text-muted-light': '#64748B',
        
        // Verde acento (igual en ambos modos)
        'accent-green': '#22C55E',
        'accent-green-soft': '#86EFAC',
        
        // Gráficos
        'chart-blue': '#2563EB',
        
        // Estados
        'danger': '#DC2626',
        
        // Botones
        'btn-primary': '#16A34A',
        'btn-primary-hover': '#15803D',
      },
    },
  },
  plugins: [],
}
