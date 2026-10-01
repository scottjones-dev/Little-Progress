import { Heading, Text } from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface ResetPasswordProps {
  expiresInMinutes: number;
  name: string;
  resetUrl: string;
}

export const resetPasswordSubject = () => "Reset your password";

const ResetPassword = ({
  expiresInMinutes,
  name,
  resetUrl,
}: ResetPasswordProps) => (
  <EmailLayout
    footerReason="You received this email because a password reset was requested for your account."
    preview="Use this link to choose a new password"
  >
    <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
      Reset your password
    </Heading>
    <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
      Hi {name}, we received a request to reset your password. Choose a new one
      with the button below.
    </Text>
    <EmailButton href={resetUrl}>Choose a new password</EmailButton>
    <EmailCallout label="Did not ask for this?">
      Ignore this email and your password stays the same. The link expires in{" "}
      {expiresInMinutes} minutes and works once.
    </EmailCallout>
  </EmailLayout>
);

ResetPassword.PreviewProps = {
  expiresInMinutes: 30,
  name: "Alex",
  resetUrl: "https://littleprogress.app/reset-password?token=preview",
} satisfies ResetPasswordProps;

export default ResetPassword;
