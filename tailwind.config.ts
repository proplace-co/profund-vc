import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

/**
 * Tailwind n'est PAS ici pour ses utilitaires : les pages du site sont écrites
 * en CSS maison (`.pf-wrap`, `.hero-title`, `.fund-table`…, cf. src/index.css).
 * Il est ici pour son PREFLIGHT, sur lequel ce CSS a été écrit :
 * `table{border-collapse:collapse}`, `h1-h6{font-size:inherit}`,
 * `ul{list-style:none;margin:0;padding:0}`, `img{display:block;max-width:100%}`.
 * Retirer Tailwind change le rendu des tableaux de simulation et des titres.
 *
 * Le bloc `colors` n'est pas décoratif non plus : `src/index.css` contient
 * `@layer base { * { @apply border-border } }`. Supprimer `colors.border` ici
 * (ou `--border` dans le :root du CSS) casse le build avec
 * « The `border-border` class does not exist ». Les deux moitiés vont ensemble.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
