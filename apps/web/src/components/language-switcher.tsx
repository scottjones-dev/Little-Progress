"use client";

import { app } from "@repo/config/app";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslation } from "react-i18next";

import { setLocale } from "../lib/i18n/set-locale";

/** Lets anyone change the language, including a carer on the quick-log. */
export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      {t("language.label")}
      <select
        className="rounded border px-2 py-1"
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(async () => {
            await setLocale(next);
            // Re-render the server parts in the new language.
            router.refresh();
          });
        }}
        value={i18n.language}
      >
        {app.i18n.locales.map((locale) => (
          <option key={locale} value={locale}>
            {app.i18n.names[locale]}
          </option>
        ))}
      </select>
    </label>
  );
};
