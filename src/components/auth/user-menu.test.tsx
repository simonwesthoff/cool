// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { UserMenu } from "./user-menu";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("./auth-client", () => ({ authClient: {} }));
afterEach(cleanup);

describe("UserMenu", () => {
  it("shows picture placeholder, name and sign-out", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <UserMenu
          user={{ id: "u1", name: "Ada Lovelace", email: "a@b.c", image: null }}
        />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("img", { name: "Profile picture of Ada Lovelace" }),
    ).toBeTruthy();
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});
