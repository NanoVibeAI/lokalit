import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import LogoutButton from "@/app/home/LogoutButton";
import ProjectSettingsForm from "./ProjectSettingsForm";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  if (!session.accountId) redirect("/onboarding");

  await connectDB();
  const project = await Project.findOne({ slug }).lean();
  if (!project) notFound();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Link href="/home" className="text-lg font-bold text-zinc-900 hover:opacity-75 transition-opacity">
              L10n
            </Link>
            <span className="text-zinc-300">/</span>
            <Link href={`/projects/${slug}`} className="text-sm font-medium text-zinc-700 hover:opacity-75 transition-opacity">
              {project.name}
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-sm font-medium text-zinc-500">Settings</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Project settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Update your project&apos;s name, slug, and default language.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <ProjectSettingsForm
            currentSlug={slug}
            initialName={project.name}
            initialSlug={project.slug}
            initialDefaultLanguage={project.defaultLanguage}
            initialOtherLanguages={project.otherLanguages ?? []}
          />
        </div>
      </main>
    </div>
  );
}
