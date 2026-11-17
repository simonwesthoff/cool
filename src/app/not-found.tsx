import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LanguageFooter } from "@/components/language-footer";
import { PageMain } from "@/components/page-main";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <div className="flex flex-1 flex-col">
      <PageMain className="justify-center gap-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("text")}</p>
        <Link href="/" className="font-medium underline underline-offset-4">
          {t("home")}
        </Link>
      </PageMain>
      <LanguageFooter />
    </div>
  );
}
