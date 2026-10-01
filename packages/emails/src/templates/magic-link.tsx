import { Heading, Text } from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailLayout } from "../components/layout";

export interface MagicLinkProps {
  expiresInMinutes: number;
  name: string;
  signInUrl: string;
}

export const magicLinkSubject = () => "Your sign-in link";

const MagicLink = ({ expiresInMinutes, name, signInUrl }: MagicLinkProps) => (
  <EmailLayout
    footerReason="You received this email because a sign-in link was requested for your account."
    preview="Tap to sign in. No password needed"
  >
    <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
      Sign in without a password
    </Heading>
    <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
      Hi {name}, use the button below to sign in. The link works once and
      expires in {expiresInMinutes} minutes.
    </Text>
    <EmailButton href={signInUrl}>Sign in</EmailButton>
    <Text className="text-muted m-0 text-[13px] leading-[20px]">
      If you did not request this, you can ignore this email. Nobody can sign in
      without access to your inbox.
    </Text>
  </EmailLayout>
);

MagicLink.PreviewProps = {
  expiresInMinutes: 10,
  name: "Alex",
  signInUrl: "https://littleprogress.app/magic-link?token=preview",
} satisfies MagicLinkProps;

export default MagicLink;
