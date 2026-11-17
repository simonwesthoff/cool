import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { InvitationLinkForm } from "@/components/roles/invitation-link-form";
import { requirePageUser } from "../../current-user";
import { PageMain } from "@/components/page-main";

export default function StartAthletePage() {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <StartAthlete />
      </Suspense>
    </PageMain>
  );
}

async function StartAthlete() {
  await requirePageUser("/start/athlete");
  return <InvitationLinkForm />;
}
