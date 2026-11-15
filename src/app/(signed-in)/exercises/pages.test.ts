import { describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";

const getExercise = vi.fn();
vi.mock("@/domain/exercises", () => ({
  getExercise,
  getCatalog: async () => [],
}));
vi.mock("../current-user", () => ({
  requirePageUser: async () => ({ id: "u1" }),
}));
class NotFound extends Error {}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFound();
  },
}));

const { ExerciseInfo } = await import("./[number]/page");
const { Exercises } = await import("./page");
const params = (number: string) => ({ params: Promise.resolve({ number }) });

describe("exercise pages", () => {
  it("renders the catalog list for every signed-in user", async () => {
    const element = await Exercises();
    expect(element.props.groups).toEqual([]);
  });

  it("renders an exercise", async () => {
    getExercise.mockResolvedValue({
      exercise: { number: 13 },
      group: { code: "K3" },
    });
    const element = await ExerciseInfo(params("13"));
    expect(getExercise).toHaveBeenCalledWith(13);
    expect(element.props.exercise).toEqual({ number: 13 });
  });

  it.each(["99", "abc", "1e2", "-1"])(
    "shows not found for %s",
    async (number) => {
      getExercise.mockReset();
      getExercise.mockRejectedValue(
        new DomainError("not_found", "EXERCISE_NOT_FOUND"),
      );
      await expect(ExerciseInfo(params(number))).rejects.toBeInstanceOf(
        NotFound,
      );
    },
  );
});
