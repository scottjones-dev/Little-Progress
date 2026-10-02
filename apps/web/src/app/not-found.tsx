import { app } from "@repo/config/app";
import Link from "next/link";

import { getTranslations } from "../lib/i18n/server";

const NotFound = async () => {
  const [shell, common] = await Promise.all([
    getTranslations("shell"),
    getTranslations("common"),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{shell("notFound.title")}</h1>
      <p>{shell("notFound.body", { appName: app.name })}</p>
      <Link href="/">{common("actions.goHome")}</Link>
    </main>
  );
};

export default NotFound;
