import { Heading, Text } from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface TwoFactorChangedProps {
  changedAt: string;
  /** "on" when two-factor was turned on, "off" when it was turned off (the event schema enforces this). */
  state: string;
  name: string;
  secureAccountUrl: string;
}

export const twoFactorChangedSubject = () =>
  "Two-factor authentication was changed";

const TwoFactorChanged = ({
  changedAt,
  name,
  secureAccountUrl,
  state,
}: TwoFactorChangedProps) => (
  <EmailLayout
    footerReason="This is a security notice about your account."
    preview={`Two-factor authentication was turned ${state}`}
  >
    <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
      Two-factor turned {state}
    </Heading>
    <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
      Hi {name}, two-factor authentication on your account was turned {state} on{" "}
      {changedAt}.
    </Text>
    <EmailCallout label="Was this not you?">
      Change your password straight away so nobody else can sign in.
    </EmailCallout>
    <EmailButton href={secureAccountUrl}>Secure my account</EmailButton>
  </EmailLayout>
);

TwoFactorChanged.PreviewProps = {
  changedAt: "1 October 2026, 14:32",
  name: "Alex",
  secureAccountUrl: "https://littleprogress.app/forgot-password",
  state: "on",
} satisfies TwoFactorChangedProps;

export default TwoFactorChanged;
