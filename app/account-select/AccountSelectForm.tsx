"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AccountOption {
  id: string;
  slug: string;
  name: string;
}

interface Props {
  accounts: AccountOption[];
}

export default function AccountSelectForm({ accounts }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(accounts[0]?.id ?? "");
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/account-select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selectedId, setAsDefault }),
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
    <Card>
      <CardHeader>
        <CardTitle>Choose an account</CardTitle>
        <CardDescription>Select which account you want to work in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="account-select">Account</Label>
            <Select value={selectedId} onValueChange={(value) => { if (value) setSelectedId(value); }}>
              <SelectTrigger id="account-select" className="w-full" size="default">
                <SelectValue placeholder="Select an account">
                  {accounts.find((a) => a.id === selectedId)?.name ?? "Select an account"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acct) => (
                  <SelectItem key={acct.id} value={acct.id}>
                    {acct.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="set-default"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
            />
            <Label htmlFor="set-default" className="cursor-pointer font-normal text-sm">
              Set as my default account for future logins
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={!selectedId || loading}>
            {loading ? "Continuing…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
