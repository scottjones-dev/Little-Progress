import { Heading, Text } from "@react-email/components";
import { getT } from "@repo/i18n/core";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";
import { pluralOptions } from "../lib/plural";

export interface ResetPasswordProps {
  expiresInMinutes: number;
  /** The recipient's language; English when left out. */
  locale?: string;
  name: string;
  resetUrl: string;
}

export const resetPasswordSubject = ({ locale }: ResetPasswordProps) =>
  getT(locale, "emails")("resetPassword.subject");

const ResetPassword = ({
  expiresInMinutes,
  locale,
  name,
  resetUrl,
}: ResetPasswordProps) => {
  const t = getT(locale, "emails");

  return (
    <EmailLayout
      footerReason={t("resetPassword.footerReason")}
      locale={locale}
      preview={t("resetPassword.preview")}
    >
      <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
        {t("resetPassword.heading")}
      </Heading>
      <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
        {t("resetPassword.body", { name })}
      </Text>
      <EmailButton href={resetUrl}>{t("resetPassword.button")}</EmailButton>
      <EmailCallout label={t("resetPassword.noticeLabel")}>
        {t("resetPassword.notice", pluralOptions(expiresInMinutes))}
      </EmailCallout>
    </EmailLayout>
  );
};

ResetPassword.PreviewProps = {
  expiresInMinutes: 30,
  name: "Alex",
  resetUrl: "https://littleprogress.app/reset-password?token=preview",
} satisfies ResetPasswordProps;

export default ResetPassword;
