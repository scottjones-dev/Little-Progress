import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { app } from "@repo/config/app";
import { db } from "@repo/db";
import {
  account,
  invitation,
  member,
  organization as organizationTable,
  passkey as passkeyTable,
  rateLimit,
  session,
  twoFactor as twoFactorTable,
  user as userTable,
  verification,
} from "@repo/db/schemas/auth";
import { env } from "@repo/env/auth";
import type { BetterAuthOptions } from "better-auth";
import { createAuthMiddleware, isAPIError } from "better-auth/api";
import { symmetricEncrypt } from "better-auth/crypto";
import { betterAuth } from "better-auth/minimal";
import { lastLoginMethod, organization, twoFactor } from "better-auth/plugins";
import { eq, notExists } from "drizzle-orm";

import {
  FAMILY_INVITE_EXPIRES_IN_SECONDS,
  notifyPasswordChanged,
  notifyTwoFactorChanged,
  RESET_PASSWORD_EXPIRES_IN_SECONDS,
  sendDeleteAccountVerification,
  sendFamilyInvite,
  sendResetPassword,
  sendVerificationEmail,
  VERIFY_EMAIL_EXPIRES_IN_SECONDS,
} from "./emails";

/*
 * Social sign-in (Google, Microsoft docs). A provider is only switched on when both of
 * its credentials are set, so the API still starts without them.
 */
const socialProviders: BetterAuthOptions["socialProviders"] = {};
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}
if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
  socialProviders.microsoft = {
    clientId: env.MICROSOFT_CLIENT_ID,
    clientSecret: env.MICROSOFT_CLIENT_SECRET,
    // Microsoft sends the photo as a huge base64 string; the docs advise dropping it.
    mapProfileToUser: () => ({ image: "" }),
    prompt: "select_account",
    tenantId: "common",
  };
}

/**
 * The Better Auth instance. The CLI reads this file to generate the schema
 * (`pnpm auth:generate`), so it must export `auth`.
 *
 * Built from the Better Auth docs: email and password, social sign-in, two-factor,
 * passkeys, last login method, organizations (a family is an organization), delete
 * account, rate limit and session settings. See docs/auth.md.
 */
export const auth = betterAuth({
  account: {
    accountLinking: {
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
      enabled: true,
      trustedProviders: ["google", "microsoft"],
    },
  },
  advanced: {
    ipAddress: {
      // Cloudflare's header first (production), then the standard one for local dev.
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
    },
  },
  appName: app.name,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account,
      invitation,
      member,
      organization: organizationTable,
      passkey: passkeyTable,
      rateLimit,
      session,
      twoFactor: twoFactorTable,
      user: userTable,
      verification,
    },
  }),
  // Better Auth does not encrypt provider tokens; encrypt them before they are stored.
  databaseHooks: {
    account: {
      create: {
        before: async (newAccount) => {
          const encrypted = { ...newAccount };
          if (newAccount.accessToken) {
            encrypted.accessToken = await symmetricEncrypt({
              data: newAccount.accessToken,
              key: env.BETTER_AUTH_SECRET,
            });
          }
          if (newAccount.refreshToken) {
            encrypted.refreshToken = await symmetricEncrypt({
              data: newAccount.refreshToken,
              key: env.BETTER_AUTH_SECRET,
            });
          }
          return { data: encrypted };
        },
      },
    },
  },
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
      // After-hooks also run when the endpoint failed (for example a wrong current
      // password), so only act when it succeeded.
      if (isAPIError(ctx.context.returned)) {
        return Promise.resolve();
      }
      const user = ctx.context.session?.user;
      if (!user) {
        return Promise.resolve();
      }
      // Password changed from settings. (A reset is handled by onPasswordReset above.)
      if (ctx.path === "/change-password") {
        notifyPasswordChanged(user);
      }
      // Two-factor turned off, or on (the first verified code finishes enrolment).
      if (ctx.path === "/two-factor/disable") {
        notifyTwoFactorChanged(user, "off");
      }
      if (ctx.path === "/two-factor/verify-totp" && !user.twoFactorEnabled) {
        notifyTwoFactorChanged(user, "on");
      }
      return Promise.resolve();
    }),
  },
  plugins: [
    twoFactor({
      backupCodeOptions: { amount: 10 },
      issuer: app.name,
    }),
    passkey({
      origin: env.WEB_ORIGIN,
      rpID: env.PASSKEY_RP_ID,
      rpName: app.name,
    }),
    // Stored in the database only; the docs treat the cookie as non-essential (GDPR).
    lastLoginMethod({
      beforeStoreCookie: () => false,
      storeInDatabase: true,
    }),
    expo(),
    // A family is an organization: the creator is the owner, a second parent is invited.
    organization({
      cancelPendingInvitationsOnReInvite: true,
      creatorRole: "owner",
      invitationExpiresIn: FAMILY_INVITE_EXPIRES_IN_SECONDS,
      organizationLimit: 1,
      requireEmailVerificationOnInvitation: true,
      schema: {
        organization: {
          additionalFields: {
            // Carer PIN gate (separate from Better Auth; see docs/auth.md).
            carerPinHash: { input: false, required: false, type: "string" },
            carerPinVersion: {
              defaultValue: 1,
              input: false,
              required: false,
              type: "number",
            },
            joinCode: {
              input: false,
              required: false,
              type: "string",
              unique: true,
            },
          },
        },
      },
      sendInvitationEmail: (data) => {
        sendFamilyInvite({
          email: data.email,
          familyName: data.organization.name,
          invitationId: data.id,
          inviterName: data.inviter.user.name,
        });
        return Promise.resolve();
      },
    }),
  ],
  rateLimit: {
    customRules: {
      // Sessions are read on every page, so they are not rate limited.
      "/get-session": false,
      // Password guessing: 5 attempts per minute per IP (plan: login 5/min).
      "/sign-in/email": { max: 5, window: 60 },
    },
    enabled: true,
    // Database storage so limits survive restarts and work across instances.
    storage: "database",
  },
  secret: env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    // Sensitive actions (delete account, enable 2FA) need a sign-in within 15 minutes.
    freshAge: 60 * 15,
    updateAge: 60 * 60 * 24,
  },
  socialProviders,
  trustedOrigins: [
    env.WEB_ORIGIN,
    `${app.scheme}://`,
    // Expo Go uses exp:// with the machine's address while developing (docs: development only).
    ...(env.NODE_ENV === "development" ? ["exp://", "exp://**"] : []),
  ],
  user: {
    additionalFields: {
      // Preferred language, used by the i18n work later.
      locale: { input: true, required: false, type: "string" },
    },
    // The email address is the identity, so it cannot be changed (docs/auth.md section 1).
    changeEmail: { enabled: false },
    deleteUser: {
      // Memberships go with the user. A family with no parents left is deleted too, and
      // its children, entries and photos follow through the foreign keys.
      afterDelete: async () => {
        await db
          .delete(organizationTable)
          .where(
            notExists(
              db
                .select({ id: member.id })
                .from(member)
                .where(eq(member.organizationId, organizationTable.id))
            )
          );
      },
      enabled: true,
      sendDeleteAccountVerification: ({ url, user }) => {
        sendDeleteAccountVerification({ url, user });
        return Promise.resolve();
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
