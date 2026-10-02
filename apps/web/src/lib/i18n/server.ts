import { app } from "@repo/config/app";
import { getT } from "@repo/i18n/core";
import { resolveLocale } from "@repo/i18n/resolve";
import type { Namespace } from "@repo/i18n/resources";
import { cookies, headers } from "next/headers";

/**
 * The language for this request: the remembered cookie, then the browser's preference,
 * then English. (A signed-in parent's saved language joins this list with the auth screens.)
 * Reading cookies and headers makes the page render per request instead of ahead of time.
 */
export const getLocale = async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLocale({
    acceptLanguage: headerStore.get("accept-language"),
    cookie: cookieStore.get(app.i18n.cookie)?.value,
  });
};

/** `t` for Server Components: `const t = await getTranslations("shell")`. */
export const getTranslations = async <N extends Namespace>(namespace: N) =>
  getT(await getLocale(), namespace);
