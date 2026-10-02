import { app } from "@repo/config/app";
import { env } from "@repo/env/web";
import { intlLocale } from "@repo/i18n/format";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { I18nProvider } from "../lib/i18n/provider";
import { getLocale } from "../lib/i18n/server";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
};

export default RootLayout;
