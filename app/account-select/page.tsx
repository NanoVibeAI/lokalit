import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import AccountMembership from "@/models/AccountMembership";
import Account from "@/models/Account";
import AccountSelectForm, { AccountOption } from "./AccountSelectForm";

export default async function AccountSelectPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/api/auth/login");
  }

  if (session.accountId) {
    redirect("/home");
  }

  await connectDB();

  const memberships = await AccountMembership.find(
    { userSub: session.userId },
    "accountId"
  ).lean();

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const accountIds = memberships.map((m) => m.accountId);
  const accounts = await Account.find(
    { _id: { $in: accountIds } },
    "_id account_id name"
  ).lean();

  const accountOptions: AccountOption[] = accounts.map((a) => ({
    id: String(a._id),
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
