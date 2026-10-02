import { Link, Section, Text } from "@react-email/components";
import { app } from "@repo/config/app";
import { getT } from "@repo/i18n/core";

interface EmailHeaderProps {
  locale?: string;
}

export const EmailHeader = ({ locale }: EmailHeaderProps) => {
  const t = getT(locale, "common");

  return (
    <Section className="pb-6">
      <Link
        className="text-mist text-[20px] font-bold tracking-tight no-underline"
        href={app.url}
      >
        {app.name}
        <span className="text-gold"> ●</span>
      </Link>
      <Text className="text-muted m-0 mt-1 text-[12px]">{t("tagline")}</Text>
    </Section>
  );
};
