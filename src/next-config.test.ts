import { describe, expect, it } from "vitest";
import config from "../next.config";

describe("next.config redirects", () => {
  it("sends the former planning step pages to the planning page at that step", async () => {
    const redirects = await config.redirects!();
    expect(redirects).toEqual(
      ["base-data", "swot", "intensity", "exercises"].map((step) => ({
        source: `/athletes/:id/macrocycle/${step}`,
        destination: `/athletes/:id/macrocycle/planning?step=${step}`,
        permanent: true,
      })),
    );
  });
});
