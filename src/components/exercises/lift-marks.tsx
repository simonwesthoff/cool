"use client";

import { useTranslations } from "next-intl";
import type { LiftCategory } from "@/domain/exercises/catalog-types";

/** The category colours (user decision), the same in light and dark mode. */
export const LIFT_COLOR: Record<LiftCategory, string> = {
  snatch: "var(--lift-snatch)",
  clean: "var(--lift-clean)",
  jerk: "var(--lift-jerk)",
};

/**
 * One small coloured dot per lift category, before an exercise's name. The
 * dots show their category's name on hover; screen readers hear the names
 * once as a prefix ("Clean, Jerk: 3 Clean and jerk"). Exercises without a
 * category have no mark.
 */
export function LiftMarks({ categories }: { categories: LiftCategory[] }) {
  const t = useTranslations("Catalog.categories");
  const tc = useTranslations("Catalog");
  if (categories.length === 0) return null;
  return (
    <span data-lift-marks className="inline-flex shrink-0 items-center gap-0.5">
      <span className="sr-only">
        {tc("liftPrefix", { names: categories.map((c) => t(c)).join(", ") })}
      </span>
      {categories.map((category) => (
        <span
          key={category}
          aria-hidden="true"
          data-lift={category}
          title={t(category)}
          className="inline-block size-2.5 rounded-full"
          style={{ background: LIFT_COLOR[category] }}
        />
      ))}
    </span>
  );
}
