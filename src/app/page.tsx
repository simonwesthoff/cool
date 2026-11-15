import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function Home() {
  const t = await getTranslations();
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex justify-end px-4 py-3 sm:px-8">
        <LanguageSwitcher />
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-4 pb-24 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          {t("App.name")}
        </h1>
        <p className="text-lg text-zinc-600 sm:text-xl dark:text-zinc-400">
          {t("Home.tagline")}
        </p>
      </main>
    </div>
  );
}
