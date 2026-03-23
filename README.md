# Lokalit

A free, community-hosted localization management tool for small teams. Manage translation keys and multi-language content across all your projects from a single interface.

## Overview

Lokalit gives small teams a centralized place to manage all their translation work:

- **User accounts with email verification** — secure registration, login, and onboarding flow with email confirmation
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
| Authentication | [Passport.js](https://www.passportjs.org/) (Local Strategy) |
| Database | [MongoDB](https://www.mongodb.com/) |

## Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# MongoDB
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# Session
SESSION_SECRET=your-strong-random-secret
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the app for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
lokalit/
├── app/
│   ├── api/
│   │   ├── auth/          # login, logout, register, verify endpoints
│   │   ├── onboarding/    # post-registration onboarding
│   │   └── projects/      # CRUD for projects and localization keys
│   ├── home/              # Dashboard (project list, new project dialog)
│   ├── login/             # Login page
│   ├── onboarding/        # Onboarding page
│   ├── projects/[slug]/   # Project detail, keys manager, settings
│   └── register/          # Registration page
├── components/ui/         # Shared UI components (shadcn/ui)
├── config/
│   └── locale.json        # Supported locales list
├── lib/
│   ├── db.ts              # MongoDB connection
│   ├── email.ts           # Nodemailer email helper
│   ├── locales.ts         # Locale utilities
│   └── session.ts         # iron-session configuration
├── models/                # Mongoose models (User, Account, Project, LocalizationKey)
├── public/                # Static assets
├── .env.local             # Local environment variables (not committed)
├── next.config.ts         # Next.js configuration
└── tsconfig.json          # TypeScript configuration
```

## Authentication Flow

Authentication uses **iron-session** (cookie-based, server-side) with email + password credentials stored in MongoDB (passwords hashed with bcrypt). New accounts require **email verification** before access is granted. After verifying, users complete a short **onboarding step** before reaching the dashboard. Unauthenticated requests are redirected to `/login`.

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
