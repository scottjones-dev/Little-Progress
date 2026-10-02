import { Heading, Text } from "@react-email/components";
import { getT } from "@repo/i18n/core";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface TwoFactorChangedProps {
  changedAt: string;
  /** The recipient's language; English when left out. */
  locale?: string;
  name: string;
  secureAccountUrl: string;
  /** "on" when two-factor was turned on, "off" when it was turned off (the event schema enforces this). */
  state: string;
}

type EmailsT = ReturnType<typeof getT<"emails">>;

/**
 * "on" and "off" are words in the person's language. Anything else (a placeholder token in
 * the HTML build) is shown as it is.
 */
const wordForState = (state: string, t: EmailsT) => {
  if (state === "on") {
    return t("twoFactorChanged.stateOn");
  }
  if (state === "off") {
    return t("twoFactorChanged.stateOff");
  }
  return state;
};

export const twoFactorChangedSubject = ({ locale }: TwoFactorChangedProps) =>
  getT(locale, "emails")("twoFactorChanged.subject");

const TwoFactorChanged = ({
  changedAt,
  locale,
  name,
  secureAccountUrl,
  state,
}: TwoFactorChangedProps) => {
  const t = getT(locale, "emails");
  const stateWord = wordForState(state, t);

  return (
    <EmailLayout
      footerReason={t("twoFactorChanged.footerReason")}
      locale={locale}
      preview={t("twoFactorChanged.preview", { state: stateWord })}
    >
      <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
        {t("twoFactorChanged.heading", { state: stateWord })}
      </Heading>
      <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
        {t("twoFactorChanged.body", { changedAt, name, state: stateWord })}
      </Text>
      <EmailCallout label={t("twoFactorChanged.noticeLabel")}>
        {t("twoFactorChanged.notice")}
      </EmailCallout>
      <EmailButton href={secureAccountUrl}>
        {t("twoFactorChanged.button")}
      </EmailButton>
    </EmailLayout>
  );
};

TwoFactorChanged.PreviewProps = {
  changedAt: "1 October 2026, 14:32",
  name: "Alex",
  secureAccountUrl: "https://littleprogress.app/forgot-password",
  state: "on",
} satisfies TwoFactorChangedProps;

export default TwoFactorChanged;
