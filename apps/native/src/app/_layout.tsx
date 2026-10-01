import { app } from "@repo/config/app";
import { env } from "@repo/env/native";
import { baseSentryOptions } from "@repo/errors/options";
import * as Sentry from "@sentry/react-native";
import type { ErrorBoundaryProps } from "expo-router";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

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
export const ErrorBoundary = ({ error, retry }: ErrorBoundaryProps) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: app.backgroundColor,
        flex: 1,
        gap: 16,
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text style={{ color: "#E2E8F0", fontSize: 18 }}>
        Something went wrong. We have been told about it.
      </Text>
      <Pressable onPress={() => retry()}>
        <Text style={{ color: "#E2E8F0", fontSize: 16 }}>Try again</Text>
      </Pressable>
    </View>
  );
};

const RootLayout = () => (
  <>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerShown: false }} />
  </>
);

// Reports crashes, unhandled promise rejections and slow frames from the root.
export default Sentry.wrap(RootLayout);
