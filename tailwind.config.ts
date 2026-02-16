import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        denied: {
          black: "hsl(var(--denied-black))",
          peach: "hsl(var(--denied-peach))",
          mint: "hsl(var(--denied-mint))",
          cream: "hsl(var(--denied-cream))",
        },
      },
      borderRadius: {
        "2xl": "calc(var(--radius) + 4px)", /* 24px */
        xl: "var(--radius)", /* 20px */
        lg: "calc(var(--radius) - 4px)", /* 16px */
        md: "calc(var(--radius) - 8px)", /* 12px */
        sm: "calc(var(--radius) - 12px)", /* 8px */
        full: "9999px",
      },
      boxShadow: {
        "elevated": "var(--shadow-md)",
        "lifted": "var(--shadow-lg)",
        "floating": "var(--shadow-xl)",
        "hero": "var(--shadow-float)",
        "inner-subtle": "var(--shadow-inset)",
        "glow-mint": "var(--shadow-glow-mint)",
        "glow-peach": "var(--shadow-glow-peach)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "splash-glow": {
          "0%": { opacity: "0", transform: "scale(0.92)", filter: "brightness(0.8)" },
          "50%": { opacity: "1", transform: "scale(1)", filter: "brightness(1.1) drop-shadow(0 0 40px rgba(94,178,152,0.25))" },
          "100%": { opacity: "1", transform: "scale(1)", filter: "brightness(1) drop-shadow(0 0 20px rgba(94,178,152,0.1))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "splash-glow": "splash-glow 1.4s ease-in-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
