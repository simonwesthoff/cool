"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavigationRoles = { coach: boolean; athlete: boolean };

type Tab = {
  key: "athletes" | "training" | "exercises";
  href: string;
  active: boolean;
};

/** The tabs a user sees, depending on their roles and the current path. */
export function navigationTabs(
  roles: NavigationRoles,
  pathname: string,
): Tab[] {
  const tabs: Tab[] = [];
  if (roles.coach) {
    tabs.push({
      key: "athletes",
      href: "/",
      active: pathname === "/" || pathname.startsWith("/athletes"),
    });
  }
  if (roles.athlete) {
    tabs.push({
      key: "training",
      href: "/training",
      active: pathname.startsWith("/training"),
    });
  }
  tabs.push({
    key: "exercises",
    href: "/exercises",
    active: pathname.startsWith("/exercises"),
  });
  return tabs;
}

/**
 * App navigation: tabs in the header from the `sm` breakpoint up
 * (`placement="header"`) and a fixed bar at the bottom on phones
 * (`placement="bottom"`).
 */
export function AppNavigation({
  roles,
  placement,
}: {
  roles: NavigationRoles;
  placement: "header" | "bottom";
}) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const tabs = navigationTabs(roles, pathname);

  if (placement === "bottom") {
    return (
      <nav
        aria-label={t("label")}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
      >
        <ul className="flex">
          {tabs.map((tab) => (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={tab.active ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center text-sm font-medium ${
                  tab.active
                    ? "text-zinc-900 underline decoration-2 underline-offset-8 dark:text-zinc-100"
                    : "text-zinc-500"
                }`}
              >
                {t(tab.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={t("label")} className="hidden sm:block">
      <ul className="flex gap-1">
        {tabs.map((tab) => (
          <li key={tab.key}>
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${
                tab.active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              {t(tab.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
