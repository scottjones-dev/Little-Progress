import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components";
import { app } from "@repo/config/app";
import type { ReactNode } from "react";

import { tailwindConfig } from "../lib/tailwind";
import { EmailFooter } from "./footer";
import { EmailHeader } from "./header";

interface EmailLayoutProps {
  children: ReactNode;
  footerReason?: string;
  preview: string;
}

export const EmailLayout = ({
  children,
  footerReason,
  preview,
}: EmailLayoutProps) => (
  <Tailwind config={tailwindConfig}>
    <Html lang={app.locale}>
      <Head>
        <meta content="dark" name="color-scheme" />
        <meta content="dark" name="supported-color-schemes" />
      </Head>
      <Preview>{preview}</Preview>
      <Body className="bg-obsidian m-0 p-0 font-sans">
        <Container className="mx-auto max-w-[560px] px-[16px] py-[32px]">
          <EmailHeader />
          <Container className="border-border bg-surface text-mist max-w-full rounded-[12px] border border-solid px-[28px] py-[28px]">
            {children}
          </Container>
          <EmailFooter reason={footerReason} />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);
