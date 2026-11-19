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
 * One small dot before an exercise's name in its lift category's colour;
 * for two categories a gradient from left to right in the order snatch,
 * clean, jerk (clean purple left, jerk magenta right). The dot shows the
 * names on hover; screen readers hear them once as a prefix ("Clean, Jerk:
 * 3 Clean and jerk"). Exercises without a category have no mark.
 */
export function LiftMarks({ categories }: { categories: LiftCategory[] }) {
  const t = useTranslations("Catalog.categories");
  const tc = useTranslations("Catalog");
  if (categories.length === 0) return null;
  const names = categories.map((c) => t(c)).join(", ");
  return (
    <span data-lift-marks className="inline-flex shrink-0 items-center gap-0.5">
      <span className="sr-only">{tc("liftPrefix", { names })}</span>
      <span
        aria-hidden="true"
        data-lift={categories.join(" ")}
        title={names}
        className="inline-block size-2.5 rounded-full"
        style={{
          background:
            categories.length === 1
              ? LIFT_COLOR[categories[0]!]
              : `linear-gradient(to right, ${categories.map((c) => LIFT_COLOR[c]).join(", ")})`,
        }}
      />
    </span>
  );
}
