import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/domain/auth";

async function CurrentUserMenu() {
  const user = await getCurrentUser(await headers());
  // Pages redirect signed-out visitors themselves.
  return user ? <UserMenu user={user} /> : null;
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
