"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Last resort: replaces the root layout, so it brings its own <html> and <body>.
const GlobalError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main>
          <h1>Something went wrong</h1>
          <p>We have been told about it. Please try again.</p>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
