import { notFound } from "next/navigation";

// Development only: fails while rendering on the server, so Next calls onRequestError.
const ServerErrorPage = () => {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  throw new Error("Debug error: web server render");
};

export default ServerErrorPage;
