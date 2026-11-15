import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  localized,
  type ExerciseGroup,
} from "@/domain/exercises/catalog-types";

/** The exercise catalog: number, name, group and best value per exercise. */
export function ExerciseList({ groups }: { groups: ExerciseGroup[] }) {
  const t = useTranslations("Catalog");
  const format = useFormatter();
  const locale = useLocale();
  const rows = groups.flatMap((group) =>
    group.exercises.map((exercise) => ({ group, exercise })),
  );

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div
        aria-hidden="true"
        className="grid grid-cols-[2.5rem_1fr_auto_4rem] gap-3 border-b border-zinc-200 px-2 pb-2 text-xs font-medium text-zinc-500 md:grid-cols-[2.5rem_1fr_16rem_5rem] dark:border-zinc-800"
      >
        <span>{t("number")}</span>
        <span>{t("exercise")}</span>
        <span>{t("group")}</span>
        <span className="text-right">{t("bestValue")}</span>
      </div>
      <ul
        aria-label={t("title")}
        className="-mt-4 divide-y divide-zinc-200 dark:divide-zinc-800"
      >
        {rows.map(({ group, exercise }) => (
          <li key={exercise.number}>
            <Link
              href={`/exercises/${exercise.number}`}
              className="grid min-h-12 grid-cols-[2.5rem_1fr_auto_4rem] items-center gap-3 px-2 py-2 hover:bg-zinc-50 md:grid-cols-[2.5rem_1fr_16rem_5rem] dark:hover:bg-zinc-900"
            >
              <span className="text-sm text-zinc-500 tabular-nums">
                {exercise.number}
              </span>
              <span className="min-w-0 break-words">
                {localized(exercise.name, locale)}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                <span>{group.code}</span>
                <span className="hidden md:inline">
                  {" · "}
                  {localized(group.name, locale)}
                </span>
              </span>
              <span className="text-right text-sm tabular-nums">
                {exercise.bestValuePct === null ? (
                  <span aria-label={t("notDefined")}>–</span>
                ) : (
                  format.number(exercise.bestValuePct / 100, {
                    style: "percent",
                    maximumFractionDigits: 1,
                  })
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
