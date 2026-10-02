import * as Sentry from "@sentry/react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { track } from "../lib/analytics";

// Development only: buttons to prove error reporting and analytics work (docs/error-handling.md, docs/analytics.md).
export const SentryTest = () => {
  const [crashRender, setCrashRender] = useState(false);

  if (crashRender) {
    // Caught by the ErrorBoundary in app/_layout.tsx, which reports it.
    throw new Error("Debug error: native render");
  }

  return (
    <View style={{ gap: 12, marginTop: 32 }}>
      <Pressable
        onPress={() =>
          Sentry.captureException(new Error("Debug error: native captured"))
        }
      >
        <Text style={{ color: "#E2E8F0" }}>Send a captured error</Text>
      </Pressable>
      <Pressable onPress={() => track("insight_viewed", {})}>
        <Text style={{ color: "#E2E8F0" }}>
          Send an analytics test event (insight_viewed)
        </Text>
      </Pressable>
      <Pressable onPress={() => setCrashRender(true)}>
        <Text style={{ color: "#E2E8F0" }}>
          Crash while rendering (shows the error screen)
        </Text>
      </Pressable>
    </View>
  );
};
