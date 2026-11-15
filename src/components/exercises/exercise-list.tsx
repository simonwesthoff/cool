import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  localized,
  type ExerciseGroup,
} from "@/domain/exercises/catalog-types";

/** The exercise catalog: one block per exercise group with its exercises. */
export function ExerciseList({ groups }: { groups: ExerciseGroup[] }) {
  const t = useTranslations("Catalog");
  const format = useFormatter();
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {groups.map((group) => {
        const headingId = `exercise-group-${group.number}`;
        return (
          <section
            key={group.number}
            aria-labelledby={headingId}
            className="flex flex-col gap-2"
          >
            <h2 id={headingId} className="text-lg font-semibold">
              {group.code}
              {" · "}
              {localized(group.name, locale)}
            </h2>
            <ul
              aria-labelledby={headingId}
              className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
            >
              {group.exercises.map((exercise) => (
                <li key={exercise.number}>
                  <Link
                    href={`/exercises/${exercise.number}`}
                    className="grid min-h-12 grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <span className="text-sm text-zinc-500 tabular-nums">
                      {exercise.number}
                    </span>
                    <span className="min-w-0 break-words">
                      {localized(exercise.name, locale)}
                    </span>
                    <span className="text-right text-sm tabular-nums">
                      {exercise.bestValuePct === null ? (
                        <span aria-label={t("notDefined")}>–</span>
                      ) : (
                        <>
                          <span className="sr-only">{t("bestValue")} </span>
                          {format.number(exercise.bestValuePct / 100, {
                            style: "percent",
                            maximumFractionDigits: 1,
                          })}
                        </>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
