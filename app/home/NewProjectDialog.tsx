"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocaleCombobox } from "@/components/ui/locale-combobox";
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxValue,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { LOCALES } from "@/lib/locales";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2Icon, XCircleIcon, Loader2Icon } from "lucide-react";

type LocaleItem = (typeof LOCALES)[number];
type SlugStatus = "idle" | "checking" | "available" | "taken";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");
}

export default function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [otherLanguages, setOtherLanguages] = useState<LocaleItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slug = toSlug(name);
  const anchor = useComboboxAnchor();

  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) { setSlugStatus("idle"); return; }
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug]);

  function handleNameChange(value: string) {
    setName(value);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          defaultLanguage,
          otherLanguages: otherLanguages.map((l) => l.value),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Failed to create project.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName("");
      setDefaultLanguage("en");
      setOtherLanguages([]);
      setError("");
      setSlugStatus("idle");
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
    setOpen(next);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New Project</Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Mobile App"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Slug</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                {slug ? (
                  <span className="flex w-full items-center justify-between">
                    {slug}
                    {slugStatus === "checking" && (
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </span>
                ) : (
                  <span className="italic">auto-generated from name</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Used in URLs. Auto-generated from the project name.
              </p>
              {slugStatus === "available" && (
                <Alert className="border-green-200 bg-green-50 py-2 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50">
                  <CheckCircle2Icon className="h-4 w-4 !text-green-600 dark:!text-green-400" />
                  <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                    <span>{slug}</span> is available.
                  </AlertDescription>
                </Alert>
              )}
              {slugStatus === "taken" && (
                <Alert className="border-red-200 bg-red-50 py-2 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
                  <XCircleIcon className="h-4 w-4 !text-red-600 dark:!text-red-400" />
                  <AlertDescription className="text-xs text-red-800 dark:text-red-200">
                    <span>{slug}</span> is already taken. Try a different project name.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="default-language">Default language</Label>
                <LocaleCombobox
                  id="default-language"
                  value={defaultLanguage}
                  onChange={setDefaultLanguage}
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Other languages{" "}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Additional languages to translate into using AI, alongside the default language.
                </p>
                <Combobox
                  multiple
                  autoHighlight
                  items={LOCALES.filter((l) => l.value !== defaultLanguage)}
                  value={otherLanguages}
                  onValueChange={(vals) => setOtherLanguages(vals as unknown as LocaleItem[])}
                  isItemEqualToValue={(item, val) => item.value === (val as unknown as LocaleItem).value}
                >
                  <ComboboxChips ref={anchor} className="w-full">
                    <ComboboxValue>
                      {(values) => (
                        <React.Fragment>
                          {(values as LocaleItem[]).map((locale) => (
                            <ComboboxChip key={locale.value}>{locale.label}</ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Add language…" />
                        </React.Fragment>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={anchor}>
                    <ComboboxEmpty>No language found.</ComboboxEmpty>
                    <ComboboxList>
                      {(locale: LocaleItem) => (
                        <ComboboxItem key={locale.value} value={locale}>
                          {locale.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={loading || !name.trim() || slugStatus === "checking" || slugStatus === "taken"}>
                {loading ? "Creating…" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
