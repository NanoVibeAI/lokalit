import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import AccountMembership from "@/models/AccountMembership";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/api/auth/login");
  }

  await connectDB();
  const membershipCount = await AccountMembership.countDocuments({ userSub: session.userId });

  if (membershipCount > 0) {
    redirect("/account-select");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Lokalit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage translation keys and multi-language content across all your projects from a single interface.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
