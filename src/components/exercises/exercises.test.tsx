// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import type { ExerciseGroup } from "@/domain/exercises/catalog-types";
import { ExerciseDetails } from "./exercise-details";
import { ExerciseList } from "./exercise-list";
import { formatRange } from "./format";

afterEach(cleanup);

const k3: ExerciseGroup = {
  number: 3,
  code: "K3",
  name: { de: "Schnellkraftfähigkeit (SKF)", en: "Speed strength" },
  exercises: [
    {
      number: 13,
      groupNumber: 3,
      name: { de: "Zug breit", en: "Snatch pull" },
      referenceLift: "snatch",
      bestValuePct: 108,
      maxWeeklyAverageWeightPct: 94,
      repsPerSet: { min: 3, max: 8 },
      repsPerWeek: { min: 18, max: 48 },
      comment: null,
    },
  ],
};
const k8: ExerciseGroup = {
  number: 8,
  code: "K8",
  name: {
    de: "Allgemeines Muskelkrafttraining 1 (AMKT)",
    en: "General strength training 1",
  },
  exercises: [
    {
      number: 31,
      groupNumber: 8,
      name: { de: "Bankdrücken", en: "Bench press" },
      referenceLift: null,
      bestValuePct: null,
      maxWeeklyAverageWeightPct: null,
      repsPerSet: { min: null, max: null },
      repsPerWeek: { min: null, max: null },
      comment: null,
    },
  ],
};

function renderIn(locale: "en" | "de", node: React.ReactNode) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? de : en}
    >
      {node}
    </NextIntlClientProvider>,
  );
}

describe("ExerciseList", () => {
  it("shows number, name, group and best value per exercise, linking to it", () => {
    renderIn("en", <ExerciseList groups={[k3, k8]} />);
    const rows = within(
      screen.getByRole("list", { name: "Exercises" }),
    ).getAllByRole("link");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveProperty("pathname", "/exercises/13");
    expect(rows[0]!.textContent).toBe("13Snatch pullK3 · Speed strength108%");
    expect(rows[1]!.textContent).toContain("31Bench pressK8");
    expect(within(rows[1]!).getByLabelText("Not defined").textContent).toBe(
      "–",
    );
  });

  it("shows German names and formatting in German", () => {
    renderIn("de", <ExerciseList groups={[k3]} />);
    expect(
      screen.getByRole("heading", { name: "Trainingsmittelkatalog" }),
    ).toBeTruthy();
    const row = screen.getByRole("link");
    expect(row.textContent).toContain("Zug breit");
    expect(row.textContent).toContain("Schnellkraftfähigkeit (SKF)");
    expect(row.textContent).toContain("108 %");
  });
});

describe("ExerciseDetails", () => {
  const { exercises, ...group } = k3;

  it("shows all information of an exercise", () => {
    renderIn("en", <ExerciseDetails exercise={exercises[0]!} group={group} />);
    expect(screen.getByRole("heading", { name: "Snatch pull" })).toBeTruthy();
    const terms = screen.getAllByRole("term").map((dt) => dt.textContent);
    const values = screen
      .getAllByRole("definition")
      .map((dd) => dd.textContent);
    expect(
      Object.fromEntries(terms.map((term, i) => [term, values[i]])),
    ).toEqual({
      "Exercise group": "K3 · Speed strength",
      "Reference lift": "Snatch",
      "Best value (% of snatch / clean & jerk max)": "108%",
      "Max. weekly average weight": "94%",
      "Reps per set": "3–8",
      "Reps per week": "18–48",
      Comment: "Not defined",
    });
    expect(
      screen.getByRole("link", { name: /Back to exercises/ }),
    ).toHaveProperty("pathname", "/exercises");
  });

  it("marks values the catalog does not define", () => {
    const { exercises: k8Exercises, ...k8Group } = k8;
    renderIn(
      "de",
      <ExerciseDetails exercise={k8Exercises[0]!} group={k8Group} />,
    );
    expect(screen.getAllByText("Nicht festgelegt")).toHaveLength(6);
    expect(
      screen.getByText("K8 · Allgemeines Muskelkrafttraining 1 (AMKT)"),
    ).toBeTruthy();
  });
});

describe("formatRange", () => {
  it.each([
    [{ min: 3, max: 8 }, "3–8"],
    [{ min: 5, max: 5 }, "5"],
    [{ min: 3, max: null }, "3"],
    [{ min: null, max: null }, null],
  ])("%j -> %s", (range, expected) => {
    expect(formatRange(range)).toBe(expected);
  });
});
