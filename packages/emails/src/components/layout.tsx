import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components";
import { intlLocale } from "@repo/i18n/format";
import type { ReactNode } from "react";

import { tailwindConfig } from "../lib/tailwind";
import { EmailFooter } from "./footer";
import { EmailHeader } from "./header";

interface EmailLayoutProps {
  children: ReactNode;
  footerReason?: string;
  /** The language of the whole email; English when left out. */
  locale?: string;
  preview: string;
}

export const EmailLayout = ({
  children,
  footerReason,
  locale,
  preview,
}: EmailLayoutProps) => (
  <Tailwind config={tailwindConfig}>
    <Html lang={intlLocale(locale)}>
      <Head>
        <meta content="dark" name="color-scheme" />
        <meta content="dark" name="supported-color-schemes" />
      </Head>
      <Preview>{preview}</Preview>
      <Body className="bg-obsidian m-0 p-0 font-sans">
        <Container className="mx-auto max-w-[560px] px-[16px] py-[32px]">
          <EmailHeader locale={locale} />
          <Container className="border-border bg-surface text-mist max-w-full rounded-[12px] border border-solid px-[28px] py-[28px]">
            {children}
          </Container>
          <EmailFooter locale={locale} reason={footerReason} />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);
