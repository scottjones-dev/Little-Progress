import { app } from "@repo/config/app";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { LanguageSwitcher } from "../components/language-switcher";
import { SentryTest } from "../components/sentry-test";

const HomeScreen = () => {
  const { t } = useTranslation("common");

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: app.backgroundColor,
        flex: 1,
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#E2E8F0", fontSize: 24, fontWeight: "600" }}>
        {app.name}
      </Text>
      <Text style={{ color: "#94A3B8" }}>{t("tagline")}</Text>
      <LanguageSwitcher />
      {__DEV__ ? <SentryTest /> : null}
    </View>
  );
};

export default HomeScreen;
