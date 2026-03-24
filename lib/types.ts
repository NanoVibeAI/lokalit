// TypeScript types for the apps_lokalit Supabase schema
// Hand-crafted from the migration DDL

export type AccountRole = "OWNER" | "ADMIN" | "MEMBER";
export type ProjectRole = "OWNER" | "EDITOR" | "VIEWER";

export interface Account {
  id: string;
  account_id: string;  // slug e.g. "great-eastern"
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AccountMembership {
  id: string;
  account_id: string;  // FK → accounts.id
  user_sub: string;
  role: AccountRole;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  default_language: string;
  other_languages: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMembership {
  id: string;
  project_id: string;  // FK → projects.id
  user_sub: string;
  role: ProjectRole;
  created_at: string;
  updated_at: string;
}

export interface LocalizationKey {
  id: string;
  project_id: string;  // FK → projects.id
  key: string;
  description: string;
  values: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface FigmaFileMapping {
  id: string;
  file_id: string;
  project_slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreference {
  id: string;
  user_sub: string;
  default_account_id: string | null;  // FK → accounts.id
  created_at: string;
  updated_at: string;
}

export interface OAuthIntegration {
  id: string;
  key: "figma";
  request_id: string;
  code: string;
  created_at: string;
}

// Database type for typed Supabase client
export type Database = {
  apps_lokalit: {
    Tables: {
      accounts: { Row: Account; Insert: Omit<Account, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Account, "id">>; };
      account_memberships: { Row: AccountMembership; Insert: Omit<AccountMembership, "id" | "created_at" | "updated_at">; Update: Partial<Omit<AccountMembership, "id">>; };
      projects: { Row: Project; Insert: Omit<Project, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Project, "id">>; };
      project_memberships: { Row: ProjectMembership; Insert: Omit<ProjectMembership, "id" | "created_at" | "updated_at">; Update: Partial<Omit<ProjectMembership, "id">>; };
      localization_keys: { Row: LocalizationKey; Insert: Omit<LocalizationKey, "id" | "created_at" | "updated_at">; Update: Partial<Omit<LocalizationKey, "id">>; };
      figma_file_mappings: { Row: FigmaFileMapping; Insert: Omit<FigmaFileMapping, "id" | "created_at" | "updated_at">; Update: Partial<Omit<FigmaFileMapping, "id">>; };
      user_preferences: { Row: UserPreference; Insert: Omit<UserPreference, "id" | "created_at" | "updated_at">; Update: Partial<Omit<UserPreference, "id">>; };
      oauth_integrations: { Row: OAuthIntegration; Insert: Omit<OAuthIntegration, "id" | "created_at">; Update: Partial<Omit<OAuthIntegration, "id">>; };
    };
  };
};
