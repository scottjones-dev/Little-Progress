import { app } from "@repo/config/app";

import { LanguageSwitcher } from "../components/language-switcher";
import { getTranslations } from "../lib/i18n/server";

const Home = async () => {
  const t = await getTranslations("common");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">{app.name}</h1>
      <p>{t("tagline")}</p>
      <LanguageSwitcher />
    </main>
  );
};

export default Home;
