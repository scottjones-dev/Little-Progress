"use client";

import { Button } from "@repo/ui/components/button";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Shown when a page throws while rendering. The layout above it keeps working.
const ErrorPage = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => {
  const { t } = useTranslation(["shell", "common"]);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t("shell:error.title")}</h1>
      <p>{t("shell:error.body")}</p>
      <Button onClick={() => retry()}>{t("common:actions.tryAgain")}</Button>
    </main>
  );
};

export default ErrorPage;
