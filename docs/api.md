# Lokalit API Reference

All routes are prefixed with `/api`. Authentication is cookie-based (`lokalit_session`, iron-session) unless noted otherwise.

---

## Auth

### `GET /api/auth/login`
Initiates the OIDC Authorization Code + PKCE flow.

Generates a PKCE verifier/challenge and `state`, stores them in the session cookie, then redirects the browser to the Supabase OIDC authorization endpoint.

**Response:** `302 Redirect` → Supabase `/auth/v1/oauth/authorize`

---

### `GET /api/auth/callback/oidc`
### `POST /api/auth/callback/oidc`
OIDC redirect callback. Exchanges the authorization code for tokens, decodes the JWT, sets the session, and redirects to home.

**Query / form params:** `code`, `state`, `error`

**Routing logic:**
| Condition | Redirect |
|---|---|
| Valid callback and token exchange | `/home` |
| Invalid callback params or token exchange error | `/api/auth/login` |

**Response:** `303 Redirect`

---

### `POST /api/auth/logout`
Destroys the session cookie.

**Response:** `200 { message }`

---

## Figma Plugin Auth

### `GET /api/auth/callback/figma`
OAuth redirect callback for the Figma plugin flow. Receives the authorization code from Supabase and stores it temporarily (10-minute TTL) keyed by `request_id` so the polling plugin can retrieve it.

**Query params:** `code`, `state` (= `request_id`), `error`

**Response:** `200 HTML` — "Authentication successful, you can close this tab"  
**Error:** `400 HTML` — on missing/invalid params or upstream error

---

### `GET /api/auth/figma/code`
Polling endpoint used by the Figma plugin to retrieve the authorization code after the user has completed the browser flow.

**Query params:** `request_id` (string, required)

**Response (pending):**
```json
{ "pending": true }
```

**Response (code ready — consumed and deleted atomically):**
```json
{ "code": "<authorization_code>" }
```

**Error:** `400 { "error": "Missing request_id" }`

---

## Account Selection

### `POST /api/account-select`
Switches the active session account. Optionally stores the selection as the user's default.

**Auth:** Session required

**Request body:**
```json
{ "accountId": "<ObjectId>", "setAsDefault": true }
```

**Response:** `200 { accountSlug }` | `403` if no membership | `404` if account not found

---

## Projects

### `POST /api/projects`
Creates a new project and adds the current user as `OWNER` in `ProjectMembership`.

**Auth:** Session required

**Request body:**
```json
{
  "name": "My Project",
  "slug": "my-project",          // optional; derived from name if omitted
  "defaultLanguage": "en",
  "otherLanguages": ["th", "ja"] // optional
}
```

**Response:** `201 { message, project }` | `409` if slug already taken

---

### `GET /api/projects?slug=<slug>`
Checks whether a project slug is available.

**Auth:** Session required

**Response:** `200 { available: boolean }`

---

### `PATCH /api/projects/[slug]`
Updates a project's name, slug, default language, and other languages.

**Auth:** Session required

**Request body:**
```json
{
  "name": "New Name",
  "slug": "new-slug",            // optional; derived from name if omitted
  "defaultLanguage": "en",
  "otherLanguages": ["th"]
}
```

**Response:** `200 { message, slug }` | `404` | `409` if new slug conflicts

---

## Localization Keys

### `GET /api/projects/[slug]/keys`
Returns all localization keys for a project, sorted by key name.

**Auth:** Session required

**Response:** `200 { keys: LocalizationKey[] }`

---

### `POST /api/projects/[slug]/keys`
Creates a new localization key.

**Auth:** Session required

**Request body:**
```json
{ "key": "common.save", "description": "Save button label" }
```

**Response:** `201 { key: LocalizationKey }` | `409` if key already exists

---

### `PATCH /api/projects/[slug]/keys/[keyId]`
Updates a localization key. Supports three mutually usable patch modes in a single request:

| Field in body | Effect |
|---|---|
| `values: { [lang]: string }` | Replaces the entire values map |
| `lang: string` + `value: string` | Sets a single language value |
| `lang: string` + `remove: true` | Removes a single language value |
| `key: string` | Renames the key |
| `description: string` | Updates the description |

**Auth:** Session required

**Response:** `200 { key: LocalizationKey }` | `404` | `409` if renamed key conflicts

---

### `DELETE /api/projects/[slug]/keys/[keyId]`
Deletes a localization key.

**Auth:** Session required

**Response:** `200 { message }` | `404`

---

## Figma Plugin

All Figma plugin routes accept `Authorization: Bearer <supabase_jwt>` in addition to the standard session cookie.

### `GET /api/figma/projects`
Returns all projects the authenticated user is a member of.

**Auth:** Bearer token or session

**Response:**
```json
{ "projects": [{ "_id": "...", "name": "My App", "slug": "my-app", "defaultLanguage": "en", "otherLanguages": ["th"] }] }
```

---

### `GET /api/figma/file-mapping?figmaFileId=<id>`
Returns the project linked to a Figma file, or `{ linked: false }` if not linked.

**Auth:** Bearer token or session

**Response (linked):**
```json
{ "linked": true, "projectId": "...", "projectSlug": "my-app" }
```
**Response (not linked):**
```json
{ "linked": false }
```

---

### `POST /api/figma/file-mapping`
Links (or re-links) a Figma file to a project. Upserts — safe to call when changing the linked project.

**Auth:** Bearer token or session

**Request body:**
```json
{ "figmaFileId": "abc123", "projectSlug": "my-app" }
```

**Response:** `200 { linked: true, projectId, projectSlug }` | `404` if project not found

---

### `DELETE /api/figma/file-mapping?figmaFileId=<id>`
Unlinks a Figma file from its project. Does not affect node plugin data stored inside the `.fig` file.

**Auth:** Bearer token or session

**Response:** `200 { message: "File unlinked." }`

---

## Data Shapes

### `LocalizationKey`
```ts
{
  _id: ObjectId
  projectId: ObjectId
  key: string            // e.g. "common.save"
  description: string
  values: { [locale: string]: string }  // e.g. { en: "Save", th: "บันทึก" }
  createdAt: Date
  updatedAt: Date
}
```

### `Project`
```ts
{
  _id: ObjectId
  name: string
  slug: string
  defaultLanguage: string
  otherLanguages: string[]
  createdAt: Date
  updatedAt: Date
}
```
