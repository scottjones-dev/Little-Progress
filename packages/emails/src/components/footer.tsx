import { Hr, Link, Section, Text } from "@react-email/components";
import { app } from "@repo/config/app";
import { getT } from "@repo/i18n/core";

import { absoluteUrl } from "../lib/tailwind";

interface EmailFooterProps {
  locale?: string;
  reason?: string;
}

export const EmailFooter = ({ locale, reason }: EmailFooterProps) => {
  const t = getT(locale, "emails");

  return (
    <Section className="pt-6">
      <Hr className="border-border m-0 border-solid" />
      <Text className="text-muted mt-4 mb-2 text-[12px] leading-[18px]">
        {reason ?? t("layout.footerDefault")}
      </Text>
      <Text className="text-muted m-0 text-[12px] leading-[18px]">
        <Link
          className="text-muted underline"
          href={absoluteUrl(app.links.privacy)}
        >
          {t("layout.privacy")}
        </Link>
        {" · "}
        <Link
          className="text-muted underline"
          href={absoluteUrl(app.links.terms)}
        >
          {t("layout.terms")}
        </Link>
        {" · "}
        <Link className="text-muted underline" href={app.links.support}>
          {t("layout.support")}
        </Link>
      </Text>
      <Text className="text-muted mt-2 mb-0 text-[12px] leading-[18px]">
        {t("layout.copyright", { appName: app.name })}
      </Text>
    </Section>
  );
};
