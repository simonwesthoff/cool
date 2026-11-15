import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Athlete } from "@/domain/athletes";

/** The coach's athletes by name (placeholder until the athlete overview). */
export function AthleteList({ athletes }: { athletes: Athlete[] }) {
  const t = useTranslations("Athletes");
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link
          href="/athletes/new"
          className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t("add")}
        </Link>
      </div>
      {athletes.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {athletes.map((athlete) => (
            <li key={athlete.id}>
              <Link
                href={`/athletes/${athlete.id}`}
                className="flex min-h-12 items-center px-1 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                {athlete.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
