"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import type { CurrentUser } from "@/domain/auth";
import { Avatar } from "../avatar";
import { firstName } from "../first-name";
import { LanguageSwitcher } from "../language-switcher";
import { SignOutButton } from "./sign-out-button";

/** Signed-in account (picture and first name) with a menu to sign out. */
export function UserMenu({ user }: { user: CurrentUser }) {
  const t = useTranslations("UserMenu");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("accountLabel", { name: user.name })}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-2 rounded-full py-1 pr-3 pl-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
      >
        <Avatar
          name={user.name}
          image={user.image}
          alt={t("pictureAlt", { name: user.name })}
          size={32}
        />
        <span className="max-w-[10rem] truncate text-sm font-medium">
          {firstName(user.name)}
        </span>
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute right-0 z-30 mt-2 flex min-w-48 flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </p>
          <LanguageSwitcher />
          <SignOutButton />
        </div>
      )}
    </div>
  );
}
