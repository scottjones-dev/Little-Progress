import { Button, Section } from "@react-email/components";
import type { ReactNode } from "react";

interface EmailButtonProps {
  children: ReactNode;
  href: string;
}

export const EmailButton = ({ children, href }: EmailButtonProps) => (
  <Section className="my-6 text-center">
    <Button
      className="bg-gold text-gold-text box-border rounded-[8px] px-[28px] py-[14px] text-[15px] font-semibold no-underline"
      href={href}
    >
      {children}
    </Button>
  </Section>
);
