import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import type { MacrocycleBaseData } from "@/domain/macrocycles/macrocycle-types";
import { Avatar } from "../avatar";

function addDays(isoDate: string, days: number): Date {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

type Props = {
  /** Who looks at the page: the athlete themselves or their coach. */
  viewer: "athlete" | "coach";
  athleteId: string;
  name: string;
  image: string | null;
  coachName: string;
  macrocycle: Pick<
    MacrocycleBaseData,
    "startDate" | "durationWeeks" | "competitionDate" | "competitionType"
  > | null;
};

const card =
  "flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-4 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900";

function Chevron() {
  return (
    <span aria-hidden="true" className="text-2xl text-zinc-400">
      ›
    </span>
  );
}

/**
 * The athlete's page, shared by "My training" (athlete) and the athlete
 * details page (coach): picture, name and coach on top, then link cards.
 * The coach additionally gets the way back, the basic data and planning.
 */
export function AthleteHome({
  viewer,
  athleteId,
  name,
  image,
  coachName,
  macrocycle,
}: Props) {
  const t = useTranslations("AthleteHome");
  const format = useFormatter();
  const date = (value: Date) =>
    format.dateTime(value, { dateStyle: "medium", timeZone: "UTC" });
  const coach = viewer === "coach";
  const macrocycleHref = coach
    ? `/athletes/${athleteId}/macrocycle`
    : "/training/macrocycle";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
      {coach && (
        <Link
          href="/"
          className="self-start text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          <span aria-hidden="true" className="mr-1">
            ‹
          </span>
          {t("back")}
        </Link>
      )}
      <section
        className={`flex flex-col items-center gap-3 text-center ${coach ? "pt-4" : "pt-12"}`}
      >
        <Avatar
          name={name}
          image={image}
          alt={t("pictureAlt", { name })}
          size={96}
        />
        <h1 className="text-2xl font-semibold break-words">{name}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("coach", { name: coachName })}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {coach ? t("placeholderCoach") : t("placeholder")}
        </p>
      </section>
      <nav aria-label={t("sections")} className="mt-4 flex flex-col gap-3">
        {macrocycle ? (
          <Link
            href={macrocycleHref}
            aria-label={t("macrocycleOpen")}
            className={card}
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-semibold">{t("macrocycle")}</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("period", {
                  start: date(addDays(macrocycle.startDate, 0)),
                  end: date(
                    addDays(
                      macrocycle.startDate,
                      7 * macrocycle.durationWeeks - 1,
                    ),
                  ),
                })}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("competition", {
                  type: macrocycle.competitionType,
                  date: date(addDays(macrocycle.competitionDate, 0)),
                })}
              </span>
            </span>
            <Chevron />
          </Link>
        ) : (
          coach && (
            <Link
              href={`/athletes/${athleteId}/macrocycle/base-data`}
              className={card}
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-semibold">{t("plan")}</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t("notPlanned")}
                </span>
              </span>
              <Chevron />
            </Link>
          )
        )}
        {coach && (
          <Link href={`/athletes/${athleteId}/basic-data`} className={card}>
            <span className="font-semibold">{t("basicData")}</span>
            <Chevron />
          </Link>
        )}
      </nav>
    </div>
  );
}
