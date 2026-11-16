/** Types of the exercise catalog, shared with UI code (no server imports). */

export type ReferenceLift = "snatch" | "clean_and_jerk";

/** A text in both catalog languages. */
export type LocalizedText = { de: string; en: string };

export type Range = { min: number | null; max: number | null };

export type Exercise = {
  number: number;
  groupNumber: number;
  name: LocalizedText;
  referenceLift: ReferenceLift | null;
  bestValuePct: number | null;
  maxWeeklyAverageWeightPct: number | null;
  repsPerSet: Range;
  repsPerWeek: Range;
  comment: LocalizedText | null;
  /** Points the exercise addresses, in catalog order (may be empty). */
  addresses: ExerciseTag[];
};

/** A point exercises address; `key` is its German name. */
export type ExerciseTag = { key: string; name: LocalizedText };

export type ExerciseGroup = {
  number: number;
  code: string;
  name: LocalizedText;
  exercises: Exercise[];
};

/** Picks the text for a UI locale (German or English). */
export function localized(text: LocalizedText, locale: string): string {
  return locale === "de" ? text.de : text.en;
}
