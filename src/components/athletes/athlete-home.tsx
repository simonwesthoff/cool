import { useTranslations } from "next-intl";
import Link from "next/link";
import type {
  ExerciseWeeks,
  Macrocycle,
} from "@/domain/macrocycles/macrocycle-types";
import type { TrainingWeeks } from "@/domain/week-plans/week-plan-types";
import { Avatar } from "../avatar";
import { BackLink } from "../back-link";
import { ExerciseChart } from "../macrocycles/exercise-chart";
import { TrainingWeekSection } from "./training-week-section";

export type AthleteHomeMacrocycle = {
  macrocycle: Pick<
    Macrocycle,
    "weeks" | "mesocycles" | "competitionDate" | "competitionType"
  >;
  /** Planned snatch values for every week (the chart's default curve). */
  values: ExerciseWeeks;
  /** Today (YYYY-MM-DD) for the current-week line. */
  today: string;
};

type Props = {
  /** Who looks at the page: the athlete themselves or their coach. */
  viewer: "athlete" | "coach";
  athleteId: string;
  name: string;
  image: string | null;
  coachName: string;
  /** Whether the user may change the athlete's data and planning. */
  canEdit: boolean;
  /** The planned macrocycle with the chart data, or null. */
  macrocycle: AthleteHomeMacrocycle | null;
  /** Entry points of the week planning; only for whoever may plan. */
  trainingWeeks?: TrainingWeeks | null;
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

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/**
 * The athlete's page, shared by "My training" (athlete) and the athlete
 * details page (coach): picture, name and coach on top, then the
 * macrocycle chart with a button to the macrocycle view.
 * The coach view adds the way back; whoever may change the athlete (the
 * coach of the Team, also on their own "My training") gets the pencil for
 * the basic data and "Plan macrocycle".
 */
export function AthleteHome({
  viewer,
  athleteId,
  name,
  image,
  coachName,
  canEdit,
  macrocycle,
  trainingWeeks,
}: Props) {
  const t = useTranslations("AthleteHome");
  const tb = useTranslations("Back");
  const coach = viewer === "coach";
  const macrocycleHref = coach
    ? `/athletes/${athleteId}/macrocycle`
    : "/training/macrocycle";

  return (
    <div className="flex w-full flex-col gap-3">
      {coach && <BackLink href="/" label={tb("athletes")} />}
      <section
        className={`flex flex-col items-center gap-3 text-center ${coach ? "pt-4" : "pt-12"}`}
      >
        <Avatar
          name={name}
          image={image}
          alt={t("pictureAlt", { name })}
          size={96}
        />
        <div className="flex items-center gap-2">
          {/* Same width as the pencil, so the name stays centred. */}
          {canEdit && <span aria-hidden="true" className="size-11 shrink-0" />}
          <h1 className="text-2xl font-semibold break-words">{name}</h1>
          {canEdit && (
            <Link
              href={`/athletes/${athleteId}/basic-data`}
              aria-label={t("editBasicData")}
              title={t("editBasicData")}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              <PencilIcon />
            </Link>
          )}
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("coach", { name: coachName })}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {coach ? t("placeholderCoach") : t("placeholder")}
        </p>
      </section>
      {macrocycle ? (
        // The macrocycle section is the macrocycle view's chart (snatch,
        // best value) with the way to the full view below it.
        <section
          aria-labelledby="macrocycle-heading"
          className="mt-4 flex flex-col gap-3"
        >
          <h2 id="macrocycle-heading" className="sr-only">
            {t("macrocycle")}
          </h2>
          <ExerciseChart
            weeks={macrocycle.macrocycle.weeks}
            mesocycles={macrocycle.macrocycle.mesocycles}
            values={macrocycle.values.weeks}
            value="bestKg"
            competition={{
              date: macrocycle.macrocycle.competitionDate,
              type: macrocycle.macrocycle.competitionType,
            }}
            today={macrocycle.today}
          />
          <Link
            href={macrocycleHref}
            className="self-end text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            {t("macrocycleOpen")}
            <span aria-hidden="true" className="ml-1">
              ›
            </span>
          </Link>
        </section>
      ) : (
        canEdit && (
          <Link
            href={`/athletes/${athleteId}/macrocycle/base-data`}
            className={`mt-4 ${card}`}
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
      {canEdit && macrocycle && trainingWeeks && (
        <TrainingWeekSection athleteId={athleteId} weeks={trainingWeeks} />
      )}
    </div>
  );
}
