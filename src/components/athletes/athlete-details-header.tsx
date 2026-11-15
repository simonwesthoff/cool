import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Athlete } from "@/domain/athletes/basic-data";
import { Avatar } from "../avatar";

/** Header of the athlete details page; leads to the athlete's basic data. */
export function AthleteDetailsHeader({ athlete }: { athlete: Athlete }) {
  const t = useTranslations("AthleteDetails");
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/"
        className="self-start text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        <span aria-hidden="true" className="mr-1">
          ‹
        </span>
        {t("back")}
      </Link>
      <Link
        href={`/athletes/${athlete.id}/basic-data`}
        className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <Avatar
          name={athlete.name}
          image={athlete.linkedAccount?.image ?? null}
          alt={t("pictureAlt", { name: athlete.name })}
          size={112}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-2xl font-semibold break-words">{athlete.name}</h1>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("basicData")}
          </span>
        </span>
        <span aria-hidden="true" className="text-2xl text-zinc-400">
          ›
        </span>
      </Link>
    </div>
  );
}
