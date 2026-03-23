"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

type LocaleItem = (typeof LOCALES)[number];

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Props {
  currentSlug: string;
  initialName: string;
  initialSlug: string;
  initialDefaultLanguage: string;
  initialOtherLanguages?: string[];
}

export default function ProjectSettingsForm({
  currentSlug,
  initialName,
  initialSlug,
  initialDefaultLanguage,
  initialOtherLanguages = [],
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [slugTouched, setSlugTouched] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState(initialDefaultLanguage);
  const [otherLanguages, setOtherLanguages] = useState<LocaleItem[]>(
    initialOtherLanguages
      .map((code) => LOCALES.find((l) => l.value === code))
      .filter((l): l is LocaleItem => l !== undefined)
  );

  const anchor = useComboboxAnchor();

  useEffect(() => {
    setDefaultLanguage(initialDefaultLanguage);
  }, [initialDefaultLanguage]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(toSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${currentSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, defaultLanguage, otherLanguages: otherLanguages.map((l) => l.value) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Failed to save changes.");
        return;
      }

      setSuccess(true);
      // If the slug changed, navigate to the new settings URL
      if (data.slug !== currentSlug) {
        router.replace(`/projects/${data.slug}/settings`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Mobile App"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="e.g. mobile-app"
          required
        />
        <p className="text-xs text-muted-foreground">
          Used in URLs. Only lowercase letters, numbers, and hyphens.
        </p>
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
          <Label>Other languages</Label>
          <p className="text-xs text-muted-foreground">
            Additional languages to translate into using AI, alongside the default language.
          </p>
          <Combobox
            multiple
            autoHighlight
            items={LOCALES.filter((l) => l.value !== defaultLanguage)}
            value={otherLanguages}
            onValueChange={(vals) => setOtherLanguages(vals as LocaleItem[])}
            isItemEqualToValue={(item, val) => item.value === (val as LocaleItem).value}
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
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {success && !error && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Changes saved.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
