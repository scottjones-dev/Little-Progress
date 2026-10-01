import Link from "next/link";
import { notFound } from "next/navigation";

import { DebugButtons } from "./debug-buttons";

// Development only: a page to prove error reporting reaches Sentry (docs/error-handling.md).
const DebugPage = () => {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold">Error reporting test</h1>
      <DebugButtons />
      <Link href="/debug/server-error" prefetch={false}>
        Throw on the server (opens a page that fails)
      </Link>
    </main>
  );
};

export default DebugPage;
