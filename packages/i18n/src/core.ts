import { createInstance } from "i18next";
import type { InitOptions } from "i18next";

import { defaultLocale, toLocale } from "./resolve";
import type { Locale } from "./resolve";
import { defaultNamespace, namespaces, resources } from "./resources";
import type { Namespace } from "./resources";

/*
 * i18next setup shared by everything that shows text. Server code (emails, push) calls
 * getT(); the website and the app build their own instance with i18nOptions() plus the
 * react-i18next plugin. English is the source language and the fallback for anything
 * missing, so a person never sees a raw key.
 */

// Gives t("emails:verifyEmail.subject") and friends their types from the English catalogs.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: (typeof resources)["en"];
  }
}

/** Options for `i18next.init()`. All catalogs are bundled, so init finishes synchronously. */
export const i18nOptions = (locale: Locale): InitOptions => ({
  defaultNS: defaultNamespace,
  fallbackLng: defaultLocale,
  initAsync: false,
  // React and React Email already escape what they render.
  interpolation: { escapeValue: false },
  lng: locale,
  ns: [...namespaces],
  resources,
  // Missing keys fall back to English; an empty translation counts as missing.
  returnEmptyString: false,
});

const instances = new Map<Locale, ReturnType<typeof createInstance>>();

/** An i18next instance for one language. Cached, because creating one parses every catalog. */
export const getI18n = (language: string | null | undefined) => {
  const locale = toLocale(language) ?? defaultLocale;
  const cached = instances.get(locale);
  if (cached) {
    return cached;
  }
  const instance = createInstance();
  void instance.init(i18nOptions(locale));
  instances.set(locale, instance);
  return instance;
};

/**
 * A `t` function fixed to one language and namespace, for server code.
 *
 * @example
 * const t = getT(user.locale, "push");
 * t("passwordChanged.title"); // "Password changed", "Zmieniono hasło", ...
 */
export const getT = <N extends Namespace>(
  language: string | null | undefined,
  namespace: N
) => getI18n(language).getFixedT(null, namespace);
