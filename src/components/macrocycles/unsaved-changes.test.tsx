// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  UnsavedChangesProvider,
  useCurrentGuard,
  useUnsavedChangesGuard,
  type UnsavedChangesGuard,
} from "./unsaved-changes";

afterEach(cleanup);

function Form({ dirty }: { dirty: boolean }) {
  useUnsavedChangesGuard({ isDirty: () => dirty, save: async () => true });
  return null;
}
const reader: { read: () => UnsavedChangesGuard | null } = {
  read: () => null,
};
function Reader() {
  const current = useCurrentGuard();
  useEffect(() => {
    reader.read = current;
  });
  return null;
}
const read = () => reader.read();

describe("unsaved changes registry", () => {
  it("keeps the newer form's guard when an older form unmounts later", () => {
    const view = render(
      <UnsavedChangesProvider>
        <Form key="old" dirty={false} />
        <Reader />
      </UnsavedChangesProvider>,
    );
    // The next step's form mounts while the previous one is still there.
    view.rerender(
      <UnsavedChangesProvider>
        <Form key="old" dirty={false} />
        <Form key="new" dirty />
        <Reader />
      </UnsavedChangesProvider>,
    );
    view.rerender(
      <UnsavedChangesProvider>
        <Form key="new" dirty />
        <Reader />
      </UnsavedChangesProvider>,
    );
    expect(read()?.isDirty()).toBe(true);
    view.rerender(
      <UnsavedChangesProvider>
        <Reader />
      </UnsavedChangesProvider>,
    );
    expect(read()).toBeNull();
  });
});
