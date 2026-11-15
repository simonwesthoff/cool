// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { GoogleSignInButton } from "./google-sign-in-button";
import { signInErrorKind } from "./sign-in-error";
import { SignOutButton } from "./sign-out-button";

const { social, signOut } = vi.hoisted(() => ({
  social: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("./auth-client", () => ({
  authClient: { signIn: { social }, signOut },
}));
const router = { replace: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function withMessages(node: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {node}
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  social.mockReset();
  signOut.mockReset();
  router.replace.mockReset();
  router.refresh.mockReset();
});
afterEach(cleanup);

describe("GoogleSignInButton", () => {
  it("starts the Google sign-in with return and error targets", async () => {
    social.mockResolvedValue({ data: {}, error: null });
    withMessages(
      <GoogleSignInButton
        returnPath="/invite/abc"
        errorPath="/sign-in?returnTo=%2Finvite%2Fabc"
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/invite/abc",
      errorCallbackURL: "/sign-in?returnTo=%2Finvite%2Fabc",
    });
  });

  it("can be clicked again when starting the sign-in fails", async () => {
    social.mockResolvedValue({ data: null, error: { status: 500 } });
    withMessages(<GoogleSignInButton returnPath="/" errorPath="/sign-in" />);
    const button = screen.getByRole("button", { name: "Continue with Google" });
    await userEvent.click(button);
    expect(button).toHaveProperty("disabled", false);
  });
});

describe("SignOutButton", () => {
  it("signs out and shows the sign-in page", async () => {
    signOut.mockResolvedValue({ data: { success: true } });
    withMessages(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledOnce();
    expect(router.replace).toHaveBeenCalledWith("/sign-in");
  });
});

describe("signInErrorKind", () => {
  it("shows no message without an error", () => {
    expect(signInErrorKind(undefined)).toBeNull();
    expect(signInErrorKind("")).toBeNull();
  });

  it("treats a cancelled sign-in at Google as not completed", () => {
    expect(signInErrorKind("access_denied")).toBe("cancelled");
  });

  it.each(["email_not_verified", "state_mismatch", "internal_server_error"])(
    "treats %s as failed",
    (code) => {
      expect(signInErrorKind(code)).toBe("failed");
    },
  );
});
