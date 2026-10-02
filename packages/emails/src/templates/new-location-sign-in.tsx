import { Heading, Text } from "@react-email/components";
import { getT } from "@repo/i18n/core";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface NewLocationSignInProps {
  device: string;
  /** The recipient's language; English when left out. */
  locale?: string;
  location: string;
  name: string;
  secureAccountUrl: string;
  time: string;
}

export const newLocationSignInSubject = ({ locale }: NewLocationSignInProps) =>
  getT(locale, "emails")("newLocationSignIn.subject");

const NewLocationSignIn = ({
  device,
  locale,
  location,
  name,
  secureAccountUrl,
  time,
}: NewLocationSignInProps) => {
  const t = getT(locale, "emails");

  return (
    <EmailLayout
      footerReason={t("newLocationSignIn.footerReason")}
      locale={locale}
      preview={t("newLocationSignIn.preview", { location })}
    >
      <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
        {t("newLocationSignIn.heading", { location })}
      </Heading>
      <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
        {t("newLocationSignIn.body", { name })}
      </Text>
      <EmailCallout label={t("newLocationSignIn.detailsLabel")}>
        {t("newLocationSignIn.detailsLocation", { location })}
        <br />
        {t("newLocationSignIn.detailsDevice", { device })}
        <br />
        {t("newLocationSignIn.detailsTime", { time })}
      </EmailCallout>
      <Text className="text-muted m-0 mb-2 text-[14px] leading-[22px]">
        {t("newLocationSignIn.advice")}
      </Text>
      <EmailButton href={secureAccountUrl}>
        {t("newLocationSignIn.button")}
      </EmailButton>
    </EmailLayout>
  );
};

NewLocationSignIn.PreviewProps = {
  device: "Chrome on Windows",
  location: "Manchester, United Kingdom",
  name: "Alex",
  secureAccountUrl: "https://littleprogress.app/secure-account?token=preview",
  time: "1 October 2026, 14:32 BST",
} satisfies NewLocationSignInProps;

export default NewLocationSignIn;
