import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { InvitationPanel } from "@/components/invitations/invitation-panel";
import {
  LinkedAccountSection,
  ThisIsMeButton,
} from "@/components/invitations/link-section";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { getAthlete } from "@/domain/athletes";
import { DomainError } from "@/domain/errors";
import { requireCoachPage } from "../../../current-user";
import { PageMain } from "@/components/page-main";

type Params = PageProps<"/athletes/[id]/basic-data">["params"];

export default function BasicDataPage({
  params,
}: PageProps<"/athletes/[id]/basic-data">) {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <EditAthlete params={params} />
      </Suspense>
    </PageMain>
  );
}

export async function EditAthlete({ params }: { params: Params }) {
  const { id } = await params;
  const { user, roles } = await requireCoachPage(`/athletes/${id}/basic-data`);
  const athlete = await getAthlete(user, id).catch((error: unknown) => {
    if (error instanceof DomainError && error.kind === "not_found") notFound();
    throw error;
  });
  return (
    <div className="flex flex-col gap-8">
      <AthleteForm athlete={athlete} />
      {athlete.linkedAccount ? (
        <LinkedAccountSection
          name={athlete.name}
          account={athlete.linkedAccount}
        />
      ) : (
        <>
          <InvitationPanel athleteId={athlete.id} />
          {!roles.athlete && <ThisIsMeButton athleteId={athlete.id} />}
        </>
      )}
    </div>
  );
}
