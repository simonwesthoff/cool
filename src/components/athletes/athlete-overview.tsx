"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Athlete } from "@/domain/athletes/basic-data";
import { Avatar } from "../avatar";

/** The coach's athlete overview: a carousel of athlete cards. */
export function AthleteOverview({ athletes }: { athletes: Athlete[] }) {
  const t = useTranslations("Athletes");
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link
          href="/athletes/new"
          className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t("add")}
        </Link>
      </div>
      {athletes.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
      ) : (
        <AthleteCarousel athletes={athletes} />
      )}
    </section>
  );
}

function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

/**
 * Horizontal carousel built on native scrolling with scroll snap: swiping on
 * phones, previous/next buttons from the `sm` breakpoint up.
 */
export function AthleteCarousel({ athletes }: { athletes: Athlete[] }) {
  const t = useTranslations("Athletes");
  const listId = useId();
  const list = useRef<HTMLUListElement>(null);
  const [canScroll, setCanScroll] = useState({ back: false, forward: false });

  const update = useCallback(() => {
    const el = list.current;
    if (!el) return;
    setCanScroll({
      back: el.scrollLeft > 1,
      forward: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, athletes.length]);

  function scroll(direction: 1 | -1) {
    const el = list.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.9,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  const arrow =
    "hidden size-11 shrink-0 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent sm:inline-flex dark:border-zinc-700 dark:hover:bg-zinc-900";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => scroll(-1)}
        disabled={!canScroll.back}
        aria-label={t("previous")}
        aria-controls={listId}
        className={arrow}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <ul
        id={listId}
        ref={list}
        aria-label={t("carouselLabel")}
        className="flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
      >
        {athletes.map((athlete) => (
          <li key={athlete.id} className="w-[40%] shrink-0 snap-start sm:w-44">
            <Link
              href={`/athletes/${athlete.id}`}
              onFocus={(event) =>
                event.currentTarget.scrollIntoView({
                  block: "nearest",
                  inline: "nearest",
                })
              }
              className="flex h-full flex-col items-center gap-3 rounded-2xl border border-zinc-200 px-3 py-5 text-center hover:bg-zinc-50 focus-visible:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900"
            >
              <Avatar
                name={athlete.name}
                image={athlete.linkedAccount?.image ?? null}
                alt={t("pictureAlt", { name: athlete.name })}
                size={96}
              />
              <span className="line-clamp-2 font-medium break-words">
                {athlete.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => scroll(1)}
        disabled={!canScroll.forward}
        aria-label={t("next")}
        aria-controls={listId}
        className={arrow}
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
