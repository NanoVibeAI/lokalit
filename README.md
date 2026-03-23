# Lokalit

A free, community-hosted localization management tool. Manage translation keys and multi-language content across all your projects from a single interface.

## Overview

Lokalit gives small teams a centralized place to manage all their translation work:

- **Single sign-on via Supabase** — authentication handled entirely by Supabase Auth using the OAuth 2.0 Authorization Code + PKCE flow; no passwords stored in the app
- **Account & project memberships** — users are linked to accounts and projects through role-based membership collections (OWNER, ADMIN, MEMBER / OWNER, EDITOR, VIEWER)
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
| Database | [MongoDB](https://www.mongodb.com/) |

## Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Supabase project with an OAuth application configured

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# MongoDB
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

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

## Authentication Flow

Authentication uses **Supabase Auth** as the identity provider via the **OAuth 2.0 Authorization Code + PKCE** flow. No passwords or user credentials are stored in the application database.

1. Visiting `/api/auth/login` generates a PKCE code verifier + challenge and redirects the browser to Supabase's `/auth/v1/oauth/authorize`.
2. After the user authenticates with Supabase, the browser is redirected back to `/api/auth/callback/oidc` with an authorization code.
3. The callback exchanges the code for tokens at `/auth/v1/oauth/token` using HTTP Basic auth, decodes the JWT to extract the user's `sub` and `email`, and saves an **iron-session** cookie.
4. If the user has no account membership yet, they are directed to `/onboarding` to create one. Otherwise they land on `/home`.

Unauthenticated requests are redirected to `/api/auth/login`.

## Core Concepts

### Project
A project represents a product, service, or client that needs localization. Each project has a unique slug, a default language, and a list of supported locales.

### Localization Key
A key (e.g., `home.title`, `button.submit`) belongs to a project and holds translated values for each supported language. Keys can have an optional description for translator context. Translators manage values per locale from the Keys Manager UI.

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
