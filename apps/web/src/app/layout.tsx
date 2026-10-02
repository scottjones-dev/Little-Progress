import { app } from "@repo/config/app";
import { env } from "@repo/env/web";
import { intlLocale } from "@repo/i18n/format";
import { Toaster } from "@repo/ui/components/sonner";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import type { Metadata } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";

import "@repo/ui/globals.css";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeProvider } from "@/components/theme-provider";

import { I18nProvider } from "../lib/i18n/provider";
import { getLocale } from "../lib/i18n/server";

// Typography from the design brief: a wide, calm grotesque for text and headings, and a
// monospace for times and numbers. latin-ext covers Polish, Welsh and Spanish letters.
// The CSS variable names are the ones the shared styles in @repo/ui read.
const sans = Sora({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const heading = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
});
const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  description: app.description,
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: app.name,
};

const RootLayout = async ({ children }: LayoutProps<"/">) => {
  const locale = await getLocale();

  return (
    <html
      lang={intlLocale(locale)}
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        sans.variable,
        heading.variable,
        mono.variable
      )}
      // next-themes sets the light or dark class on <html> before React runs.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <I18nProvider locale={locale}>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
            <TailwindIndicator />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
