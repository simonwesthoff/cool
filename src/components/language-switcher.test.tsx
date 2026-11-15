// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { LanguageSwitcher } from "./language-switcher";

const router = { refresh: vi.fn(), push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function renderSwitcher() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <LanguageSwitcher />
    </NextIntlClientProvider>,
  );
}

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    document.cookie = "NEXT_LOCALE=; path=/; max-age=0";
    router.refresh.mockReset();
    router.push.mockReset();
    router.replace.mockReset();
  });
  afterEach(cleanup);

  it("marks the current language", () => {
    renderSwitcher();
    expect(screen.getByRole("button", { name: "English" })).toHaveProperty(
      "ariaPressed",
      "true",
    );
    expect(screen.getByRole("group", { name: "Language" })).toBeTruthy();
  });

  it("stores the choice and refreshes the current page in place", async () => {
    renderSwitcher();
    await userEvent.click(screen.getByRole("button", { name: "Deutsch" }));
    expect(document.cookie).toContain("NEXT_LOCALE=de");
    expect(router.refresh).toHaveBeenCalledOnce();
    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("does nothing when the current language is selected", async () => {
    renderSwitcher();
    await userEvent.click(screen.getByRole("button", { name: "English" }));
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
