import localeJson from "@/config/locale.json";

export const LOCALES: { value: string; label: string }[] = localeJson.map(
  ({ key, name }) => ({ value: key, label: `${name}` })
);
