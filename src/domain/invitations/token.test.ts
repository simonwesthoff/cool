import { afterEach, describe, expect, it, vi } from "vitest";
import { appUrl } from "@/server/config";
import {
  generateToken,
  hashToken,
  invitationPath,
  isTokenShape,
} from "./token";

afterEach(() => vi.unstubAllEnvs());

describe("invitation tokens", () => {
  it("are 43 base64url characters and different every time", () => {
    const tokens = Array.from({ length: 100 }, generateToken);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(isTokenShape(token)).toBe(true);
    }
    expect(new Set(tokens).size).toBe(100);
  });

  it("are stored as a stable SHA-256 hash that differs from the token", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).not.toContain(token);
    expect(hashToken("a")).toBe(
      "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    );
  });

  it("rejects strings that cannot be tokens", () => {
    for (const value of ["", "short", "x".repeat(44), `${"a".repeat(42)}!`]) {
      expect(isTokenShape(value)).toBe(false);
    }
  });

  it("builds the invitation link from the app URL", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://cool.example.com/");
    expect(`${appUrl()}${invitationPath("abc")}`).toBe(
      "https://cool.example.com/invite/abc",
    );
  });
});
