import { Suspense } from "react";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { InvitationLinkForm } from "@/components/roles/invitation-link-form";
import { requirePageUser } from "../../current-user";
import { BackLink } from "@/components/back-link";
import { getTranslations } from "next-intl/server";
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
  const tb = await getTranslations("Back");
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/" label={tb("start")} />
      <InvitationLinkForm />
    </div>
  );
}
