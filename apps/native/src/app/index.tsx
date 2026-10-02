import { app } from "@repo/config/app";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { LanguageSwitcher } from "../components/language-switcher";
import { SentryTest } from "../components/sentry-test";

const HomeScreen = () => {
  const { t } = useTranslation("common");

  return (
    <View className="bg-obsidian flex-1 items-center justify-center">
      <Text className="text-mist text-2xl font-semibold">{app.name}</Text>
      <Text className="text-muted">{t("tagline")}</Text>
      <LanguageSwitcher />
      {__DEV__ ? <SentryTest /> : null}
    </View>
  );
};

export default HomeScreen;
