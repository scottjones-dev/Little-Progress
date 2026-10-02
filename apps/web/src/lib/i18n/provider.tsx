"use client";

import { i18nOptions } from "@repo/i18n/core";
import type { Locale } from "@repo/i18n/resolve";
import { createInstance } from "i18next";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { I18nextProvider } from "react-i18next";

interface I18nProviderProps {
  children: ReactNode;
  locale: Locale;
}

/**
 * Gives Client Components their translations (`useTranslation`). The root layout picks the
 * language on the server and passes it in, so server and browser always agree.
 */
export const I18nProvider = ({ children, locale }: I18nProviderProps) => {
  const i18n = useMemo(() => {
    const instance = createInstance();
    // All catalogs are bundled, so this finishes immediately.
    void instance.init(i18nOptions(locale));
    return instance;
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
