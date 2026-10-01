import { Heading, Text } from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface VerifyEmailProps {
  code: string;
  expiresInMinutes: number;
  name: string;
  verifyUrl: string;
}

export const verifyEmailSubject = () => "Verify your email address";

const VerifyEmail = ({
  code,
  expiresInMinutes,
  name,
  verifyUrl,
}: VerifyEmailProps) => (
  <EmailLayout
    footerReason="You received this email because someone signed up with this address."
    preview="Confirm your email to finish setting up your account"
  >
    <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
      Confirm your email
    </Heading>
    <Text className="text-mist m-0 mb-4 text-[15px] leading-[24px]">
      Hi {name}, welcome. Enter this code, or use the button below, to verify
      your email address.
    </Text>
    <EmailCallout label="Verification code" variant="code">
      {code}
    </EmailCallout>
    <EmailButton href={verifyUrl}>Verify email</EmailButton>
    <Text className="text-muted m-0 text-[13px] leading-[20px]">
      This code expires in {expiresInMinutes} minutes. If you did not create an
      account, you can safely ignore this email.
    </Text>
  </EmailLayout>
);

VerifyEmail.PreviewProps = {
  code: "482 913",
  expiresInMinutes: 15,
  name: "Alex",
  verifyUrl: "https://littleprogress.app/verify?token=preview",
} satisfies VerifyEmailProps;

export default VerifyEmail;
