"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Light and dark mode. The theme is the `dark` class on <html>; the shared UI
 * package's styles turn it into colours. The default is "system" (the device's setting); dark is the
 * brand theme and can be chosen with the toggle. The choice is remembered in this browser only (localStorage, nothing is sent).
 */
export const ThemeProvider = (
  props: ComponentProps<typeof NextThemesProvider>
) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    disableTransitionOnChange
    enableSystem
    {...props}
  />
);
