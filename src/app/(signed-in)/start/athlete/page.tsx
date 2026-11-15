import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { InvitationLinkForm } from "@/components/roles/invitation-link-form";
import { requirePageUser } from "../../current-user";

export default function StartAthletePage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 pb-24">
      <Suspense fallback={<LoadingPlaceholder />}>
        <StartAthlete />
      </Suspense>
    </main>
  );
}

async function StartAthlete() {
  await requirePageUser("/start/athlete");
  return <InvitationLinkForm />;
}
