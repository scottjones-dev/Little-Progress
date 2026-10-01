import { Heading, Text } from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailCallout } from "../components/callout";
import { EmailLayout } from "../components/layout";

export interface DeleteAccountProps {
  confirmUrl: string;
  expiresInHours: number;
  name: string;
}

export const deleteAccountSubject = () => "Confirm deleting your account";

const DeleteAccount = ({
  confirmUrl,
  expiresInHours,
  name,
}: DeleteAccountProps) => (
  <EmailLayout
    footerReason="You received this email because account deletion was requested."
    preview="Confirm that you want to delete your account"
  >
    <Heading className="text-mist m-0 mb-4 text-[22px] font-semibold">
      Delete your account?
    </Heading>
    <Text className="text-mist m-0 mb-2 text-[15px] leading-[24px]">
      Hi {name}, we received a request to permanently delete your account and
      its data. Confirm below to continue.
    </Text>
    <EmailCallout label="This cannot be undone">
      Your account is removed straight away. Download any reports you need
      first.
    </EmailCallout>
    <EmailButton href={confirmUrl}>Delete my account</EmailButton>
    <Text className="text-muted m-0 text-[13px] leading-[20px]">
      This link expires in {expiresInHours} hours. If you did not ask for this,
      ignore this email and change your password.
    </Text>
  </EmailLayout>
);

DeleteAccount.PreviewProps = {
  confirmUrl: "https://littleprogress.app/delete-account?token=preview",
  expiresInHours: 24,
  name: "Alex",
} satisfies DeleteAccountProps;

export default DeleteAccount;
