// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import {
  InvitationLinkForm,
  invitationPathFromLink,
} from "./invitation-link-form";
import { RoleSwitch } from "./role-switch";
import { StartChoice } from "./start-choice";

const router = { push: vi.fn(), refresh: vi.fn() };
let pathname = "/";
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => pathname,
}));
const fetchMock = vi.fn();
const token = "A".repeat(43);

const renderWith = (node: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {node}
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("StartChoice", () => {
  it("offers both roles; Start as Coach creates the Team", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
    renderWith(<StartChoice />);
    expect(
      screen.getByRole("link", { name: "Start as Athlete" }),
    ).toHaveProperty("pathname", "/start/athlete");
    await userEvent.click(
      screen.getByRole("button", { name: "Start as Coach" }),
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/team", { method: "POST" });
    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
  });
});

describe("invitation link entry", () => {
  const origin = "https://localhost:3000";

  it("accepts a complete invitation link of this app", () => {
    expect(invitationPathFromLink(` ${origin}/invite/${token} `, origin)).toBe(
      `/invite/${token}`,
    );
  });

  it.each([
    "",
    "hello",
    token,
    `https://evil.example/invite/${token}`,
    `${origin}/invite/short`,
    `${origin}/athletes/${token}`,
  ])("rejects %j", (value) => {
    expect(invitationPathFromLink(value, origin)).toBeNull();
  });

  it("navigates to the invitation or shows a message", async () => {
    renderWith(<InvitationLinkForm />);
    const input = screen.getByLabelText("Invitation link");
    await userEvent.type(input, "not a link");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByText("This is not a valid invitation link."),
    ).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();

    await userEvent.clear(input);
    await userEvent.type(input, `${window.location.origin}/invite/${token}`);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(router.push).toHaveBeenCalledWith(`/invite/${token}`);
  });
});

describe("RoleSwitch", () => {
  it("marks My Team on the athlete list and My training on the athlete view", () => {
    pathname = "/";
    const view = renderWith(<RoleSwitch />);
    expect(
      screen
        .getByRole("link", { name: "My Team" })
        .getAttribute("aria-current"),
    ).toBe("page");
    view.unmount();
    pathname = "/training";
    renderWith(<RoleSwitch />);
    expect(
      screen
        .getByRole("link", { name: "My training" })
        .getAttribute("aria-current"),
    ).toBe("page");
  });
});
