import { describe, expect, it } from "vitest";
import { DomainValidationError, parseInput } from "@/domain/validation";
import {
  completeBasicDataSchema,
  createBasicDataSchema,
  today,
  updateBasicDataSchema,
} from "./basic-data";

function fieldsOf(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    if (error instanceof DomainValidationError) return error.fields;
    throw error;
  }
  return null;
}

const create = (input: unknown) => parseInput(createBasicDataSchema, input);
const update = (input: unknown) => parseInput(updateBasicDataSchema, input);

const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

describe("basic data on create", () => {
  it("needs only a name, trimmed", () => {
    expect(create({ name: "  Anna Weber " })).toEqual({ name: "Anna Weber" });
  });

  it("accepts all fields", () => {
    const input = {
      name: "Anna",
      dateOfBirth: "2005-03-01",
      gender: "female",
      careerStartDate: "2015-09-01",
      heightCm: 165,
    };
    expect(create(input)).toEqual(input);
  });

  it.each([[{}], [{ name: "" }], [{ name: "   " }]])(
    "requires a name: %j",
    (input) => {
      expect(fieldsOf(() => create(input))).toEqual({ name: ["REQUIRED"] });
    },
  );

  it("limits the name to 100 characters", () => {
    expect(create({ name: "a".repeat(100) }).name).toHaveLength(100);
    expect(fieldsOf(() => create({ name: "a".repeat(101) }))).toEqual({
      name: ["TOO_LONG"],
    });
  });

  it("rejects dates in the future, accepts today", () => {
    expect(create({ name: "A", dateOfBirth: today() }).dateOfBirth).toBe(
      today(),
    );
    expect(
      fieldsOf(() =>
        create({ name: "A", dateOfBirth: tomorrow, careerStartDate: tomorrow }),
      ),
    ).toEqual({ dateOfBirth: ["IN_FUTURE"], careerStartDate: ["IN_FUTURE"] });
  });

  it("rejects malformed dates", () => {
    expect(
      fieldsOf(() => create({ name: "A", dateOfBirth: "01.03.2005" })),
    ).toEqual({ dateOfBirth: ["INVALID_FORMAT"] });
    expect(
      fieldsOf(() => create({ name: "A", dateOfBirth: "2005-02-30" })),
    ).toEqual({ dateOfBirth: ["INVALID_FORMAT"] });
  });

  it.each([
    [99, "OUT_OF_RANGE"],
    [251, "OUT_OF_RANGE"],
    [170.5, "NOT_INTEGER"],
    ["170", "INVALID_TYPE"],
  ])("rejects height %j with %s", (heightCm, code) => {
    expect(fieldsOf(() => create({ name: "A", heightCm }))).toEqual({
      heightCm: [code],
    });
  });

  it("accepts heights 100 and 250", () => {
    expect(create({ name: "A", heightCm: 100 }).heightCm).toBe(100);
    expect(create({ name: "A", heightCm: 250 }).heightCm).toBe(250);
  });

  it("accepts only female, male and diverse", () => {
    for (const gender of ["female", "male", "diverse"]) {
      expect(create({ name: "A", gender }).gender).toBe(gender);
    }
    expect(fieldsOf(() => create({ name: "A", gender: "other" }))).toEqual({
      gender: ["INVALID_VALUE"],
    });
  });

  it("rejects email, picture and unknown fields", () => {
    expect(
      fieldsOf(() => create({ name: "A", email: "a@b.c", image: "x" })),
    ).toEqual({ email: ["UNKNOWN_FIELD"], image: ["UNKNOWN_FIELD"] });
  });
});

describe("basic data on update", () => {
  it("accepts a subset of fields", () => {
    expect(update({ heightCm: 180 })).toEqual({ heightCm: 180 });
  });

  it("clears optional values with null", () => {
    expect(update({ dateOfBirth: null, gender: null })).toEqual({
      dateOfBirth: null,
      gender: null,
    });
  });

  it("does not allow clearing the name", () => {
    expect(fieldsOf(() => update({ name: null }))).toEqual({
      name: ["INVALID_TYPE"],
    });
    expect(fieldsOf(() => update({ name: " " }))).toEqual({
      name: ["REQUIRED"],
    });
  });
});

describe("cross-field rules", () => {
  it("rejects a career start before the date of birth", () => {
    expect(
      fieldsOf(() =>
        parseInput(completeBasicDataSchema, {
          dateOfBirth: "2005-03-01",
          careerStartDate: "2004-01-01",
        }),
      ),
    ).toEqual({ careerStartDate: ["BEFORE_DATE_OF_BIRTH"] });
  });

  it("accepts a career start on or after the date of birth", () => {
    expect(() =>
      parseInput(completeBasicDataSchema, {
        dateOfBirth: "2005-03-01",
        careerStartDate: "2005-03-01",
      }),
    ).not.toThrow();
  });
});
