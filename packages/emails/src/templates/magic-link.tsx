import { Heading, Text } from "@react-email/components";
import { getT } from "@repo/i18n/core";

import { EmailButton } from "../components/button";
import { EmailLayout } from "../components/layout";
import { pluralOptions } from "../lib/plural";

export interface MagicLinkProps {
  expiresInMinutes: number;
  /** The recipient's language; English when left out. */
  locale?: string;
  name: string;
  signInUrl: string;
}

export const magicLinkSubject = ({ locale }: MagicLinkProps) =>
  getT(locale, "emails")("magicLink.subject");

const MagicLink = ({
  expiresInMinutes,
  locale,
  name,
  signInUrl,
}: MagicLinkProps) => {
  const t = getT(locale, "emails");

  return (
    <EmailLayout
      footerReason={t("magicLink.footerReason")}
      locale={locale}
      preview={t("magicLink.preview")}
    >
      <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
        {t("magicLink.heading")}
      </Heading>
      <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
        {t("magicLink.body", { ...pluralOptions(expiresInMinutes), name })}
      </Text>
      <EmailButton href={signInUrl}>{t("magicLink.button")}</EmailButton>
      <Text className="text-muted m-0 text-[13px] leading-[20px]">
        {t("magicLink.notice")}
      </Text>
    </EmailLayout>
  );
};

MagicLink.PreviewProps = {
  expiresInMinutes: 10,
  name: "Alex",
  signInUrl: "https://littleprogress.app/magic-link?token=preview",
} satisfies MagicLinkProps;

export default MagicLink;
