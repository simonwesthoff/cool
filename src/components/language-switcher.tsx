"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, storeLocaleChoice, type Locale } from "@/i18n/locale";

/**
 * Lets the user switch the UI language. The choice is stored in a cookie on
 * this device and the current page is re-rendered in place.
 */
export function LanguageSwitcher({
  fullWidth = false,
}: {
  /** Two equal halves across the container (user menu). */
  fullWidth?: boolean;
}) {
  const t = useTranslations("LanguageSwitcher");
  const current = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(locale: Locale) {
    if (locale === current) return;
    storeLocaleChoice(locale);
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`rounded-full border border-zinc-300 p-0.5 text-sm dark:border-zinc-700 ${
        fullWidth ? "grid w-full grid-cols-2" : "inline-flex self-start"
      }`}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={locale === current}
          disabled={isPending}
          onClick={() => select(locale)}
          className="min-h-11 min-w-11 rounded-full px-3 aria-pressed:bg-zinc-900 aria-pressed:text-white disabled:opacity-60 dark:aria-pressed:bg-zinc-100 dark:aria-pressed:text-zinc-900"
        >
          {t(locale)}
        </button>
      ))}
    </div>
  );
}
