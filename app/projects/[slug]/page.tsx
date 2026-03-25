import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import LogoutButton from "@/app/home/LogoutButton";
import { Badge } from "@/components/ui/badge";
import KeysManager, { type LocalizationKeyData } from "./KeysManager";
import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOCALES } from "@/lib/locales";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await getSession();
  if (!session.isLoggedIn) redirect("/api/auth/login");

  const { data: project } = await db
    .schema("apps_lokalit")
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) notFound();

  const { data: rawKeys } = await db
    .schema("apps_lokalit")
    .from("localization_keys")
    .select("*")
    .eq("project_id", project.id)
    .order("key", { ascending: true });

  const initialKeys: LocalizationKeyData[] = (rawKeys ?? []).map((k) => ({
    _id: k.id,
    key: k.key,
    description: k.description ?? "",
    values: (k.values as Record<string, string>) ?? {},
  }));

  return (
    <div className="flex h-screen flex-col bg-zinc-50">
      {/* Top nav */}
      <header className="shrink-0 border-b border-zinc-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="text-base font-bold text-zinc-900 transition-opacity hover:opacity-75"
            >
              Lokalit
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-sm font-medium text-zinc-700">{project.name}</span>
            <Badge variant="outline" className="text-xs">
              {LOCALES.find((l) => l.value === project.default_language)?.label ?? project.default_language}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/projects/${slug}/settings`}>
              <Button variant="ghost" size="icon-sm" title="Project settings">
                <SettingsIcon />
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Two-panel keys manager */}
      <KeysManager
        projectSlug={slug}
        defaultLanguage={project.default_language}
        initialKeys={initialKeys}
      />
    </div>
  );
}
