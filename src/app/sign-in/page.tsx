import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { signInErrorKind } from "@/components/auth/sign-in-error";
import { LoadingPlaceholder } from "@/components/loading-placeholder";
import { getCurrentUser, safeReturnPath, signInUrl } from "@/domain/auth";

type SearchParams = PageProps<"/sign-in">["searchParams"];

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<LoadingPlaceholder />}>
        <SignIn searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

export async function SignIn({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const returnPath = safeReturnPath(first(params.returnTo));

  if (await getCurrentUser(await headers())) redirect(returnPath);

  const t = await getTranslations();
  const error = signInErrorKind(first(params.error));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">
          {t("App.name")}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {t("SignIn.tagline")}
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {error === "cancelled"
            ? t("SignIn.errorCancelled")
            : t("SignIn.errorFailed")}
        </p>
      )}
      <GoogleSignInButton
        returnPath={returnPath}
        errorPath={signInUrl(returnPath)}
      />
    </main>
  );
}
