import { Heading, Text } from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailLayout } from "../components/layout";

export interface FamilyInviteProps {
  expiresInDays: number;
  familyName: string;
  inviteUrl: string;
  inviterName: string;
}

export const familyInviteSubject = () => "You have been invited to a family";

const FamilyInvite = ({
  expiresInDays,
  familyName,
  inviteUrl,
  inviterName,
}: FamilyInviteProps) => (
  <EmailLayout
    footerReason="You received this email because someone invited this address to a family diary."
    preview={`${inviterName} invited you to ${familyName}`}
  >
    <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
      Join {familyName}
    </Heading>
    <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
      {inviterName} has invited you to share the care diary for {familyName}.
      You will be able to log meals, sleep and milestones together.
    </Text>
    <EmailButton href={inviteUrl}>Accept invitation</EmailButton>
    <Text className="text-muted m-0 text-[13px] leading-[20px]">
      This invitation expires in {expiresInDays} days. If you do not know{" "}
      {inviterName}, ignore this email.
    </Text>
  </EmailLayout>
);

FamilyInvite.PreviewProps = {
  expiresInDays: 7,
  familyName: "The Jones family",
  inviteUrl: "https://littleprogress.app/accept-invitation/preview",
  inviterName: "Sam",
} satisfies FamilyInviteProps;

export default FamilyInvite;
