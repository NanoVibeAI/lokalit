"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const accountSlug = toSlug(accountName);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Something went wrong.");
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">L10n</h1>
          <p className="mt-1 text-sm text-muted-foreground">Localization Management Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set up your organization</CardTitle>
            <CardDescription>
              Give your workspace a name. You can change this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="accountName">Organization name</Label>
                <Input
                  id="accountName"
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Acme Corp"
                />
                {accountSlug && (
                  <p className="text-xs text-muted-foreground">
                    Workspace ID:{" "}
                    <span className="font-mono font-medium">{accountSlug}</span>
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading || !accountName.trim()} className="w-full">
                {loading ? "Creating…" : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
