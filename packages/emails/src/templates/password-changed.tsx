import { Heading, Text } from "@react-email/components";
import { getT } from "@repo/i18n/core";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface PasswordChangedProps {
  changedAt: string;
  /** The recipient's language; English when left out. */
  locale?: string;
  name: string;
  secureAccountUrl: string;
}

export const passwordChangedSubject = ({ locale }: PasswordChangedProps) =>
  getT(locale, "emails")("passwordChanged.subject");

const PasswordChanged = ({
  changedAt,
  locale,
  name,
  secureAccountUrl,
}: PasswordChangedProps) => {
  const t = getT(locale, "emails");

  return (
    <EmailLayout
      footerReason={t("passwordChanged.footerReason")}
      locale={locale}
      preview={t("passwordChanged.preview")}
    >
      <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
        {t("passwordChanged.heading")}
      </Heading>
      <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
        {t("passwordChanged.body", { changedAt, name })}
      </Text>
      <EmailCallout label={t("passwordChanged.noticeLabel")}>
        {t("passwordChanged.notice")}
      </EmailCallout>
      <EmailButton href={secureAccountUrl}>
        {t("passwordChanged.button")}
      </EmailButton>
    </EmailLayout>
  );
};

PasswordChanged.PreviewProps = {
  changedAt: "1 October 2026, 14:32 BST",
  name: "Alex",
  secureAccountUrl: "https://littleprogress.app/secure-account?token=preview",
} satisfies PasswordChangedProps;

export default PasswordChanged;
