import type { Config } from "tailwindcss";

/**
 * Auris design tokens — from the approved wireframe (Auris Wireframes.html).
 *
 * Palette: warm paper, rust accent.
 * Type: Instrument Serif (display, italic) · Inter (body) · JetBrains Mono (labels).
 */
export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f6f3ee",       // --bg
        paper2: "#efe9dd",      // --bg-2
        card: "#ffffff",        // --card
        ink: "#1a1a1a",         // --ink
        ink2: "#3a3a3a",        // --ink-2
        ink3: "#6b6b6b",        // --ink-3
        ink4: "#a5a097",        // --ink-4
        line: "#e3ddd0",        // --line
        line2: "#d3cbba",       // --line-2
        rust: "#c44a2b",        // --accent
        rustsoft: "#f2dfd4",    // --accent-soft
        darkpaper: "#0e0d0b",
        darkpaper2: "#15130f",
        darkcard: "#1a1815",
        darkink: "#f5efe0",
      },
      fontFamily: {
        display: ['"Instrument Serif"', "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "18px",
        "2xl": "28px",
      },
    },
  },
  plugins: [],
} satisfies Config;
