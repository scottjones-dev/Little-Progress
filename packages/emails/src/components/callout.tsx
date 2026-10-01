import { Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

interface EmailCalloutProps {
  children: ReactNode;
  label?: string;
  variant?: "code" | "notice";
}

export const EmailCallout = ({
  children,
  label,
  variant = "notice",
}: EmailCalloutProps) => (
  <Section className="border-border bg-obsidian my-6 rounded-[8px] border border-solid px-[20px] py-[16px]">
    {label ? (
      <Text className="text-muted m-0 mb-2 text-[11px] tracking-[2px] uppercase">
        {label}
      </Text>
    ) : null}
    {variant === "code" ? (
      <Text className="text-gold m-0 text-center font-mono text-[32px] font-semibold tracking-[8px]">
        {children}
      </Text>
    ) : (
      <Text className="text-mist m-0 text-[14px] leading-[22px]">
        {children}
      </Text>
    )}
  </Section>
);
