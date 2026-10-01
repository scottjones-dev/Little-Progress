import { auth } from "@repo/auth/auth";
import { createMiddleware } from "hono/factory";

type Session = typeof auth.$Infer.Session;

export interface SessionEnv {
  Variables: {
    session: Session["session"] | null;
    user: Session["user"] | null;
  };
}

/** Looks up the signed-in user from the request cookies and puts it on the context. */
export const sessionMiddleware = createMiddleware<SessionEnv>(
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("session", session?.session ?? null);
    c.set("user", session?.user ?? null);
    return await next();
  }
);
