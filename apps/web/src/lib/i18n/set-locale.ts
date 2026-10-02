"use server";

import { app } from "@repo/config/app";
import { toLocale } from "@repo/i18n/resolve";
import { cookies } from "next/headers";

const oneYearInSeconds = 60 * 60 * 24 * 365;

/**
 * Remembers the visitor's language in a cookie (a carer's device, or a parent who is signed
 * out). A signed-in parent's choice is also saved on their account (`user.locale`), see
 * docs/auth-client.md. Unsupported values are ignored.
 */
export const setLocale = async (value: string) => {
  const locale = toLocale(value);
  if (!locale) {
    return;
  }
  const store = await cookies();
  store.set(app.i18n.cookie, locale, {
    httpOnly: true,
    maxAge: oneYearInSeconds,
    path: "/",
    sameSite: "lax",
  });
};
