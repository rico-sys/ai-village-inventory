import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'neu-bg': '#e0e5ec',
        'neu-text': '#2c3e50',
        'neu-text-muted': '#5a6c7d',
        'neu-accent': '#6c7ee1',
        'neu-accent-hover': '#5568d3',
        'neu-success': '#4caf50',
        'neu-warning': '#ff9800',
        'neu-danger': '#f44336',
        'neu-shadow-light': '#ffffff',
        'neu-shadow-dark': '#a3b1c6',
      },
      boxShadow: {
        'neu-convex': '9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light)',
        'neu-concave': 'inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light)',
        'neu-pressed': 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
      },
    },
  },
  plugins: [],
};

export default config;
