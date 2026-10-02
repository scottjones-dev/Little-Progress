import { defaultLocale, locales } from "./resolve";
import { namespaces, resources } from "./resources";

/*
 * Checks the translation catalogs. Used by the unit tests (which only check what is
 * written) and by `pnpm i18n:check` (which also demands every language is complete).
 * Pure functions over the bundled catalogs, no file access.
 */

export interface Catalog {
  [key: string]: Catalog | string;
}

const pluralSuffix = /_(?<category>zero|one|two|few|many|other)$/u;
const singleNumberForm = /_(?:zero|one|two)$/u;
const placeholder = /\{\{(?<name>[^}]+)\}\}/gu;
const markup = /<\/?[a-z][^>]*>/iu;
const emailAddress = /[^\s@]+@[^\s@]+\.[^\s@]+/u;

/** `{ a: { b: "x" } }` becomes `{ "a.b": "x" }`. */
export const flatten = (
  catalog: Catalog,
  prefix = ""
): Record<string, string> => {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      flat[path] = value;
    } else {
      Object.assign(flat, flatten(value, path));
    }
  }
  return flat;
};

/** The `{{names}}` used in a string, sorted and without duplicates. */
export const placeholdersOf = (text: string) =>
  [
    ...new Set(
      [...text.matchAll(placeholder)].map(
        (match) => match.groups?.name?.trim() ?? ""
      )
    ),
  ].toSorted();

/** The plural forms a language needs, for example en: one, other; pl: one, few, many, other. */
export const pluralCategories = (locale: string) =>
  new Intl.PluralRules(locale).resolvedOptions().pluralCategories;

/** Every key a complete translation must have, with plural keys expanded per language. */
export const expectedKeys = (
  english: Record<string, string>,
  locale: string
) => {
  const keys = new Set<string>();
  for (const key of Object.keys(english)) {
    const base = key.replace(pluralSuffix, "");
    if (base === key) {
      keys.add(key);
    } else {
      for (const category of pluralCategories(locale)) {
        keys.add(`${base}_${category}`);
      }
    }
  }
  return keys;
};

/** The English key whose placeholders a translated key must keep. */
const referenceKey = (english: Record<string, string>, key: string) => {
  if (key in english) {
    return key;
  }
  // A plural form English does not have (pl "few") is compared with English "other".
  return key.replace(pluralSuffix, "_other");
};

const contentProblems = (text: string, where: string) => {
  const problems: string[] = [];
  if (text.trim() === "") {
    problems.push(`${where}: empty value`);
  }
  if (markup.test(text)) {
    problems.push(`${where}: contains markup (keep strings plain text)`);
  }
  if (emailAddress.test(text)) {
    problems.push(
      `${where}: contains an email address (no personal data in catalogs)`
    );
  }
  return problems;
};

interface CheckOptions {
  /** Also report every key a language is missing. Off for unit tests, on for i18n:check. */
  requireComplete?: boolean;
}

/** Problems in one namespace of one language, as readable lines. Empty means fine. */
export const checkNamespace = (
  locale: string,
  namespace: string,
  actual: Catalog,
  english: Catalog,
  { requireComplete = false }: CheckOptions = {}
) => {
  const problems: string[] = [];
  const englishFlat = flatten(english);
  const flat = flatten(actual);
  const expected = expectedKeys(englishFlat, locale);

  for (const [key, text] of Object.entries(flat)) {
    const where = `${locale}/${namespace}: ${key}`;
    problems.push(...contentProblems(text, where));
    if (!expected.has(key)) {
      problems.push(
        `${where}: key does not exist in English (or is not a plural form this language uses)`
      );
      continue;
    }
    const reference = englishFlat[referenceKey(englishFlat, key)] ?? "";
    // {{count}} only picks the plural form, so it is never required. The forms for exactly
    // zero, one or two may spell the number out ("jedna minuta"), so {{amount}} is optional there.
    const isPlural = pluralSuffix.test(key);
    const mayDropAmount = singleNumberForm.test(key);
    const ignore = (name: string) =>
      !(isPlural && (name === "count" || (mayDropAmount && name === "amount")));
    const wanted = placeholdersOf(reference).filter(ignore);
    const found = placeholdersOf(text).filter(ignore);
    if (wanted.join(",") !== found.join(",")) {
      problems.push(
        `${where}: placeholders ${JSON.stringify(found)} should be ${JSON.stringify(wanted)}`
      );
    }
  }

  if (requireComplete) {
    for (const key of expected) {
      if (!(key in flat)) {
        problems.push(`${locale}/${namespace}: ${key}: missing translation`);
      }
    }
  }
  return problems;
};

/** All problems across every language and namespace. */
export const checkCatalogs = (options: CheckOptions = {}) => {
  const problems: string[] = [];
  for (const locale of locales) {
    for (const namespace of namespaces) {
      problems.push(
        ...checkNamespace(
          locale,
          namespace,
          resources[locale][namespace],
          resources[defaultLocale][namespace],
          options
        )
      );
    }
  }
  return problems;
};
