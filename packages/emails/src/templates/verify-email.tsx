import { Heading, Text } from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface VerifyEmailProps {
  /** Optional one-time code. Link-only for now; a code arrives with email OTP later. */
  code?: string;
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
      Hi {name}, welcome.{" "}
      {code
        ? "Enter this code, or use the button below, to verify your email address."
        : "Use the button below to verify your email address."}
    </Text>
    {code ? (
      <EmailCallout label="Verification code" variant="code">
        {code}
      </EmailCallout>
    ) : null}
    <EmailButton href={verifyUrl}>Verify email</EmailButton>
    <Text className="text-muted m-0 text-[13px] leading-[20px]">
      This {code ? "code" : "link"} expires in {expiresInMinutes} minutes. If
      you did not create an account, you can safely ignore this email.
    </Text>
  </EmailLayout>
);

VerifyEmail.PreviewProps = {
  expiresInMinutes: 15,
  name: "Alex",
  verifyUrl: "https://littleprogress.app/verify?token=preview",
} satisfies VerifyEmailProps;

export default VerifyEmail;
