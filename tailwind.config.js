/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Design System Colors - 扩展版本
        'ds-surface-primary': 'var(--color-surface-primary)',
        'ds-surface-secondary': 'var(--color-surface-secondary)',
        'ds-border-default': 'var(--color-border-default)',
        'ds-border-interactive': 'var(--color-border-interactive)',
        'ds-text-primary': 'var(--color-text-primary)',
        'ds-text-secondary': 'var(--color-text-secondary)',
        'ds-text-disabled': 'var(--color-text-disabled)',
        'ds-accent': 'var(--color-accent-default)',
        'ds-accent-hover': 'var(--color-accent-hover)',
        'ds-accent-active': 'var(--color-accent-active)',
        'ds-success': 'var(--color-success)',
        'ds-warning': 'var(--color-warning)',
        'ds-error': 'var(--color-error)',
        'ds-info': 'var(--color-info)',

        // Original Tailwind colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          50: "hsl(var(--primary-50))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          500: "hsl(var(--primary-500))",
          600: "hsl(var(--primary-600))",
          700: "hsl(var(--primary-700))",
          800: "hsl(var(--primary-800))",
          900: "hsl(var(--primary-900))",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        info: "hsl(var(--info))",
        surface: {
          primary: "hsl(var(--surface-primary))",
          secondary: "hsl(var(--surface-secondary))",
          tertiary: "hsl(var(--surface-tertiary))",
        },
      },
      fontFamily: {
        'ds': 'var(--font-family-base)',
      },
      fontSize: {
        'ds-h1': 'var(--font-size-h1)',
        'ds-h2': 'var(--font-size-h2)',
        'ds-h3': 'var(--font-size-h3)',
        'ds-body': 'var(--font-size-body)',
        'ds-label': 'var(--font-size-label)',
        'ds-small': 'var(--font-size-small)',
        'ds-button': 'var(--font-size-button)',
      },
      fontWeight: {
        'ds-regular': 'var(--font-weight-regular)',
        'ds-medium': 'var(--font-weight-medium)',
        'ds-semibold': 'var(--font-weight-semibold)',
        'ds-bold': 'var(--font-weight-bold)',
      },
      lineHeight: {
        'ds-h1': 'var(--line-height-h1)',
        'ds-h2': 'var(--line-height-h2)',
        'ds-h3': 'var(--line-height-h3)',
        'ds-body': 'var(--line-height-body)',
        'ds-label': 'var(--line-height-label)',
        'ds-small': 'var(--line-height-small)',
        'ds-button': 'var(--line-height-button)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'skeleton-loading': 'skeleton-loading 1.5s infinite',
        'button-spin': 'button-spin 0.8s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      spacing: {
        'ds-xs': 'var(--space-xs)',
        'ds-sm': 'var(--space-sm)',
        'ds-md': 'var(--space-md)',
        'ds-lg': 'var(--space-lg)',
        'ds-xl': 'var(--space-xl)',
        'ds-2xl': 'var(--space-2xl)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}