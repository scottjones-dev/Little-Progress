"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Shown when a page throws while rendering. The layout above it keeps working.
const ErrorPage = ({
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
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p>We have been told about it. Please try again.</p>
      <button type="button" onClick={() => retry()}>
        Try again
      </button>
    </main>
  );
};

export default ErrorPage;
