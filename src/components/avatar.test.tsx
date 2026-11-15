// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar, initials } from "./avatar";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));
afterEach(cleanup);

describe("Avatar", () => {
  it("shows the profile picture", () => {
    render(
      <Avatar
        name="Ada Lovelace"
        image="https://lh3.googleusercontent.com/a/ada"
        alt="Profile picture of Ada Lovelace"
      />,
    );
    expect(
      screen.getByRole("img", { name: "Profile picture of Ada Lovelace" }),
    ).toHaveProperty("src", "https://lh3.googleusercontent.com/a/ada");
  });

  it("shows initials when there is no picture", () => {
    render(<Avatar name="Ada Lovelace" image={null} alt="Profile picture" />);
    expect(
      screen.getByRole("img", { name: "Profile picture" }).textContent,
    ).toBe("AL");
  });
});

describe("initials", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["Ada", "A"],
    ["  ada   king lovelace ", "AL"],
    ["Émile Zola", "ÉZ"],
    ["", "?"],
  ])("%s -> %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
