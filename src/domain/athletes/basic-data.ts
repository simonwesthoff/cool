import { z } from "zod";

export const genders = ["female", "male", "diverse"] as const;
export type Gender = (typeof genders)[number];

export const NAME_MAX_LENGTH = 100;
export const HEIGHT_MIN_CM = 100;
export const HEIGHT_MAX_CM = 250;

/** Today's date as `YYYY-MM-DD` (UTC). */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const code = (value: string) => ({ params: { code: value } });

const name = z
  .string()
  .trim()
  .refine((value) => value.length > 0, code("REQUIRED"))
  .refine((value) => value.length <= NAME_MAX_LENGTH, code("TOO_LONG"));

const pastDate = z.iso
  .date()
  .refine((value) => value <= today(), code("IN_FUTURE"));

const heightCm = z
  .number()
  .refine(Number.isInteger, code("NOT_INTEGER"))
  .refine(
    (value) => value >= HEIGHT_MIN_CM && value <= HEIGHT_MAX_CM,
    code("OUT_OF_RANGE"),
  );

const optionalFields = {
  dateOfBirth: pastDate.nullable().optional(),
  gender: z.enum(genders).nullable().optional(),
  careerStartDate: pastDate.nullable().optional(),
  heightCm: heightCm.nullable().optional(),
};

/** Basic data of an athlete as stored. */
export type BasicData = {
  name: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  careerStartDate: string | null;
  heightCm: number | null;
};

/** User account an athlete is linked to; source of email and picture. */
export type LinkedAccount = { email: string; image: string | null };

/** An athlete as the app and the API see it. */
export type Athlete = BasicData & {
  id: string;
  linkedAccount: LinkedAccount | null;
};

/** Input to add an athlete: only the name is required. */
export const createBasicDataSchema = z.strictObject({
  name,
  ...optionalFields,
});

/** Input to change an athlete: any subset; `null` clears optional values. */
export const updateBasicDataSchema = z.strictObject({
  name: name.optional(),
  ...optionalFields,
});

export type CreateBasicDataInput = z.output<typeof createBasicDataSchema>;
export type UpdateBasicDataInput = z.output<typeof updateBasicDataSchema>;

/** Cross-field rules on the complete basic data after a change. */
export const completeBasicDataSchema = z
  .object({
    dateOfBirth: z.string().nullable(),
    careerStartDate: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.dateOfBirth &&
      data.careerStartDate &&
      data.careerStartDate < data.dateOfBirth
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["careerStartDate"],
        message: "BEFORE_DATE_OF_BIRTH",
        params: { code: "BEFORE_DATE_OF_BIRTH" },
      });
    }
  });
