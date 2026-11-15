// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import type { ExerciseGroup } from "@/domain/exercises/catalog-types";
import { ExerciseList } from "./exercise-list";
import { formatRange } from "./format";

afterEach(cleanup);

// jsdom may lack the modal dialog API; emulate the parts the component uses.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype;
  if (!proto.showModal) {
    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    proto.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
});

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
  it("shows one block per group with number, name and best value per exercise", () => {
    renderIn("en", <ExerciseList groups={[k3, k8]} />);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["K3 · Speed strength", "K8 · General strength training 1"]);
    const k3Rows = within(
      screen.getByRole("list", { name: "K3 · Speed strength" }),
    ).getAllByRole("button");
    expect(k3Rows).toHaveLength(1);
    expect(k3Rows[0]!.getAttribute("aria-haspopup")).toBe("dialog");
    expect(k3Rows[0]!.textContent).toBe("13Snatch pullBest value 108%");
    expect(k3Rows[0]!.textContent).not.toContain("K3");
    const k8Rows = within(
      screen.getByRole("list", { name: "K8 · General strength training 1" }),
    ).getAllByRole("button");
    expect(k8Rows[0]!.textContent).toContain("31Bench press");
    expect(within(k8Rows[0]!).getByLabelText("Not defined").textContent).toBe(
      "–",
    );
  });

  it("shows German names and formatting in German", () => {
    renderIn("de", <ExerciseList groups={[k3]} />);
    expect(
      screen.getByRole("heading", { name: "Trainingsmittelkatalog" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "K3 · Schnellkraftfähigkeit (SKF)" }),
    ).toBeTruthy();
    const row = screen.getByRole("button");
    expect(row.textContent).toContain("Zug breit");
    expect(row.textContent).toContain("108\u00a0%");
  });
});

describe("exercise dialog", () => {
  const openExercise = async (name: string) => {
    await userEvent.click(
      screen.getByRole("button", { name: new RegExp(name) }),
    );
    return screen.getByRole("dialog");
  };
  const valuesOf = (dialog: HTMLElement) => {
    const terms = within(dialog)
      .getAllByRole("term")
      .map((dt) => dt.textContent);
    const values = within(dialog)
      .getAllByRole("definition")
      .map((dd) => dd.textContent);
    return Object.fromEntries(terms.map((term, i) => [term, values[i]]));
  };

  it("shows title, subtitle and all values of the selected exercise", async () => {
    renderIn("en", <ExerciseList groups={[k3, k8]} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    const dialog = await openExercise("Snatch pull");
    const title = within(dialog).getByRole("heading", { level: 2 });
    expect(title.textContent).toBe("13 Snatch pull");
    expect(title.children).toHaveLength(0);
    expect(
      within(dialog).getByText("K3 · Speed strength · Snatch exercise"),
    ).toBeTruthy();
    expect(valuesOf(dialog)).toEqual({
      "Best value (% of snatch / clean & jerk max)": "108%",
      "Max. weekly average weight": "94%",
      "Reps per set": "3–8",
      "Reps per week": "18–48",
      Comment: "Not defined",
    });
  });

  it("names clean & jerk exercises in the subtitle, in German too", async () => {
    const clean = {
      ...k3,
      exercises: [
        { ...k3.exercises[0]!, referenceLift: "clean_and_jerk" as const },
      ],
    };
    renderIn("en", <ExerciseList groups={[clean]} />);
    const dialog = await openExercise("Snatch pull");
    expect(
      within(dialog).getByText("K3 · Speed strength · C&J exercise"),
    ).toBeTruthy();
    cleanup();
    renderIn("de", <ExerciseList groups={[k3]} />);
    const dialogDe = await openExercise("Zug breit");
    expect(
      within(dialogDe).getByRole("heading", { level: 2 }).textContent,
    ).toBe("13 Zug breit");
    expect(
      within(dialogDe).getByText(
        "K3 · Schnellkraftfähigkeit (SKF) · Reißübung",
      ),
    ).toBeTruthy();
  });

  it("marks values the catalog does not define", async () => {
    renderIn("de", <ExerciseList groups={[k8]} />);
    const dialog = await openExercise("Bankdrücken");
    expect(within(dialog).getAllByText("Nicht festgelegt")).toHaveLength(5);
    expect(
      within(dialog).getByText("K8 · Allgemeines Muskelkrafttraining 1 (AMKT)"),
    ).toBeTruthy();
  });

  it("closes with the close button and by clicking outside", async () => {
    renderIn("en", <ExerciseList groups={[k3]} />);
    let dialog = await openExercise("Snatch pull");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Close" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    dialog = await openExercise("Snatch pull");
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape (the dialog's close event)", async () => {
    renderIn("en", <ExerciseList groups={[k3]} />);
    const dialog = await openExercise("Snatch pull");
    (dialog as HTMLDialogElement).close();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /Snatch pull/ })).toBeTruthy();
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
