import cyCommon from "./locales/cy/common.json";
import cyEmails from "./locales/cy/emails.json";
import cyErrors from "./locales/cy/errors.json";
import cyPush from "./locales/cy/push.json";
import cyShell from "./locales/cy/shell.json";
import enCommon from "./locales/en/common.json";
import enEmails from "./locales/en/emails.json";
import enErrors from "./locales/en/errors.json";
import enPush from "./locales/en/push.json";
import enShell from "./locales/en/shell.json";
import esCommon from "./locales/es/common.json";
import esEmails from "./locales/es/emails.json";
import esErrors from "./locales/es/errors.json";
import esPush from "./locales/es/push.json";
import esShell from "./locales/es/shell.json";
import plCommon from "./locales/pl/common.json";
import plEmails from "./locales/pl/emails.json";
import plErrors from "./locales/pl/errors.json";
import plPush from "./locales/pl/push.json";
import plShell from "./locales/pl/shell.json";

/*
 * Every catalog, bundled statically so no language ever waits for a network request.
 * The files in locales/ are the source of truth: English is written by hand, the others
 * are produced by `pnpm i18n:translate` (see docs/i18n.md). Bundlers and Node both need
 * these imports spelled out, which is why they are listed rather than discovered.
 */
export const resources = {
  cy: {
    common: cyCommon,
    emails: cyEmails,
    errors: cyErrors,
    push: cyPush,
    shell: cyShell,
  },
  en: {
    common: enCommon,
    emails: enEmails,
    errors: enErrors,
    push: enPush,
    shell: enShell,
  },
  es: {
    common: esCommon,
    emails: esEmails,
    errors: esErrors,
    push: esPush,
    shell: esShell,
  },
  pl: {
    common: plCommon,
    emails: plEmails,
    errors: plErrors,
    push: plPush,
    shell: plShell,
  },
} as const;

/** Namespaces: one JSON file per area, so a screen can ask for only what it needs. */
export const namespaces = [
  "common",
  "emails",
  "errors",
  "push",
  "shell",
] as const;
export type Namespace = (typeof namespaces)[number];

export const defaultNamespace: Namespace = "common";
