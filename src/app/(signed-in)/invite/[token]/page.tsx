import { Suspense } from "react";
import { AcceptInvitation } from "@/components/invitations/accept-invitation";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { DomainError } from "@/domain/errors";
import { getInvitation, type InvitationInfo } from "@/domain/invitations";
import { requirePageRoles } from "../../current-user";

type Params = PageProps<"/invite/[token]">["params"];

export default function InvitationPage({
  params,
}: PageProps<"/invite/[token]">) {
  return (
    <main className="flex w-full flex-1 flex-col px-4 pb-24">
      <Suspense fallback={<LoadingPlaceholder />}>
        <Invitation params={params} />
      </Suspense>
    </main>
  );
}

export async function Invitation({ params }: { params: Params }) {
  const { token } = await params;
  const { roles } = await requirePageRoles(`/invite/${token}`);
  const info: InvitationInfo | null = await getInvitation(token).catch(
    (error: unknown) => {
      if (error instanceof DomainError && error.kind === "not_found")
        return null;
      throw error;
    },
  );
  return (
    <AcceptInvitation
      token={token}
      info={info}
      alreadyLinked={roles.athlete !== null}
    />
  );
}
