import { env } from "@repo/env/native";
import { baseSentryOptions } from "@repo/errors/options";
import * as Sentry from "@sentry/react-native";
import type { ErrorBoundaryProps } from "expo-router";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { trackScreen } from "../lib/analytics";

import "../global.css";
import { i18n, restoreLanguage } from "../lib/i18n";

// No screenshots or view hierarchy: the screens show a child's health diary.
// Without a DSN nothing is sent. What is scrubbed and why: docs/error-handling.md.
Sentry.init({
  ...baseSentryOptions({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? "development" : "production",
  }),
  attachScreenshot: false,
  attachViewHierarchy: false,
});

// Expo Router shows this when a screen throws while rendering.
// It can render outside the layout, so it reads the translations directly instead of by hook.
export const ErrorBoundary = ({ error, retry }: ErrorBoundaryProps) => {
  const shell = i18n.getFixedT(null, "shell");
  const common = i18n.getFixedT(null, "common");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <View className="bg-obsidian flex-1 items-center justify-center gap-4 p-6">
      <Text className="text-mist text-lg">
        {shell("error.title")}. {shell("error.body")}
      </Text>
      <Pressable onPress={() => retry()}>
        <Text className="text-mist text-base">
          {common("actions.tryAgain")}
        </Text>
      </Pressable>
    </View>
  );
};

const RootLayout = () => {
  const pathname = usePathname();

  // Switch to the language the person chose last time (the device language is used until then).
  useEffect(() => {
    void restoreLanguage();
  }, []);

  // One screen view per route change (the carer quick-log is dropped inside trackScreen's SDK
  // filter, see @repo/analytics). The path is the route, never entry content.
  useEffect(() => {
    trackScreen(pathname);
  }, [pathname]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
};

// Reports crashes, unhandled promise rejections and slow frames from the root.
export default Sentry.wrap(RootLayout);
