import { Heading, Text } from "@react-email/components";
import { getT } from "@repo/i18n/core";

import { EmailButton } from "../components/button";
import { EmailLayout } from "../components/layout";
import { pluralOptions } from "../lib/plural";

export interface FamilyInviteProps {
  expiresInDays: number;
  familyName: string;
  inviteUrl: string;
  inviterName: string;
  /** The recipient's language; English when left out. */
  locale?: string;
}

export const familyInviteSubject = ({ locale }: FamilyInviteProps) =>
  getT(locale, "emails")("familyInvite.subject");

const FamilyInvite = ({
  expiresInDays,
  familyName,
  inviteUrl,
  inviterName,
  locale,
}: FamilyInviteProps) => {
  const t = getT(locale, "emails");

  return (
    <EmailLayout
      footerReason={t("familyInvite.footerReason")}
      locale={locale}
      preview={t("familyInvite.preview", { familyName, inviterName })}
    >
      <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
        {t("familyInvite.heading", { familyName })}
      </Heading>
      <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
        {t("familyInvite.body", { familyName, inviterName })}
      </Text>
      <EmailButton href={inviteUrl}>{t("familyInvite.button")}</EmailButton>
      <Text className="text-muted m-0 text-[13px] leading-[20px]">
        {t("familyInvite.expiry", {
          ...pluralOptions(expiresInDays),
          inviterName,
        })}
      </Text>
    </EmailLayout>
  );
};

FamilyInvite.PreviewProps = {
  expiresInDays: 7,
  familyName: "The Jones family",
  inviteUrl: "https://littleprogress.app/accept-invitation/preview",
  inviterName: "Sam",
} satisfies FamilyInviteProps;

export default FamilyInvite;
