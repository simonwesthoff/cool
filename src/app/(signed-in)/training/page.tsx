import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { requirePageRoles } from "../current-user";

/** Athlete view (placeholder until athlete details and basic data exist). */
export default function TrainingPage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 pb-24">
      <Suspense fallback={<LoadingPlaceholder />}>
        <Training />
      </Suspense>
    </main>
  );
}

export async function Training() {
  const { user, roles } = await requirePageRoles("/training");
  if (!roles.athlete) redirect("/");
  const t = await getTranslations("Training");
  return (
    <section className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 pt-12 text-center">
      <Avatar
        name={roles.athlete.athleteName}
        image={user.image}
        alt={t("pictureAlt", { name: roles.athlete.athleteName })}
        size={96}
      />
      <h1 className="text-2xl font-semibold">{roles.athlete.athleteName}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {t("coach", { name: roles.athlete.coachName })}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("placeholder")}
      </p>
    </section>
  );
}
