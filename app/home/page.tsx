import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import type { Project } from "@/lib/types";
import LogoutButton from "./LogoutButton";
import NewProjectDialog from "./NewProjectDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2Icon } from "lucide-react";

async function getProjects(userSub: string): Promise<Pick<Project, "id" | "name" | "slug" | "description" | "default_language" | "created_at">[]> {
  const { data: memberships } = await db
    .schema("apps_lokalit")
    .from("project_memberships")
    .select("project_id")
    .eq("user_sub", userSub);
  const projectIds = (memberships ?? []).map((m) => m.project_id);
  if (projectIds.length === 0) return [];
  const { data: projects } = await db
    .schema("apps_lokalit")
    .from("projects")
    .select("id, name, slug, description, default_language, created_at")
    .in("id", projectIds)
    .order("created_at", { ascending: false });
  return projects ?? [];
}

export default async function HomePage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/api/auth/login");
  }

  if (!session.accountId) {
    redirect("/account-select");
  }

  const projects = await getProjects(session.userId!);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-zinc-900">Lokalit</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Projects</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage translation projects across your products and services.
            </p>
          </div>
          <NewProjectDialog />
        </div>

        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProjectCard({
  project,
}: {
  project: Pick<Project, "id" | "name" | "slug" | "description" | "default_language" | "created_at">;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/projects/${project.slug}`}
            className="flex-1 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <CardTitle className="truncate text-base">{project.name}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground font-mono">{project.slug}</p>
          </Link>
          <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              aria-label="Project settings"
              render={<Link href={`/projects/${project.slug}/settings`} />}
            >
              <Settings2Icon />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
        <svg
          className="h-6 w-6 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7h18M3 12h18M3 17h10"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">No projects yet</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Create your first project to start managing translations.
      </p>
    </div>
  );
}
