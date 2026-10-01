import { Link, Section, Text } from "@react-email/components";
import { app } from "@repo/config/app";

export const EmailHeader = () => (
  <Section className="pb-6">
    <Link
      className="text-mist text-[20px] font-bold tracking-tight no-underline"
      href={app.url}
    >
      {app.name}
      <span className="text-gold"> ●</span>
    </Link>
    <Text className="text-muted m-0 mt-1 text-[12px]">{app.tagline}</Text>
  </Section>
);
