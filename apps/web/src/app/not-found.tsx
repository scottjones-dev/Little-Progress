import { app } from "@repo/config/app";
import Link from "next/link";

const NotFound = () => (
  <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
    <h1 className="text-2xl font-semibold">Page not found</h1>
    <p>That page does not exist in {app.name}.</p>
    <Link href="/">Go home</Link>
  </main>
);

export default NotFound;
