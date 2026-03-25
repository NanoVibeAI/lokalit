import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import AccountSelectForm, { AccountOption } from "./AccountSelectForm";

export default async function AccountSelectPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/api/auth/login");
  }

  if (session.accountId) {
    redirect("/home");
  }

  const { data: memberships } = await db
    .schema("apps_lokalit")
    .from("account_memberships")
    .select("account_id")
    .eq("user_sub", session.userId!);

  if (!memberships || memberships.length === 0) {
    redirect("/home");
  }

  const accountIds = memberships.map((m) => m.account_id);
  const { data: accounts } = await db
    .schema("apps_lokalit")
    .from("accounts")
    .select("id, account_id, name")
    .in("id", accountIds);

  const accountOptions: AccountOption[] = (accounts ?? []).map((a) => ({
    id: a.id,
    slug: a.account_id,
    name: a.name,
  }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Lokalit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have access to multiple accounts.
          </p>
        </div>
        <AccountSelectForm accounts={accountOptions} />
      </div>
    </div>
  );
}
