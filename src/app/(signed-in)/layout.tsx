import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { PageHeader } from "@/components/page-header";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { getCurrentUser } from "@/domain/auth";
import { getRoles } from "@/domain/roles";

async function SignedInHeader() {
  const user = await getCurrentUser(await headers());
  // Pages redirect signed-out visitors themselves.
  if (!user) return <PageHeader />;
  const roles = await getRoles(user);
  const navigationRoles = {
    coach: roles.coach !== null,
    athlete: roles.athlete !== null,
  };
  return (
    <>
      <PageHeader
        left={<AppNavigation roles={navigationRoles} placement="header" />}
        right={<UserMenu user={user} />}
      />
      <AppNavigation roles={navigationRoles} placement="bottom" />
    </>
  );
}

/** Layout of all pages for signed-in users. */
export default function SignedInLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<PageHeader />}>
        <SignedInHeader />
      </Suspense>
      {children}
    </div>
  );
}
