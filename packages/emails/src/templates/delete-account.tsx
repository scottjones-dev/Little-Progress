import { Heading, Text } from "@react-email/components";
import { getT } from "@repo/i18n/core";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";
import { pluralOptions } from "../lib/plural";

export interface DeleteAccountProps {
  confirmUrl: string;
  expiresInHours: number;
  /** The recipient's language; English when left out. */
  locale?: string;
  name: string;
}

export const deleteAccountSubject = ({ locale }: DeleteAccountProps) =>
  getT(locale, "emails")("deleteAccount.subject");

const DeleteAccount = ({
  confirmUrl,
  expiresInHours,
  locale,
  name,
}: DeleteAccountProps) => {
  const t = getT(locale, "emails");

  return (
    <EmailLayout
      footerReason={t("deleteAccount.footerReason")}
      locale={locale}
      preview={t("deleteAccount.preview")}
    >
      <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
        {t("deleteAccount.heading")}
      </Heading>
      <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
        {t("deleteAccount.body", { name })}
      </Text>
      <EmailCallout label={t("deleteAccount.noticeLabel")}>
        {t("deleteAccount.notice")}
      </EmailCallout>
      <EmailButton href={confirmUrl}>{t("deleteAccount.button")}</EmailButton>
      <Text className="text-muted m-0 text-[13px] leading-[20px]">
        {t("deleteAccount.expiry", pluralOptions(expiresInHours))}
      </Text>
    </EmailLayout>
  );
};

DeleteAccount.PreviewProps = {
  confirmUrl: "https://littleprogress.app/delete-account?token=preview",
  expiresInHours: 24,
  name: "Alex",
} satisfies DeleteAccountProps;

export default DeleteAccount;
