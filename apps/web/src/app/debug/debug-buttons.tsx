"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

// Three ways an error can happen in the browser, one button each.
export const DebugButtons = () => {
  const [crashRender, setCrashRender] = useState(false);

  if (crashRender) {
    // Caught by app/error.tsx, which reports it and shows the calm error page.
    throw new Error("Debug error: web render");
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={() =>
          Sentry.captureException(new Error("Debug error: web captured"))
        }
      >
        Send a captured error
      </button>
      <button
        type="button"
        onClick={() => {
          // Not caught by React: the browser reports it as an unhandled error.
          throw new Error("Debug error: web click handler");
        }}
      >
        Throw in a click handler
      </button>
      <button type="button" onClick={() => setCrashRender(true)}>
        Crash while rendering (shows the error page)
      </button>
    </div>
  );
};
