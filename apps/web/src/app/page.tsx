import { app } from "@repo/config/app";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

import { LanguageSwitcher } from "../components/language-switcher";
import { ThemeToggle } from "../components/theme-toggle";
import { getTranslations } from "../lib/i18n/server";

const Home = async () => {
  const t = await getTranslations("common");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{app.name}</CardTitle>
          <CardDescription>{t("tagline")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Home;
