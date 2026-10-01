import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { app } from "@repo/config/app";
import { db } from "@repo/db";
import {
  account,
  session,
  user as userTable,
  verification,
} from "@repo/db/schemas/auth";
import { env } from "@repo/env/auth";
import { createAuthMiddleware, isAPIError } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";

import {
  notifyPasswordChanged,
  RESET_PASSWORD_EXPIRES_IN_SECONDS,
  sendResetPassword,
  sendVerificationEmail,
  VERIFY_EMAIL_EXPIRES_IN_SECONDS,
} from "./emails";

/**
 * The Better Auth instance. The CLI reads this file to generate the schema
 * (`pnpm auth:generate`), so it must export `auth`.
 *
 * Scope for now: email and password with required email verification.
 * Social sign-in, 2FA, passkeys and lockout are planned in docs/auth.md.
 */
export const auth = betterAuth({
  appName: app.name,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { account, session, user: userTable, verification },
  }),
  emailAndPassword: {
    enabled: true,
    onPasswordReset: ({ user }) => {
      notifyPasswordChanged(user);
      return Promise.resolve();
    },
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: RESET_PASSWORD_EXPIRES_IN_SECONDS,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: ({ url, user }) => {
      sendResetPassword({ url, user });
      return Promise.resolve();
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    expiresIn: VERIFY_EMAIL_EXPIRES_IN_SECONDS,
    sendOnSignUp: true,
    sendVerificationEmail: ({ url, user }) => {
      sendVerificationEmail({ url, user });
      return Promise.resolve();
    },
  },
  hooks: {
    after: createAuthMiddleware((ctx) => {
      // Password changed from settings. (A reset is handled by onPasswordReset above.)
      // After-hooks also run when the endpoint failed (for example a wrong current
      // password), so only notify when it succeeded.
      if (
        ctx.path === "/change-password" &&
        !isAPIError(ctx.context.returned)
      ) {
        const user = ctx.context.session?.user;
        if (user) {
          notifyPasswordChanged(user);
        }
      }
      return Promise.resolve();
    }),
  },
  rateLimit: {
    customRules: {
      // Password guessing: 5 attempts per minute per IP (plan: login 5/min).
      "/sign-in/email": { max: 5, window: 60 },
    },
    enabled: true,
  },
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.WEB_ORIGIN],
  user: {
    // The email address is the identity, so it cannot be changed (docs/auth.md section 1).
    changeEmail: { enabled: false },
  },
});
