import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar } from "@/components/avatar";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser, signInUrl } from "@/domain/auth";

/** Placeholder home page until user roles exist (feature 2). */
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader />
      <Suspense fallback={<LoadingPlaceholder />}>
        <Home />
      </Suspense>
    </div>
  );
}

export async function Home() {
  const user = await getCurrentUser(await headers());
  if (!user) redirect(signInUrl("/"));

  const t = await getTranslations("Home");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 pb-24 text-center">
      <Avatar
        name={user.name}
        image={user.image}
        alt={t("pictureAlt", { name: user.name })}
        size={96}
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("signedInAs")}
      </p>
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      <SignOutButton />
    </main>
  );
}
