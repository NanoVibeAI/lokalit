# Lokalit

A free, community-hosted localization management tool. Manage translation keys and multi-language content across all your projects from a single interface.

## Overview

Lokalit gives small teams a centralized place to manage all their translation work:

- **Create and manage projects** — organize localization work by product, service, or client; each project gets a unique slug
- **Manage localization keys** — define translation keys with optional descriptions, and provide translated values per language
- **Multi-language support** — add as many target languages as needed per project, selected from a full locale list
- **Project settings** — update project name, default language, and supported locales from a dedicated settings page
- **API-first design** — all data operations go through a REST API (`/api/projects`, `/api/projects/[slug]/keys`) making it easy to integrate with CI/CD or export pipelines

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Authentication | [Supabase Auth](https://supabase.com/docs/guides/auth) (OAuth 2.0 PKCE) |
| Session | [iron-session](https://github.com/vvo/iron-session) |

## Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Supabase project with an OAuth application configured

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Session
SESSION_SECRET=your-strong-random-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# OIDC OAuth application
OIDC_CLIENT_ID=<your-oauth-client-id>
OIDC_CLIENT_SECRET=<your-oauth-client-secret>
OIDC_REDIRECT_URI=http://localhost:3001/api/auth/callback/oidc
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server (port 3001) |
| `npm run build` | Build the app for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
lokalit/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/         # OIDC flow initiator — generates PKCE & redirects to Supabase
│   │   │   ├── callback/oidc/ # OIDC callback — exchanges code for tokens, sets session
│   │   │   └── logout/        # Destroys iron-session
│   │   ├── onboarding/        # Creates account + OWNER membership on first login
│   │   └── projects/          # CRUD for projects and localization keys
│   ├── home/                  # Dashboard (project list, new project dialog)
│   ├── onboarding/            # Onboarding page
│   └── projects/[slug]/       # Project detail, keys manager, settings
├── components/ui/             # Shared UI components (shadcn/ui)
├── config/
│   └── locale.json            # Supported locales list
├── lib/
│   ├── db.ts                  # MongoDB connection
│   ├── locales.ts             # Locale utilities
│   └── session.ts             # iron-session configuration
├── models/
│   ├── Account.ts             # Account (organisation) record
│   ├── AccountMembership.ts   # Maps user subs to accounts with roles
│   ├── Project.ts             # Project record
│   ├── ProjectMembership.ts   # Maps user subs to projects with roles
│   └── LocalizationKey.ts     # Translation keys and values
├── public/                    # Static assets
├── .env.local                 # Local environment variables (not committed)
├── next.config.ts             # Next.js configuration
└── tsconfig.json              # TypeScript configuration
```

## Alternatives

Tools with similar features that inspired this project:

| Tool | Type | Notes |
|---|---|---|
| [Lokalise](https://lokalise.com) | Commercial SaaS | Full-featured TMS, team collaboration, CI/CD integrations — expensive for small teams |
| [Phrase](https://phrase.com) | Commercial SaaS | Enterprise-grade, strong API and workflow automation |
| [Crowdin](https://crowdin.com) | Commercial SaaS | Popular for open-source projects, has a free tier with limits |
| [POEditor](https://poeditor.com) | Commercial SaaS | Simple and affordable, but still paid beyond small limits |
| [Tolgee](https://tolgee.io) | Open Source / SaaS | Self-hostable, developer-friendly, in-context translation — closest open-source alternative |
| [Weblate](https://weblate.org) | Open Source / SaaS | Mature open-source TMS, community-hosted version available |
| [Traduora](https://traduora.co) | Open Source | Self-hosted translation management, no longer actively maintained |
