import { Heading, Text } from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface PasswordChangedProps {
  changedAt: string;
  name: string;
  secureAccountUrl: string;
}

export const passwordChangedSubject = () => "Your password was changed";

const PasswordChanged = ({
  changedAt,
  name,
  secureAccountUrl,
}: PasswordChangedProps) => (
  <EmailLayout
    footerReason="This is a security notice about your account."
    preview="Your password was just changed"
  >
    <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
      Password changed
    </Heading>
    <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
      Hi {name}, the password for your account was changed on {changedAt}. All
      other devices have been signed out.
    </Text>
    <EmailCallout label="Was this not you?">
      Secure your account straight away so nobody else can read your
      family&apos;s diary.
    </EmailCallout>
    <EmailButton href={secureAccountUrl}>Secure my account</EmailButton>
  </EmailLayout>
);

PasswordChanged.PreviewProps = {
  changedAt: "1 October 2026, 14:32 BST",
  name: "Alex",
  secureAccountUrl: "https://littleprogress.app/secure-account?token=preview",
} satisfies PasswordChangedProps;

export default PasswordChanged;
