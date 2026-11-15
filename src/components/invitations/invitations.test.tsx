// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { AthleteForm } from "../athletes/athlete-form";
import { AcceptInvitation } from "./accept-invitation";
import { InvitationPanel } from "./invitation-panel";
import { LinkedAccountSection, ThisIsMeButton } from "./link-section";

const router = { push: vi.fn(), refresh: vi.fn(), bfcacheId: "v1" };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));
const fetchMock = vi.fn();
const writeText = vi.fn();
const token = "A".repeat(43);
const invitation = {
  url: `https://localhost/invite/${token}`,
  expiresAt: "2026-11-22T10:00:00.000Z",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const renderWith = (node: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      {node}
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
  fetchMock.mockReset();
  writeText.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("InvitationPanel", () => {
  it("creates a link, shows it with its expiry and copies it", async () => {
    fetchMock.mockResolvedValue(json(201, invitation));
    renderWith(<InvitationPanel athleteId="a1" />);
    await userEvent.click(screen.getByRole("button", { name: "Invite" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/athletes/a1/invitations", {
      method: "POST",
    });
    expect(await screen.findByDisplayValue(invitation.url)).toBeTruthy();
    expect(screen.getByText(/Valid until Nov 22, 2026/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith(invitation.url);
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Create new link" }),
    ).toBeTruthy();
  });

  it("falls back and finally asks to copy by hand when the clipboard is refused", async () => {
    fetchMock.mockResolvedValue(json(201, invitation));
    writeText.mockRejectedValue(
      new DOMException("Document is not focused", "NotAllowedError"),
    );
    const execCommand = vi.fn().mockReturnValue(false);
    Object.defineProperty(document, "execCommand", {
      value: execCommand,
      configurable: true,
    });
    renderWith(<InvitationPanel athleteId="a1" />);
    await userEvent.click(screen.getByRole("button", { name: "Invite" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Copy link" }),
    );
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(screen.getByRole("status").textContent).toContain(
      "please copy it yourself",
    );
  });

  it("shows a message when the link cannot be created", async () => {
    fetchMock.mockResolvedValue(
      json(409, { error: { code: "ATHLETE_ALREADY_LINKED" } }),
    );
    renderWith(<InvitationPanel athleteId="a1" />);
    await userEvent.click(screen.getByRole("button", { name: "Invite" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});

describe("Save and invite", () => {
  it("creates the athlete, then the invitation, and shows the link", async () => {
    fetchMock
      .mockResolvedValueOnce(
        json(201, { id: "a1", name: "Anna", linkedAccount: null }),
      )
      .mockResolvedValueOnce(json(201, invitation));
    renderWith(<AthleteForm />);
    await userEvent.type(screen.getByLabelText("Name"), "Anna");
    await userEvent.click(
      screen.getByRole("button", { name: "Save and invite" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Anna was added" }),
    ).toBeTruthy();
    expect(screen.getByDisplayValue(invitation.url)).toBeTruthy();
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      "/api/athletes",
      "/api/athletes/a1/invitations",
    ]);
    expect(screen.getByRole("link", { name: "Done" })).toHaveProperty(
      "pathname",
      "/",
    );
  });

  it("is not offered when editing", () => {
    renderWith(
      <AthleteForm
        athlete={{
          id: "a1",
          name: "Anna",
          dateOfBirth: null,
          gender: null,
          careerStartDate: null,
          heightCm: null,
          linkedAccount: null,
        }}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Save and invite" }),
    ).toBeNull();
  });
});

describe("linked account and This is me", () => {
  it("shows email and picture of the linked account", () => {
    renderWith(
      <LinkedAccountSection
        name="Anna"
        account={{
          email: "anna@example.com",
          image: "https://lh3.googleusercontent.com/a",
        }}
      />,
    );
    expect(screen.getByText("anna@example.com")).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "Profile picture of Anna" }),
    ).toBeTruthy();
  });

  it("links the coach and refreshes the page", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    renderWith(<ThisIsMeButton athleteId="a1" />);
    await userEvent.click(screen.getByRole("button", { name: "This is me" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/athletes/a1/link-self", {
      method: "POST",
    });
    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
  });
});

describe("AcceptInvitation", () => {
  const info = {
    status: "valid" as const,
    coachName: "Max Berg",
    athleteName: "Anna Weber",
  };

  it("shows who invites whom and accepts", async () => {
    fetchMock.mockResolvedValue(json(200, { athleteId: "a1" }));
    renderWith(
      <AcceptInvitation token={token} info={info} alreadyLinked={false} />,
    );
    expect(
      screen.getByText("Max Berg invites you as Anna Weber."),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(fetchMock).toHaveBeenCalledWith(`/api/invitations/${token}/accept`, {
      method: "POST",
    });
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/training"));
  });

  it.each([
    [null, false, "This invitation link is not valid."],
    [
      { ...info, status: "expired" as const },
      false,
      "This invitation has expired.",
    ],
    [
      { ...info, status: "used" as const },
      false,
      "This invitation is no longer valid.",
    ],
    [info, true, "Your account is already linked to an athlete"],
  ])(
    "shows the problem without an Accept button: %j",
    (state, linked, text) => {
      renderWith(
        <AcceptInvitation token={token} info={state} alreadyLinked={linked} />,
      );
      expect(screen.getByRole("alert").textContent).toContain(text);
      expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    },
  );

  it("shows the reason when accepting fails", async () => {
    fetchMock.mockResolvedValue(
      json(410, { error: { code: "INVITATION_USED" } }),
    );
    renderWith(
      <AcceptInvitation token={token} info={info} alreadyLinked={false} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "no longer valid",
    );
    expect(router.push).not.toHaveBeenCalled();
  });
});
