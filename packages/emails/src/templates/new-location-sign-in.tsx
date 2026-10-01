import { Heading, Text } from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface NewLocationSignInProps {
  device: string;
  location: string;
  name: string;
  secureAccountUrl: string;
  time: string;
}

export const newLocationSignInSubject = () => "New sign-in from a new location";

const NewLocationSignIn = ({
  device,
  location,
  name,
  secureAccountUrl,
  time,
}: NewLocationSignInProps) => (
  <EmailLayout
    footerReason="This is a security notice about a sign-in to your account."
    preview={`New sign-in from ${location}`}
  >
    <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
      New sign-in from {location}
    </Heading>
    <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
      Hi {name}, we noticed a sign-in to your account from somewhere new.
    </Text>
    <EmailCallout label="Sign-in details">
      Location: {location} (approximate)
      <br />
      Device: {device}
      <br />
      Time: {time}
    </EmailCallout>
    <Text className="text-muted m-0 mb-2 text-[14px] leading-[22px]">
      If this was you, no action is needed. If not, change your password and
      sign out other devices.
    </Text>
    <EmailButton href={secureAccountUrl}>Secure my account</EmailButton>
  </EmailLayout>
);

NewLocationSignIn.PreviewProps = {
  device: "Chrome on Windows",
  location: "Manchester, United Kingdom",
  name: "Alex",
  secureAccountUrl: "https://littleprogress.app/secure-account?token=preview",
  time: "1 October 2026, 14:32 BST",
} satisfies NewLocationSignInProps;

export default NewLocationSignIn;
