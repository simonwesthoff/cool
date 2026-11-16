"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

const MAX = 3;

type Props = {
  initial: string[];
  /** Error codes for the whole list (e.g. REQUIRED, TOO_MANY). */
  errors: string[];
  /** Error codes per entry, by index. */
  itemErrors: Record<number, string[]>;
  message: (code: string) => string;
};

/** Ordered list of 1 to 3 focus points: add, remove, move up/down. */
export function FocusPointsField({
  initial,
  errors,
  itemErrors,
  message,
}: Props) {
  const t = useTranslations("Macrocycle.baseData.focusPoints");
  const id = useId();
  // Each entry keeps a stable key so React does not mix up inputs on reorder.
  const [items, setItems] = useState(() =>
    (initial.length ? initial : [""]).map((value, index) => ({
      key: index,
      value,
    })),
  );
  const [nextKey, setNextKey] = useState(initial.length + 1);

  const move = (index: number, delta: -1 | 1) =>
    setItems((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[target]] = [copy[target]!, copy[index]!];
      return copy;
    });

  const small =
    "inline-flex size-11 items-center justify-center rounded-full text-lg hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-900";
  const listErrorId = errors.length ? `${id}-error` : undefined;

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={listErrorId}>
      <legend className="mb-1 text-lg font-semibold">{t("title")}</legend>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("help")}</p>
      <ol className="flex flex-col gap-2">
        {items.map((item, index) => {
          const inputId = `${id}-${item.key}`;
          const ownErrors = itemErrors[index] ?? [];
          return (
            <li key={item.key} className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <label
                  htmlFor={inputId}
                  className="w-6 shrink-0 text-sm text-zinc-500 tabular-nums"
                >
                  {t("position", { position: index + 1 })}
                </label>
                <input
                  id={inputId}
                  name="focusPoints"
                  type="text"
                  maxLength={200}
                  value={item.value}
                  aria-label={t("entry", { position: index + 1 })}
                  aria-invalid={ownErrors.length > 0}
                  onChange={(event) =>
                    setItems((list) =>
                      list.map((x) =>
                        x.key === item.key
                          ? { ...x, value: event.target.value }
                          : x,
                      ),
                    )
                  }
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 aria-invalid:border-red-600 dark:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={t("up", { position: index + 1 })}
                  className={small}
                >
                  <span aria-hidden="true">↑</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={t("down", { position: index + 1 })}
                  className={small}
                >
                  <span aria-hidden="true">↓</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setItems((list) => list.filter((x) => x.key !== item.key))
                  }
                  disabled={items.length === 1}
                  aria-label={t("remove", { position: index + 1 })}
                  className={small}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              {ownErrors.length > 0 && (
                <p className="pl-7 text-sm text-red-700 dark:text-red-400">
                  {ownErrors.map(message).join(" ")}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {listErrorId && (
        <p id={listErrorId} className="text-sm text-red-700 dark:text-red-400">
          {errors.map(message).join(" ")}
        </p>
      )}
      {items.length < MAX && (
        <div>
          <button
            type="button"
            onClick={() => {
              setItems((list) => [...list, { key: nextKey, value: "" }]);
              setNextKey((k) => k + 1);
            }}
            className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {t("add")}
          </button>
        </div>
      )}
    </fieldset>
  );
}
