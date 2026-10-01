import { createElement } from "react";
import type { ComponentType } from "react";

import { renderElement } from "./render";
import type { RenderedEmail } from "./render";
import DeleteAccount, {
  deleteAccountSubject,
} from "./templates/delete-account";
import type { DeleteAccountProps } from "./templates/delete-account";
import FamilyInvite, { familyInviteSubject } from "./templates/family-invite";
import type { FamilyInviteProps } from "./templates/family-invite";
import MagicLink, { magicLinkSubject } from "./templates/magic-link";
import type { MagicLinkProps } from "./templates/magic-link";
import NewLocationSignIn, {
  newLocationSignInSubject,
} from "./templates/new-location-sign-in";
import type { NewLocationSignInProps } from "./templates/new-location-sign-in";
import PasswordChanged, {
  passwordChangedSubject,
} from "./templates/password-changed";
import type { PasswordChangedProps } from "./templates/password-changed";
import ResetPassword, {
  resetPasswordSubject,
} from "./templates/reset-password";
import type { ResetPasswordProps } from "./templates/reset-password";
import TwoFactorChanged, {
  twoFactorChangedSubject,
} from "./templates/two-factor-changed";
import type { TwoFactorChangedProps } from "./templates/two-factor-changed";
import VerifyEmail, { verifyEmailSubject } from "./templates/verify-email";
import type { VerifyEmailProps } from "./templates/verify-email";

export interface EmailPropsMap {
  "delete-account": DeleteAccountProps;
  "family-invite": FamilyInviteProps;
  "magic-link": MagicLinkProps;
  "new-location-sign-in": NewLocationSignInProps;
  "password-changed": PasswordChangedProps;
  "reset-password": ResetPasswordProps;
  "two-factor-changed": TwoFactorChangedProps;
  "verify-email": VerifyEmailProps;
}

export type EmailId = keyof EmailPropsMap;

export interface EmailEntry<P extends object> {
  id: string;
  previewProps: P;
  render: (props: P) => Promise<RenderedEmail>;
  renderPreview: () => Promise<RenderedEmail>;
  renderWithTokens: (token: (key: string) => string) => Promise<RenderedEmail>;
  subject: (props: P) => string;
  variables: string[];
}

export type EmailRegistry = {
  [K in EmailId]: EmailEntry<EmailPropsMap[K]>;
};

const define = <P extends object>(entry: {
  component: ComponentType<P>;
  id: string;
  previewProps: P;
  subject: (props: P) => string;
}): EmailEntry<P> => {
  const render = (props: P) =>
    renderElement(createElement(entry.component, props), entry.subject(props));
  const variables = Object.keys(entry.previewProps);

  return {
    id: entry.id,
    previewProps: entry.previewProps,
    render,
    renderPreview: () => render(entry.previewProps),
    renderWithTokens: (token) => {
      // SAFETY: every prop is replaced by a string placeholder purely to produce a variable-token template; the result is never used as typed data.
      const props = Object.fromEntries(
        variables.map((key) => [key, token(key)])
      ) as P;
      return render(props);
    },
    subject: entry.subject,
    variables,
  };
};

export const registry = {
  "delete-account": define({
    component: DeleteAccount,
    id: "delete-account",
    previewProps: DeleteAccount.PreviewProps,
    subject: deleteAccountSubject,
  }),
  "family-invite": define({
    component: FamilyInvite,
    id: "family-invite",
    previewProps: FamilyInvite.PreviewProps,
    subject: familyInviteSubject,
  }),
  "magic-link": define({
    component: MagicLink,
    id: "magic-link",
    previewProps: MagicLink.PreviewProps,
    subject: magicLinkSubject,
  }),
  "new-location-sign-in": define({
    component: NewLocationSignIn,
    id: "new-location-sign-in",
    previewProps: NewLocationSignIn.PreviewProps,
    subject: newLocationSignInSubject,
  }),
  "password-changed": define({
    component: PasswordChanged,
    id: "password-changed",
    previewProps: PasswordChanged.PreviewProps,
    subject: passwordChangedSubject,
  }),
  "reset-password": define({
    component: ResetPassword,
    id: "reset-password",
    previewProps: ResetPassword.PreviewProps,
    subject: resetPasswordSubject,
  }),
  "two-factor-changed": define({
    component: TwoFactorChanged,
    id: "two-factor-changed",
    previewProps: TwoFactorChanged.PreviewProps,
    subject: twoFactorChangedSubject,
  }),
  "verify-email": define({
    component: VerifyEmail,
    id: "verify-email",
    previewProps: VerifyEmail.PreviewProps,
    subject: verifyEmailSubject,
  }),
} satisfies EmailRegistry;

// SAFETY: the registry is declared with exactly the EmailId keys (enforced by `satisfies` above).
export const emailIds = Object.keys(registry) as EmailId[];

const entries: EmailRegistry = registry;

export const renderEmail = <Id extends EmailId>(
  id: Id,
  props: EmailPropsMap[Id]
) => entries[id].render(props);
