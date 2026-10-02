import { app } from "@repo/config/app";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { setLanguage } from "../lib/i18n";

/** Lets anyone change the language, including a carer on the quick-log. */
export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation("common");

  return (
    <View style={{ alignItems: "center", gap: 8, marginTop: 24 }}>
      <Text style={{ color: "#94A3B8" }}>{t("language.label")}</Text>
      <View style={{ flexDirection: "row", gap: 16 }}>
        {app.i18n.locales.map((locale) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: i18n.language === locale }}
            key={locale}
            onPress={() => setLanguage(locale)}
          >
            <Text
              style={{
                color: "#E2E8F0",
                fontWeight: i18n.language === locale ? "700" : "400",
              }}
            >
              {app.i18n.names[locale]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
