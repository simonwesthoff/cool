// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { UserMenu } from "./user-menu";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));
vi.mock("./auth-client", () => ({ authClient: {} }));
afterEach(cleanup);

const user = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
};

function renderMenu() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <UserMenu user={user} />
      <p>outside</p>
    </NextIntlClientProvider>,
  );
}

describe("UserMenu", () => {
  it("shows the picture and only the first name", () => {
    renderMenu();
    expect(
      screen.getByRole("img", { name: "Profile picture of Ada Lovelace" }),
    ).toBeTruthy();
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.queryByText(/Lovelace/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("opens a menu with sign-out and closes it on Escape and outside clicks", async () => {
    renderMenu();
    const account = screen.getByRole("button", {
      name: "Account of Ada Lovelace",
    });
    await userEvent.click(account);
    expect(account.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Language" })).toBeTruthy();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();

    await userEvent.click(account);
    await userEvent.click(screen.getByText("outside"));
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
    expect(account.getAttribute("aria-expanded")).toBe("false");
  });
});
