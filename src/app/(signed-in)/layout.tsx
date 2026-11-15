import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { PageHeader } from "@/components/page-header";
import { RoleSwitch } from "@/components/roles/role-switch";
import { getCurrentUser } from "@/domain/auth";
import { getRoles } from "@/domain/roles";

async function CurrentUserMenu() {
  const user = await getCurrentUser(await headers());
  // Pages redirect signed-out visitors themselves.
  if (!user) return null;
  const roles = await getRoles(user);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <UserMenu user={user} />
      {roles.coach && roles.athlete && <RoleSwitch />}
    </div>
  );
}

/** Layout of all pages for signed-in users. */
export default function SignedInLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader>
        <Suspense>
          <CurrentUserMenu />
        </Suspense>
      </PageHeader>
      {children}
    </div>
  );
}
