import { app } from "@repo/config/app";

import { toLocale } from "./resolve";

/*
 * Dates, numbers and lists for people. Always pass the person's language: the same value
 * is written differently in Polish, Spanish and Welsh. English uses the UK flavour
 * (app.locale) so dates read 1 October 2026 and times use 24 hours.
 */

/** The full locale tag for Intl and `<html lang>`: English gets its UK flavour, others use the language alone. */
export const intlLocale = (language: string | null | undefined) => {
  const locale = toLocale(language);
  return !locale || locale === "en" ? app.locale : locale;
};

/** "1 October 2026, 14:32" in the person's language. */
export const formatDateTime = (
  date: Date,
  language: string | null | undefined,
  timeZone?: string
) =>
  new Intl.DateTimeFormat(intlLocale(language), {
    dateStyle: "long",
    hourCycle: "h23",
    timeStyle: "short",
    timeZone,
  }).format(date);

/** "1 October 2026" in the person's language. */
export const formatDate = (
  date: Date,
  language: string | null | undefined,
  timeZone?: string
) =>
  new Intl.DateTimeFormat(intlLocale(language), {
    dateStyle: "long",
    timeZone,
  }).format(date);

export const formatNumber = (
  value: number,
  language: string | null | undefined,
  options?: Intl.NumberFormatOptions
) => new Intl.NumberFormat(intlLocale(language), options).format(value);

/** "A, B and C" with the right word and punctuation for the language. */
export const formatList = (
  items: string[],
  language: string | null | undefined
) =>
  new Intl.ListFormat(intlLocale(language), {
    style: "long",
    type: "conjunction",
  }).format(items);
