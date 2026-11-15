// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { AthleteForm } from "./athlete-form";
import { AthleteOverview } from "./athlete-overview";

const router = { push: vi.fn(), refresh: vi.fn(), bfcacheId: "visit-1" };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));
const fetchMock = vi.fn();

function renderWith(node: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {node}
    </NextIntlClientProvider>,
  );
}

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

const anna = {
  id: "a1",
  name: "Anna Weber",
  dateOfBirth: "2005-03-01",
  gender: "female" as const,
  careerStartDate: "2015-09-01",
  heightCm: 165,
  linkedAccount: null,
};

beforeEach(() => {
  fetchMock.mockReset();
  router.push.mockReset();
  router.refresh.mockReset();
  router.bfcacheId = "visit-1";
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AthleteOverview", () => {
  const erika = {
    ...anna,
    id: "a2",
    name: "Erika Muster",
    linkedAccount: {
      email: "e@x.invalid",
      image: "https://lh3.googleusercontent.com/e",
    },
  };

  it("shows a card per athlete in the given order, with picture or initials", () => {
    renderWith(<AthleteOverview athletes={[anna, erika]} />);
    const list = screen.getByRole("list", { name: "Athletes" });
    const cards = within(list).getAllByRole("link");
    expect(cards.map((c) => c.textContent)).toEqual([
      "AWAnna Weber",
      "Erika Muster",
    ]);
    expect(cards[0]).toHaveProperty("pathname", "/athletes/a1");
    expect(
      within(cards[0]!).getByRole("img", {
        name: "Profile picture of Anna Weber",
      }).textContent,
    ).toBe("AW");
    expect(
      within(cards[1]!)
        .getByRole("img", { name: "Profile picture of Erika Muster" })
        .getAttribute("src"),
    ).toContain("googleusercontent");
    expect(screen.getByRole("link", { name: "Add athlete" })).toHaveProperty(
      "pathname",
      "/athletes/new",
    );
  });

  it("shows a note when there are no athletes", () => {
    renderWith(<AthleteOverview athletes={[]} />);
    expect(
      screen.getByText("No athletes yet. Add your first athlete."),
    ).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("enables previous/next only where there is something to scroll to", async () => {
    renderWith(<AthleteOverview athletes={[anna, erika]} />);
    const list = screen.getByRole("list", { name: "Athletes" });
    const scrollBy = vi.fn();
    Object.assign(list, { scrollBy });
    Object.defineProperties(list, {
      clientWidth: { value: 300, configurable: true },
      scrollWidth: { value: 900, configurable: true },
      scrollLeft: { value: 0, writable: true, configurable: true },
    });
    fireEvent.scroll(list);
    const previous = screen.getByRole("button", { name: "Previous athletes" });
    const next = screen.getByRole("button", { name: "Next athletes" });
    expect(previous).toHaveProperty("disabled", true);
    expect(next).toHaveProperty("disabled", false);

    await userEvent.click(next);
    expect(scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: 270 }),
    );

    (list as unknown as { scrollLeft: number }).scrollLeft = 600;
    fireEvent.scroll(list);
    expect(previous).toHaveProperty("disabled", false);
    expect(next).toHaveProperty("disabled", true);
  });
});

describe("AthleteForm", () => {
  it("creates an athlete with only the entered values", async () => {
    respond(201, { ...anna });
    renderWith(<AthleteForm />);
    await userEvent.type(screen.getByLabelText("Name"), "  Anna Weber ");
    await userEvent.type(screen.getByLabelText("Height (cm)"), "165");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      name: "Anna Weber",
      heightCm: 165,
    });
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
  });

  it("clears a value when editing by sending null", async () => {
    respond(200, { ...anna, dateOfBirth: null });
    renderWith(<AthleteForm athlete={anna} />);
    expect(screen.getByRole("heading", { name: "Edit athlete" })).toBeTruthy();
    await userEvent.clear(screen.getByLabelText("Date of birth"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/athletes/a1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({
      name: "Anna Weber",
      dateOfBirth: null,
      gender: "female",
      careerStartDate: "2015-09-01",
      heightCm: 165,
    });
  });

  it("shows translated field errors next to the fields", async () => {
    respond(400, {
      error: {
        code: "VALIDATION_FAILED",
        fields: { name: ["REQUIRED"], heightCm: ["OUT_OF_RANGE"] },
      },
    });
    renderWith(<AthleteForm />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Please enter a name.")).toBeTruthy();
    expect(screen.getByText("Must be between 100 and 250 cm.")).toBeTruthy();
    expect(screen.getByLabelText("Name").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows a general message when saving fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));
    renderWith(<AthleteForm athlete={anna} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not save. Please try again.",
    );
  });

  it("cancels to the details page when editing and to the overview when adding", () => {
    const view = renderWith(<AthleteForm athlete={anna} />);
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveProperty(
      "pathname",
      "/athletes/a1",
    );
    view.unmount();
    renderWith(<AthleteForm />);
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveProperty(
      "pathname",
      "/",
    );
  });

  it("has no email or picture fields", () => {
    renderWith(<AthleteForm />);
    expect(screen.queryByLabelText(/mail/i)).toBeNull();
    expect(screen.queryByLabelText(/picture/i)).toBeNull();
  });

  it("can save again after a failed save", async () => {
    respond(400, {
      error: {
        code: "VALIDATION_FAILED",
        fields: { heightCm: ["OUT_OF_RANGE"] },
      },
    });
    renderWith(<AthleteForm athlete={{ ...anna, heightCm: null }} />);
    const height = screen.getByLabelText("Height (cm)");
    await userEvent.type(height, "300");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText("Must be between 100 and 250 cm."),
    ).toBeTruthy();

    respond(200, { ...anna, heightCm: 180 });
    await userEvent.clear(height);
    await userEvent.type(height, "180");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body).heightCm).toBe(180);
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/athletes/a1"),
    );
  });

  it("is ready again after a successful save (restored page)", async () => {
    respond(201, { ...anna });
    renderWith(<AthleteForm />);
    await userEvent.type(screen.getByLabelText("Name"), "Anna Weber");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Save" })).toHaveProperty(
      "disabled",
      false,
    );
    expect(screen.getByLabelText("Name")).toHaveProperty("value", "");
  });

  it("starts fresh with the stored data on a new visit", async () => {
    const view = renderWith(<AthleteForm athlete={anna} />);
    const name = screen.getByLabelText("Name");
    await userEvent.clear(name);
    await userEvent.type(name, "Unsaved draft");

    router.bfcacheId = "visit-2";
    view.rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <AthleteForm athlete={anna} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByLabelText("Name")).toHaveProperty("value", "Anna Weber");
  });
});
