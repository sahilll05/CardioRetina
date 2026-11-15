/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

export default {
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
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Host Grotesk", "Inter", ...defaultTheme.fontFamily.sans],
        mono: ["Atkinson Hyperlegible Mono", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        border: "var(--color-rule)",
        "border-strong": "var(--color-rule-2)",
        input: "var(--color-rule)",
        ring: "var(--color-focus)",
        background: "var(--color-paper)",
        foreground: "var(--color-ink)",
        surface: "var(--color-paper-2)",
        "surface-deep": "var(--color-paper-3)",
        card: {
          DEFAULT: "var(--color-paper-2)",
          foreground: "var(--color-ink)",
        },
        popover: {
          DEFAULT: "var(--color-paper-2)",
          foreground: "var(--color-ink)",
        },
        muted: {
          DEFAULT: "var(--color-paper-2)",
          foreground: "var(--color-muted)",
        },
        primary: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-ink)",
          soft: "var(--color-accent-soft)",
        },
        secondary: {
          DEFAULT: "var(--color-paper-2)",
          foreground: "var(--color-ink)",
        },
        cool: {
          DEFAULT: "var(--color-cool)",
          soft: "var(--color-cool-soft)",
        },
        ok: {
          DEFAULT: "var(--color-ok)",
          soft: "var(--color-ok-soft)",
        },
        success: {
          DEFAULT: "var(--color-ok)",
          foreground: "var(--color-accent-ink)",
          soft: "var(--color-ok-soft)",
        },
        warning: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-ink)",
          soft: "var(--color-accent-soft)",
        },
        destructive: {
          DEFAULT: "var(--color-bad)",
          foreground: "var(--color-ink)",
          soft: "var(--color-bad-soft)",
        },
        bad: {
          DEFAULT: "var(--color-bad)",
          soft: "var(--color-bad-soft)",
        },
      },
      borderRadius: {
        lg: "var(--radius-card)",
        md: "var(--radius-input)",
        sm: "var(--radius-pill)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
