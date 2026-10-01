import { env } from "@repo/env/auth";
import { notify } from "@repo/notifications/notify";

/** The user fields Better Auth hands to our email callbacks. */
interface EmailUser {
  email: string;
  id: string;
  name: string;
}

export const VERIFY_EMAIL_EXPIRES_IN_SECONDS = 60 * 60;
export const RESET_PASSWORD_EXPIRES_IN_SECONDS = 60 * 60;

const toRecipient = (user: EmailUser) => ({
  email: user.email,
  subscriberId: user.id,
});

const minutes = (seconds: number) => Math.round(seconds / 60);

/*
 * All three emails are `void notify(...)`. Better Auth's docs warn that awaiting the
 * send makes "email exists" requests slower than "email does not exist" ones, which
 * would reveal who has an account. notify() never throws.
 */

export const sendVerificationEmail = ({
  url,
  user,
}: {
  url: string;
  user: EmailUser;
}) => {
  void notify("verify-email", {
    payload: {
      expiresInMinutes: minutes(VERIFY_EMAIL_EXPIRES_IN_SECONDS),
      name: user.name,
      verifyUrl: url,
    },
    to: toRecipient(user),
  });
};

export const sendResetPassword = ({
  url,
  user,
}: {
  url: string;
  user: EmailUser;
}) => {
  void notify("reset-password", {
    payload: {
      expiresInMinutes: minutes(RESET_PASSWORD_EXPIRES_IN_SECONDS),
      name: user.name,
      resetUrl: url,
    },
    to: toRecipient(user),
  });
};

/** Used for both a reset and a change from settings, so the two cannot drift apart. */
export const notifyPasswordChanged = (user: EmailUser) => {
  void notify("password-changed", {
    payload: {
      changedAt: new Intl.DateTimeFormat("en-GB", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date()),
      name: user.name,
      // Until account lockdown exists, "secure my account" means choosing a new password.
      secureAccountUrl: `${env.WEB_ORIGIN}/forgot-password`,
    },
    to: toRecipient(user),
  });
};

// Better Auth gives the delete confirmation link a fixed 1 day life.
const DELETE_ACCOUNT_EXPIRES_IN_HOURS = 24;
export const FAMILY_INVITE_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

export const sendDeleteAccountVerification = ({
  url,
  user,
}: {
  url: string;
  user: EmailUser;
}) => {
  void notify("delete-account", {
    payload: {
      confirmUrl: url,
      expiresInHours: DELETE_ACCOUNT_EXPIRES_IN_HOURS,
      name: user.name,
    },
    to: toRecipient(user),
  });
};

/** The invitee may not have an account yet, so their email stands in for a user id. */
export const sendFamilyInvite = ({
  email,
  familyName,
  invitationId,
  inviterName,
}: {
  email: string;
  familyName: string;
  invitationId: string;
  inviterName: string;
}) => {
  void notify("family-invite", {
    payload: {
      expiresInDays: FAMILY_INVITE_EXPIRES_IN_SECONDS / (60 * 60 * 24),
      familyName,
      inviteUrl: `${env.WEB_ORIGIN}/accept-invitation/${invitationId}`,
      inviterName,
    },
    to: { email, subscriberId: `invite:${email}` },
  });
};

export const notifyTwoFactorChanged = (
  user: EmailUser,
  state: "off" | "on"
) => {
  void notify("two-factor-changed", {
    payload: {
      changedAt: new Intl.DateTimeFormat("en-GB", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date()),
      name: user.name,
      secureAccountUrl: `${env.WEB_ORIGIN}/forgot-password`,
      state,
    },
    to: toRecipient(user),
  });
};
