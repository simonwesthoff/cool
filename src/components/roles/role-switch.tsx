"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** "My Team" / "My training" for users with both roles. */
export function RoleSwitch() {
  const t = useTranslations("RoleSwitch");
  const pathname = usePathname();
  const onTraining = pathname.startsWith("/training");
  const item = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium ${
      active
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
    }`;
  return (
    <nav aria-label={t("label")} className="flex gap-1">
      <Link
        href="/"
        aria-current={onTraining ? undefined : "page"}
        className={item(!onTraining)}
      >
        {t("team")}
      </Link>
      <Link
        href="/training"
        aria-current={onTraining ? "page" : undefined}
        className={item(onTraining)}
      >
        {t("training")}
      </Link>
    </nav>
  );
}
