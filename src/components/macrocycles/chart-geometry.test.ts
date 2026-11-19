import { describe, expect, it } from "vitest";
import { smoothPath } from "./chart-geometry";

describe("smoothPath", () => {
  it("passes through every point with cubic segments and never overshoots", () => {
    const points = [
      { x: 0, y: 100 },
      { x: 10, y: 100 },
      { x: 20, y: 50 },
      { x: 30, y: 40 },
    ];
    const d = smoothPath(points);
    expect(d.startsWith("M0.0,100.0 C")).toBe(true);
    expect(d).toContain(" 20.0,50.0");
    expect(d.endsWith(" 30.0,40.0")).toBe(true);
    // Control points stay within the range of the values.
    const ys = [...d.matchAll(/C[\d.]+,([\d.]+) [\d.]+,([\d.]+)/g)].flatMap(
      (m) => [Number(m[1]), Number(m[2])],
    );
    expect(Math.max(...ys)).toBeLessThanOrEqual(100);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(40);
    // A flat stretch stays flat.
    expect(d).toContain("C3.3,100.0 6.7,100.0 10.0,100.0");
  });

  it("draws a single point as a dot", () => {
    expect(smoothPath([{ x: 5, y: 7 }])).toBe("M5.0,7.0 l0.01,0");
    expect(smoothPath([])).toBe("");
  });
});
