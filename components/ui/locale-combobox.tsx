"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { LOCALES } from "@/lib/locales";

type Locale = (typeof LOCALES)[number];

interface Props {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function LocaleCombobox({ value, onChange, id }: Props) {
  const selectedLocale = LOCALES.find((l) => l.value === value) ?? null;

  return (
    <Combobox
      items={LOCALES}
      value={selectedLocale}
      onValueChange={(val) => { if (val) onChange((val as Locale).value); }}
      isItemEqualToValue={(item, val) => !!val && item.value === (val as Locale).value}
    >
      <ComboboxInput id={id} placeholder="Select language…" />
      <ComboboxContent>
        <ComboboxEmpty>No language found.</ComboboxEmpty>
        <ComboboxList>
          {(locale: { value: string; label: string }) => (
            <ComboboxItem key={locale.value} value={locale}>
              {locale.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

