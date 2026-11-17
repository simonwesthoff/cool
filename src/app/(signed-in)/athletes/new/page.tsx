import { Suspense } from "react";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { requireCoachPage } from "../../current-user";
import { BackLink } from "@/components/back-link";
import { getTranslations } from "next-intl/server";
import { PageMain } from "@/components/page-main";

export default function NewAthletePage() {
  return (
    <PageMain>
      <Suspense fallback={<LoadingPlaceholder />}>
        <NewAthlete />
      </Suspense>
    </PageMain>
  );
}

async function NewAthlete() {
  await requireCoachPage("/athletes/new");
  const tb = await getTranslations("Back");
  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/" label={tb("athletes")} />
      <AthleteForm />
    </div>
  );
}
