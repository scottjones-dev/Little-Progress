import AsyncStorage from "@react-native-async-storage/async-storage";
import { app } from "@repo/config/app";
import { i18nOptions } from "@repo/i18n/core";
import { resolveLocale, toLocale } from "@repo/i18n/resolve";
import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import type { i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";

/*
 * The app's translations. The catalogs live in @repo/i18n and are bundled, so this starts
 * in the device's language straight away; a language the person chose earlier is restored
 * a moment later by restoreLanguage(). English is the fallback. See docs/i18n.md.
 */

const storageKey = app.i18n.cookie;

export const i18n: I18nInstance = createInstance();

void i18n
  .use(initReactI18next)
  .init(i18nOptions(resolveLocale({ device: getLocales()[0]?.languageCode })));

/** Switches to the language the person chose last time, if they chose one. */
export const restoreLanguage = async () => {
  try {
    const saved = toLocale(await AsyncStorage.getItem(storageKey));
    if (saved) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // Storage can fail (for example on a full disk); the device language is a fine default.
  }
};

/** Changes the language now and remembers it for next time. */
export const setLanguage = async (value: string) => {
  const locale = toLocale(value);
  if (!locale) {
    return;
  }
  await i18n.changeLanguage(locale);
  try {
    await AsyncStorage.setItem(storageKey, locale);
  } catch {
    // The language still changed for this session; it just will not be remembered.
  }
};
