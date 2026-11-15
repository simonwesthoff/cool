"use client";

import { useTranslations } from "next-intl";
import type { CurrentUser } from "@/domain/auth";
import { Avatar } from "../avatar";
import { SignOutButton } from "./sign-out-button";

/** Signed-in user's picture and name with a sign-out button. */
export function UserMenu({ user }: { user: CurrentUser }) {
  const t = useTranslations("UserMenu");
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar
        name={user.name}
        image={user.image}
        alt={t("pictureAlt", { name: user.name })}
        size={32}
      />
      <span className="truncate text-sm font-medium">{user.name}</span>
      <SignOutButton />
    </div>
  );
}
