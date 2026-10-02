import { Heading, Text } from "@react-email/components";
import { getT } from "@repo/i18n/core";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";
import { pluralOptions } from "../lib/plural";

export interface VerifyEmailProps {
  /** Optional one-time code. Link-only for now; a code arrives with email OTP later. */
  code?: string;
  expiresInMinutes: number;
  /** The recipient's language; English when left out. */
  locale?: string;
  name: string;
  verifyUrl: string;
}

export const verifyEmailSubject = ({ locale }: VerifyEmailProps) =>
  getT(locale, "emails")("verifyEmail.subject");

const VerifyEmail = ({
  code,
  expiresInMinutes,
  locale,
  name,
  verifyUrl,
}: VerifyEmailProps) => {
  const t = getT(locale, "emails");

  return (
    <EmailLayout
      footerReason={t("verifyEmail.footerReason")}
      locale={locale}
      preview={t("verifyEmail.preview")}
    >
      <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
        {t("verifyEmail.heading")}
      </Heading>
      <Text className="text-mist m-0 mb-4 text-[15px] leading-[24px]">
        {code
          ? t("verifyEmail.bodyWithCode", { name })
          : t("verifyEmail.bodyLinkOnly", { name })}
      </Text>
      {code ? (
        <EmailCallout label={t("verifyEmail.codeLabel")} variant="code">
          {code}
        </EmailCallout>
      ) : null}
      <EmailButton href={verifyUrl}>{t("verifyEmail.button")}</EmailButton>
      <Text className="text-muted m-0 text-[13px] leading-[20px]">
        {code
          ? t("verifyEmail.expiryCode", pluralOptions(expiresInMinutes))
          : t("verifyEmail.expiryLink", pluralOptions(expiresInMinutes))}
      </Text>
    </EmailLayout>
  );
};

VerifyEmail.PreviewProps = {
  expiresInMinutes: 15,
  name: "Alex",
  verifyUrl: "https://littleprogress.app/verify?token=preview",
} satisfies VerifyEmailProps;

export default VerifyEmail;
