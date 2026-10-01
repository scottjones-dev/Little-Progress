import { Hr, Link, Section, Text } from "@react-email/components";
import { app } from "@repo/config/app";

import { absoluteUrl } from "../lib/tailwind";

interface EmailFooterProps {
  reason?: string;
}

export const EmailFooter = ({
  reason = "You received this email because of activity on your account.",
}: EmailFooterProps) => (
  <Section className="pt-6">
    <Hr className="border-border m-0 border-solid" />
    <Text className="text-muted mt-4 mb-2 text-[12px] leading-[18px]">
      {reason}
    </Text>
    <Text className="text-muted m-0 text-[12px] leading-[18px]">
      <Link
        className="text-muted underline"
        href={absoluteUrl(app.links.privacy)}
      >
        Privacy
      </Link>
      {" · "}
      <Link
        className="text-muted underline"
        href={absoluteUrl(app.links.terms)}
      >
        Terms
      </Link>
      {" · "}
      <Link className="text-muted underline" href={app.links.support}>
        Support
      </Link>
    </Text>
    <Text className="text-muted mt-2 mb-0 text-[12px] leading-[18px]">
      © {app.name}. Built for families, kept private.
    </Text>
  </Section>
);
