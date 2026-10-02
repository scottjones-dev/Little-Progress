"use client";

import { getI18n } from "@repo/i18n/core";
import * as Sentry from "@sentry/nextjs";
import { useEffect, useSyncExternalStore } from "react";

// The browser's language never changes while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {
  // Nothing to clean up.
};

// Last resort: replaces the root layout, so it brings its own <html> and <body> and cannot
// use the layout's translation provider. It starts in English and switches to the browser's
// language as soon as it is running in the browser.
const GlobalError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => {
  // Empty on the server (so English), the browser's language in the browser.
  const language = useSyncExternalStore(
    subscribe,
    () => navigator.language,
    () => ""
  );
  const i18n = getI18n(language);
  const shell = i18n.getFixedT(null, "shell");
  const common = i18n.getFixedT(null, "common");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang={i18n.language}>
      <body>
        <main>
          <h1>{shell("error.title")}</h1>
          <p>{shell("error.body")}</p>
          <button type="button" onClick={() => retry()}>
            {common("actions.tryAgain")}
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
