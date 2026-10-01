import { pixelBasedPreset } from "@react-email/components";
import { app } from "@repo/config/app";

export const tailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        border: app.colors.border,
        gold: app.colors.gold,
        "gold-text": app.colors.goldText,
        mist: app.colors.mist,
        muted: app.colors.muted,
        obsidian: app.colors.obsidian,
        surface: app.colors.surface,
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
};

export const absoluteUrl = (path: string) =>
  path.startsWith("http") || path.startsWith("mailto:")
    ? path
    : `${app.url}${path}`;
