import { app } from "@repo/config/app";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { setLanguage } from "../lib/i18n";

/** Lets anyone change the language, including a carer on the quick-log. */
export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation("common");

  return (
    <View className="mt-6 items-center gap-2">
      <Text className="text-muted">{t("language.label")}</Text>
      <View className="flex-row gap-4">
        {app.i18n.locales.map((locale) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: i18n.language === locale }}
            key={locale}
            onPress={() => setLanguage(locale)}
          >
            <Text
              className={
                i18n.language === locale
                  ? "text-mist font-bold"
                  : "text-mist font-normal"
              }
            >
              {app.i18n.names[locale]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
