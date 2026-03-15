# Saree Store

Production-ready e-commerce platform for a saree store. Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Postgres + Storage). Deployable on Vercel.

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Services](#services)
- [Setup](#setup)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  Public Store    │              │  Admin Panel     │        │
│  │  (Store Routes)  │              │  (Admin Routes)  │        │
│  └────────┬─────────┘              └─────────┬────────┘        │
│           │                                   │                 │
└───────────┼───────────────────────────────────┼─────────────────┘
            │                                   │
┌───────────┼───────────────────────────────────┼─────────────────┐
│           │        NEXT.JS LAYER              │                 │
│           │                                   │                 │
│  ┌────────▼─────────────────────────────────▼─────────┐       │
│  │              Middleware                            │       │
│  │  • JWT Auth Check   • Admin Route Protection      │       │
│  └───────────────────────┬────────────────────────────┘       │
│                          │                                     │
│  ┌───────────────────────▼────────────────────────────┐       │
│  │           Server Components & Actions              │       │
│  │  • Server-side Rendering  • Data Mutations         │       │
│  │  • Form Handling          • Cache Revalidation     │       │
│  └───────────────────────┬────────────────────────────┘       │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────┐
│    DATA & STORAGE LAYER  │                                     │
│                          │                                     │
│  ┌───────────────────────▼────────────────────────────┐       │
│  │          Storage Abstraction Layer                 │       │
│  │  • Supabase Provider   • Local Provider            │       │
│  │  • /api/media/[...key] Route Handler               │       │
│  └─────────────┬─────────────────────┬────────────────┘       │
│                │                     │                         │
│  ┌─────────────▼──────────┐   ┌─────▼──────────────┐         │
│  │  Supabase Storage      │   │  Postgres DB        │         │
│  │  • Product Images      │   │  • 12 Tables        │         │
│  │  • Public Bucket       │   │  • RLS Enabled      │         │
│  └────────────────────────┘   └─────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Application Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      REQUEST LIFECYCLE                           │
└──────────────────────────────────────────────────────────────────┘

1. CLIENT REQUEST
   │
   ├─→ Public Route (/saree/[slug], /, /kanchipuram-silks)
   │   └─→ Middleware passes through
   │       └─→ Server Component renders
   │           └─→ Supabase query (server client)
   │               └─→ Response with data
   │
   └─→ Admin Route (/admin/*)
       └─→ Middleware checks JWT cookie
           ├─→ Valid admin JWT → Allow
           │   └─→ Server Component/Action
           │       └─→ Supabase query
           │           └─→ Response
           │
           └─→ Invalid/Missing JWT → Redirect to /admin/login
               └─→ Login form submission
                   └─→ Server Action validates credentials
                       └─→ Sign JWT + Set cookie
                           └─→ Redirect to /admin
```

### Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  app_users   │  (Custom auth table)
│  table       │  • email (unique)
│              │  • password_hash (bcryptjs)
└──────┬───────┘  • role (customer | admin)
       │
       │ Validate
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Login Flow                                                  │
│                                                              │
│  1. POST /admin/login                                        │
│     • Email + Password                                       │
│                                                              │
│  2. Server Action (auth.ts)                                  │
│     • Query app_users by email                               │
│     • Verify password with bcryptjs                          │
│     • Check role === "admin"                                 │
│                                                              │
│  3. Sign JWT (jose library)                                  │
│     • Payload: { sub, email, role }                          │
│     • Secret: AUTH_SECRET env var                            │
│     • Expires: 7 days                                        │
│                                                              │
│  4. Set HTTP-only cookie                                     │
│     • Name: "session"                                        │
│     • Secure in production                                   │
│     • SameSite: lax                                          │
│                                                              │
│  5. Redirect to /admin                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Authorization (Middleware)                                  │
│                                                              │
│  Every /admin/* request:                                     │
│  1. Extract JWT from cookie                                  │
│  2. Verify signature with AUTH_SECRET                        │
│  3. Check role === "admin"                                   │
│  4. Allow or redirect to /admin/login                        │
└──────────────────────────────────────────────────────────────┘
```

### Product Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                  PRODUCT WORKFLOW STATE MACHINE                  │
└─────────────────────────────────────────────────────────────────┘

NEW PRODUCT:
┌─────────┐  submit    ┌─────────┐  approve   ┌──────────┐
│  draft  ├───────────►│ pending ├───────────►│ approved │
└─────────┘            └────┬────┘            └────┬─────┘
                            │                      │
                            │ reject               │ discontinue
                            ▼                      ▼
                       ┌─────────┐            ┌──────────────┐
                       │rejected │            │ discontinued │
                       └─────────┘            └──────┬───────┘
                                                     │ re-enable
                                                     ▼
                                                ┌──────────┐
                                                │ approved │
                                                └──────────┘

APPROVED PRODUCT EDITS:
┌──────────┐
│ approved │ (live product)
└────┬─────┘
     │ edit
     ▼
┌──────────────────┐  submit   ┌────────────────┐  approve  ┌─────────────┐
│ product_drafts   ├──────────►│ draft: pending ├──────────►│ apply draft │
│ status: draft    │            └────────┬───────┘           │ to live     │
└──────────────────┘                     │                   └─────────────┘
                                         │ reject
                                         ▼
                                    ┌────────────────┐
                                    │ draft:rejected │
                                    └────────────────┘

RULES:
• Only draft products can be submitted for first approval
• Requires ≥1 image to submit
• Approved products: edits go to product_drafts
• Discontinued products hidden from public but data preserved
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW PATTERNS                          │
└─────────────────────────────────────────────────────────────────┘

READ FLOW (Server Components):
  Browser Request
       │
       ▼
  Server Component (page.tsx)
       │
       ├─→ createClient() [lib/supabase/server.ts]
       │   └─→ createServerClient with cookies()
       │
       ├─→ Supabase query (SELECT)
       │   └─→ RLS policies enforced
       │       └─→ Data returned
       │
       └─→ Render JSX with data
           └─→ HTML Response

WRITE FLOW (Server Actions):
  Form Submit
       │
       ▼
  Server Action (actions/*.ts)
       │
       ├─→ createClient() [lib/supabase/server.ts]
       │
       ├─→ Validate input from FormData
       │
       ├─→ Supabase mutation (INSERT/UPDATE/DELETE)
       │   └─→ RLS policies enforced
       │
       ├─→ revalidatePath() [cache invalidation]
       │   └─→ Clear Next.js cache for affected routes
       │
       └─→ Return { error } or { success }
           └─→ Client handles response

IMAGE UPLOAD FLOW:
  Admin uploads image
       │
       ▼
  Server Action: uploadProductImage()
       │
       ├─→ Generate storage_key
       │   └─→ "product_id/uuid.ext"
       │
       ├─→ getStorageProvider()
       │   └─→ supabaseProvider.upload()
       │       └─→ Upload to bucket: product-images
       │
       ├─→ Insert record: product_images table
       │   └─→ { storage_key, product_id, sort_order }
       │
       └─→ revalidatePath()

IMAGE SERVE FLOW:
  Browser requests <img src="/api/media/abc/xyz.jpg" />
       │
       ▼
  Route: /api/media/[...key]/route.ts
       │
       ├─→ getStorageProvider()
       │   └─→ supabaseProvider.download()
       │       └─→ Fetch from Supabase Storage
       │
       └─→ Stream response with Content-Type
```

---

## Features

### Public Store Features

#### 1. Homepage
- **Signature Carousel**: Rotating product images from products marked `show_on_homepage`
- **Brand Story Section**: About the saree store
- **Curated Preview Grid**: Grid of featured products with primary images
- **Configurable Rotation**: Admin-controlled carousel rotation speed

#### 2. Kanchipuram Silks Collection (`/kanchipuram-silks`)
- Filterable product grid (approved products only)
- Display: product image, title, SKU, INR/AED prices
- Stock status indicator
- Responsive grid layout

#### 3. Product Detail Page (`/saree/[slug]`)
- **Image Gallery**: Sortable product images with zoom
- **Dual Currency Pricing**: INR and AED
- **Product Specifications**: Dynamic attributes from `attribute_definitions`
- **Stock Status**: In stock / Low stock / Out of stock
- **Contact Actions**:
  - WhatsApp Order button (template supports `{title}`, `{sku}`)
  - Call button with configurable number
- **Similar Products**: (planned)

#### 4. Information Page
- Static content page for policies, contact, about

---

### Admin Panel Features

#### 1. Dashboard (`/admin/dashboard`)
- Total product count
- Total types count
- Quick links to:
  - Products
  - Types
  - Attribute Definitions
  - Settings

#### 2. Product Management (`/admin/products`)
- **List View**:
  - All products with status badges (draft, pending, approved, rejected, discontinued)
  - Filter by status
  - Quick actions: Edit, Delete
- **Create/Edit**:
  - Basic info: title, slug, SKU, name, product_code
  - Pricing: INR, AED
  - Type association
  - Description (textarea)
  - Stock status dropdown
  - Toggles: featured, new_arrival, show_on_homepage
  - Dynamic attributes from `attribute_definitions` (grouped)
- **Image Management**:
  - Upload multiple images
  - Drag-and-drop reorder
  - Set primary image
  - Set homepage image
  - Alt text editing
  - Delete images
- **Workflow Actions**:
  - Submit for Approval (draft → pending)
  - Approve Product (pending → approved)
  - Reject Product (pending → rejected, with reason)
  - Discontinue Product (soft delete with reason)
  - Re-enable Discontinued Product
  - Permanent Delete (requires typing product_code or "DELETE")
- **Edit Draft System** (for approved products):
  - Save Draft (stores changes in `product_drafts`)
  - Submit Draft for Approval
  - Approve Draft (applies changes to live product)
  - Reject Draft (with reason)

#### 3. Type Management (`/admin/types`)
- CRUD for product types/categories
- Fields: name, slug, banner_url, sort_order
- Used for product categorization

#### 4. Attribute Definitions (`/admin/attributes`)
- **Global Attribute Schema**: Define product specifications
- **Fields**:
  - Key (unique identifier)
  - Label (display name)
  - Group (e.g., "Specifications", "Dimensions")
  - Input Type: text, textarea, select
  - Options (JSON array for select type)
  - Sort Order
  - Is Active (toggle visibility)
  - Is Required (enforce on product creation)
- **Dynamic Form Generation**: Product forms auto-generate fields from active definitions
- **Validation**: Required attributes enforced in Server Actions

#### 5. Settings (`/admin/settings`)
- **Store Settings**:
  - WhatsApp number
  - Call number
  - WhatsApp message template (supports placeholders)
- **Site Settings**:
  - Business name
  - Contact phone, WhatsApp, email
  - Address text
  - Instagram URL
  - Support hours
  - Homepage carousel rotation seconds

#### 6. Authentication
- **Admin Login** (`/admin/login`): Email + password
- **Logout**: Clears JWT session cookie
- **Role-based Access Control**: Only `role = 'admin'` in `app_users`

---

## Services

### 1. Authentication Service

**Location**: `src/lib/auth/`

**Components**:
- `session.ts`: JWT signing/verification, session management
- `password.ts`: bcryptjs hashing and verification
- `middleware-auth.ts`: Edge-compatible JWT verification for middleware

**Key Functions**:
- `signToken(payload, maxAge)`: Create JWT with HS256
- `verifyToken(token)`: Validate JWT and return user
- `getSession()`: Server-side session retrieval
- `setSessionCookie(token)`: Set HTTP-only cookie
- `clearSessionCookie()`: Logout
- `requireAdmin()`: Throws if not admin (for Server Actions)
- `getSessionFromRequest(request)`: Middleware JWT check

**Security**:
- HTTP-only cookies (no XSS access)
- Secure flag in production
- 7-day expiration
- Requires `AUTH_SECRET` env var (≥32 chars)

---

### 2. Storage Service

**Location**: `src/lib/storage/`

**Architecture**:
```typescript
interface StorageProvider {
  upload(key: string, file: File, opts?: UploadOpts): Promise<void>;
  download(key: string, opts?: DownloadRangeOpts): Promise<DownloadResult>;
  delete(key: string): Promise<void>;
  head(key: string): Promise<HeadResult>;
}
```

**Providers**:
- **Cloudflare R2 Provider** (`cloudflare-r2-provider.ts`): Default, uses S3-compatible API with zero egress
- **Supabase Provider** (`supabase-provider.ts`): Legacy support
- **Local Provider** (`local-provider.ts`): File system storage for local dev

**Media URL System**:
- Images stored with `storage_key` (e.g., `abc123/uuid.jpg`)
- Served via `/api/media/[...key]` route handler
- Three delivery modes:
  - **Stream**: App downloads and streams (works everywhere)
  - **Redirect**: 302 to Cloudflare CDN URL (zero app bandwidth)
  - **Hybrid**: Admin=stream, Public=redirect (best for production)
- Supports range requests for video (future)
- Automatic Content-Type detection

**Configuration**:
- Env var: `STORAGE_PROVIDER` (default: `cloudflare-r2`)
- Delivery mode: `MEDIA_DELIVERY_MODE` (default: `stream`)
- Custom domain: `CLOUDFLARE_R2_PUBLIC_BASE_URL` (optional, for redirect mode)

**Why Cloudflare R2:**
- Zero egress costs (vs Supabase Storage ~$0.09/GB)
- S3-compatible (portable, no vendor lock-in)
- Global CDN performance
- Simple custom domain setup

See [STORAGE_MIGRATION.md](STORAGE_MIGRATION.md) for architecture details and migration guide.

---

### 3. Product Service

**Location**: `src/app/actions/products.ts`

**Key Actions**:

**CRUD**:
- `createProduct(formData)`: Insert product with status=draft
- `updateProduct(id, formData)`: Update product fields
- `deleteProductPermanently(id, productCode, confirmation)`: Hard delete with confirmation

**Image Management**:
- `uploadProductImage(productId, formData)`: Upload via storage provider + insert DB record
- `updateProductImageOrder(productId, imageIds[])`: Reorder by sort_order
- `setPrimaryProductImage(imageId, productId)`: Set is_primary flag
- `updateProductImage(imageId, productId, payload)`: Update alt_text, show_on_homepage
- `deleteProductImage(imageId, productId)`: Remove image

**Workflow**:
- `submitProductForApproval(productId)`: draft → pending (requires ≥1 image)
- `approveProduct(productId)`: pending → approved
- `rejectProduct(productId, reason)`: pending → rejected
- `discontinueProduct(productId, reason)`: approved → discontinued (soft)
- `reEnableProduct(productId)`: discontinued → approved

**Draft System** (for approved products):
- `saveProductDraft(productId, draftData)`: Upsert to `product_drafts`
- `submitDraftForApproval(productId)`: draft → pending
- `approveDraft(productId)`: Apply draft to live product
- `rejectDraft(productId, reason)`: Reject draft edits

**Validation**:
- Required attribute checks (from `attribute_definitions`)
- Image count validation for submission
- Status transition guards

**Cache Invalidation**:
- Revalidates: `/`, `/kanchipuram-silks`, `/admin/products`, `/saree/[slug]`

---

### 4. Attribute Service

**Location**: `src/app/actions/attribute-definitions.ts`

**Key Actions**:
- `createAttributeDefinition(formData)`: Insert new attribute definition
- `updateAttributeDefinition(key, formData)`: Update existing definition
- `toggleAttributeActive(key, isActive)`: Enable/disable attribute (no delete to preserve data)

**Data Fetching** (`src/lib/data/attribute-definitions.ts`):
- `getActiveAttributeDefinitions()`: All active definitions (for product forms)
- `getProductSpecsForDisplay(productId, attributesJSON)`: Merge `product_attribute_values` + legacy JSONB

**Features**:
- **Dynamic Form Generation**: Product forms auto-render fields based on definitions
- **Group Support**: Group attributes (e.g., "Specifications", "Dimensions")
- **Input Types**: text, textarea, select (with JSON options)
- **Required Validation**: Server-side enforcement in product actions

---

### 5. Type Service

**Location**: `src/app/actions/types.ts`

**Key Actions**:
- `createType(formData)`: Insert type with slug, name, banner_url, sort_order
- `updateType(id, formData)`: Update type
- `deleteType(id)`: Delete type (sets product.type_id to NULL via ON DELETE SET NULL)

**Usage**:
- Product categorization (e.g., "Kanchipuram Silk", "Cotton")
- Future: Type-specific landing pages

---

### 6. Settings Service

**Location**: `src/app/actions/settings.ts`

**Tables**:
- `store_settings`: WhatsApp/call numbers, message template (single row)
- `site_settings`: Business info, social links, homepage config (single row)

**Key Actions**:
- `updateStoreSettings(formData)`: Update store settings
- `updateSiteSettings(formData)`: Update site settings

**Data Fetching** (`src/lib/data/site-settings.ts`):
- `getSiteSettings()`: Fetch site settings row

---

### 7. Supabase Client Service

**Location**: `src/lib/supabase/`

**Clients**:
- `server.ts`: Server Components & Actions (uses `cookies()`)
- `browser.ts`: Client Components (uses `createBrowserClient`)
- `middleware.ts`: Middleware (uses `updateSession`)

**Configuration**:
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-side cookie management
- Automatic session refresh

---

### 8. Data Layer

**Location**: `src/lib/data/`

**Modules**:
- `sarees.ts`: Product data fetching (with seed data fallback)
  - `listSarees()`: All approved, non-discontinued products
  - `getSareeBySlug(slug)`: Single product
  - `listSareesForHomepage(limit)`: Homepage carousel/grid
  - `getCarouselImageUrls(limit)`: Image URLs for carousel
- `attribute-definitions.ts`: Attribute schema management
- `site-settings.ts`: Settings fetching

**Seed Data**:
- Fallback to 3 hardcoded products if DB is empty
- Enables demo mode without DB setup

---

## Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account (for database only)
- **Cloudflare** account (for R2 storage)
- **bcryptjs** for password hashing
- **AUTH_SECRET** env var (≥32 random characters)

---

### 1. Install Dependencies

```bash
npm install
```

---

### 2. Supabase Setup

#### Create Project
1. Create a project at [supabase.com](https://supabase.com)
2. Copy **Project URL** and **anon public** key from **Settings** → **API**

#### Run Migrations

In **SQL Editor**, run migrations in this order:

```
1. supabase/migrations/20240225000001_initial_schema.sql
2. supabase/migrations/20240225000002_rls_and_auth.sql
3. supabase/migrations/20240225000003_storage.sql
4. supabase/migrations/20240225100000_fix_profiles_admin_policy_recursion.sql
5. supabase/migrations/20250225000001_product_images_and_homepage.sql
6. supabase/migrations/20250226000001_attribute_definitions.sql
7. supabase/migrations/20250226000002_product_attribute_values.sql
8. supabase/migrations/20250226000003_site_settings.sql
9. supabase/migrations/20250227000001_disable_rls_portable_db.sql
10. supabase/migrations/20250227000002_app_users_and_storage_key.sql
11. supabase/migrations/20250228000001_product_lifecycle_and_drafts.sql
```

#### Storage Bucket

The migration creates the bucket, but verify:
- **Storage** → Bucket: `product-images`
- **Public**: Yes
- **Policies**: Public read; authenticated insert/update/delete

---

### 3. Cloudflare R2 Setup (Storage)

The app uses Cloudflare R2 for media/image storage (zero egress costs).

#### Create R2 Bucket
1. Go to Cloudflare Dashboard → **R2**
2. Create bucket: **`product-images`**
3. Note your **Account ID** (visible in dashboard URL)

#### Generate API Tokens
1. R2 → **Manage R2 API Tokens**
2. **Create API Token** with:
   - Permissions: **Object Read & Write**
   - TTL: No expiry
   - Specific Bucket: **product-images** (recommended) or All buckets
3. Copy credentials:
   - **Access Key ID**
   - **Secret Access Key**

#### Optional: Custom Domain (for production CDN)
1. R2 → Select bucket → **Settings** → **Public Access**
2. **Connect Custom Domain** (e.g., `cdn.yourstore.com`)
3. Add CNAME to your DNS: `cdn.yourstore.com` → `{bucket}.{account-id}.r2.cloudflarestorage.com`
4. Wait for SSL provisioning (~5 minutes)
5. Test: `https://cdn.yourstore.com/test.jpg`

**Note:** Custom domain enables redirect mode for zero app bandwidth usage.

---

### 4. Environment Variables

Create `.env.local`:

```bash
# Supabase (Database only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Authentication (REQUIRED: ≥32 characters)
AUTH_SECRET=your-random-secret-at-least-32-chars-long

# Cloudflare R2 Storage (REQUIRED)
STORAGE_PROVIDER=cloudflare-r2
CLOUDFLARE_R2_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CLOUDFLARE_R2_BUCKET=product-images

# Optional: Custom domain for CDN redirect mode (production)
# CLOUDFLARE_R2_PUBLIC_BASE_URL=https://cdn.yourstore.com

# Optional: Media delivery mode (default: stream)
# MEDIA_DELIVERY_MODE=hybrid  # stream | redirect | hybrid
```

**Generate AUTH_SECRET**:
```bash
# macOS/Linux
openssl rand -base64 32

# Or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Storage Provider Options:**
- `cloudflare-r2` (default, production)
- `local` (development, filesystem)
- `supabase` (legacy, if needed)

**Media Delivery Modes:**
- `stream` (default): App streams images (works everywhere, uses app bandwidth)
- `redirect`: App redirects to R2 CDN URL (zero app bandwidth, requires custom domain)
- `hybrid`: Admin=stream, Public=redirect (best for production)

See [STORAGE_MIGRATION.md](STORAGE_MIGRATION.md) for detailed configuration guide.

---

### 4. Create Admin User

#### Method 1: Direct SQL Insert

In Supabase **SQL Editor**:

```sql
-- Hash your password first (use Node.js or online bcrypt tool with 10 rounds)
-- Example: password "admin123" → $2a$10$...

INSERT INTO public.app_users (email, password_hash, role)
VALUES (
  'admin@example.com',
  '$2a$10$YourBcryptHashHere',
  'admin'
);
```

#### Method 2: Use Script (Recommended)

Create a script `scripts/create-admin.js`:

```javascript
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Password hash:', hash);
  console.log('\nRun this SQL in Supabase:');
  console.log(`INSERT INTO public.app_users (email, password_hash, role)
VALUES ('your-email@example.com', '${hash}', 'admin');`);
}

hashPassword('your-secure-password');
```

Run:
```bash
node scripts/create-admin.js
```

Then execute the generated SQL in Supabase.

---

### 5. Run Locally

```bash
npm run dev
```

- **Public Store**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Admin Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

### 6. Development Notes

#### Seed Data
If the `products` table is empty, the app serves 3 hardcoded seed products for demo purposes.

#### Hot Reload
Next.js dev server supports Fast Refresh. Changes to Server Actions require browser refresh.

#### Database Inspection
Use Supabase **Table Editor** to inspect data or run queries in **SQL Editor**.

---

## Deployment

### Vercel (Recommended)

#### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/saree-store.git
git push -u origin main
```

#### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) and import your repository
2. **Framework Preset**: Next.js (auto-detected)
3. **Root Directory**: `./`
4. **Build Command**: `next build` (default)
5. **Output Directory**: `.next` (default)

#### 3. Environment Variables

Add in Vercel project **Settings** → **Environment Variables**:

```
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Auth
AUTH_SECRET=your-random-secret-at-least-32-chars-long

# Storage (Cloudflare R2)
STORAGE_PROVIDER=cloudflare-r2
CLOUDFLARE_R2_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CLOUDFLARE_R2_BUCKET=product-images

# Optional: Production CDN
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://cdn.yourstore.com
MEDIA_DELIVERY_MODE=hybrid
```

Apply to: **Production, Preview, Development**

#### 4. Deploy
Click **Deploy**. Vercel will build and deploy automatically.

---

### Other Platforms

#### Netlify
1. Import repo
2. Build command: `next build`
3. Publish directory: `.next`
4. Add environment variables
5. Enable Next.js runtime plugin

#### Self-Hosted
```bash
npm run build
npm run start
```

Requires Node.js server. Use PM2 or systemd for process management.

---

## Project Structure

```
saree-store/
├── src/
│   ├── app/
│   │   ├── (store)/              # Public store routes (with header/footer)
│   │   │   ├── layout.tsx        # Store layout wrapper
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── kanchipuram-silks/
│   │   │   │   ├── page.tsx      # Product grid page
│   │   │   │   └── KanchipuramSilksClient.tsx
│   │   │   ├── saree/[slug]/
│   │   │   │   └── page.tsx      # Product detail page
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Customer login (future)
│   │   │   └── information/
│   │   │       └── page.tsx      # Policies, contact, about
│   │   │
│   │   ├── (admin)/              # Admin routes (protected by middleware)
│   │   │   ├── layout.tsx        # Admin layout wrapper
│   │   │   └── admin/
│   │   │       ├── page.tsx      # Admin redirect
│   │   │       ├── login/
│   │   │       │   ├── page.tsx
│   │   │       │   └── AdminLoginMessage.tsx
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx  # Dashboard with counts
│   │   │       ├── products/
│   │   │       │   ├── page.tsx  # Product list
│   │   │       │   ├── new/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [id]/edit/
│   │   │       │       └── page.tsx
│   │   │       ├── types/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/page.tsx
│   │   │       │   └── [id]/edit/page.tsx
│   │   │       ├── attributes/
│   │   │       │   └── page.tsx  # Attribute definitions
│   │   │       └── settings/
│   │   │           └── page.tsx  # Store/site settings
│   │   │
│   │   ├── actions/              # Server Actions
│   │   │   ├── products.ts       # Product CRUD + workflow
│   │   │   ├── types.ts          # Type CRUD
│   │   │   ├── attribute-definitions.ts
│   │   │   ├── settings.ts       # Settings updates
│   │   │   └── auth.ts           # Login/logout
│   │   │
│   │   ├── api/
│   │   │   └── media/[...key]/
│   │   │       └── route.ts      # Media file serving
│   │   │
│   │   ├── layout.tsx            # Root layout (fonts, global styles)
│   │   └── globals.css           # Tailwind imports
│   │
│   ├── components/
│   │   ├── admin/                # Admin-specific components
│   │   │   ├── AdminShell.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductImageManager.tsx
│   │   │   ├── ProductWorkflowActions.tsx
│   │   │   ├── ProductEditStickyFooter.tsx
│   │   │   ├── ProductEditBanners.tsx
│   │   │   ├── EditProductClientLayout.tsx
│   │   │   ├── TypeForm.tsx
│   │   │   ├── DeleteTypeButton.tsx
│   │   │   ├── AttributeDefinitionsManager.tsx
│   │   │   ├── SettingsForm.tsx
│   │   │   └── SiteSettingsForm.tsx
│   │   │
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── PublicHeader.tsx
│   │   │   ├── PublicFooter.tsx
│   │   │   └── Container.tsx
│   │   │
│   │   ├── saree/                # Product display components
│   │   │   ├── SareeCard.tsx
│   │   │   ├── SareeGrid.tsx
│   │   │   ├── SareeGallery.tsx
│   │   │   ├── PriceLine.tsx
│   │   │   └── ProductSpecifications.tsx
│   │   │
│   │   └── sections/             # Homepage sections
│   │       ├── SignatureCarousel.tsx
│   │       ├── BrandStory.tsx
│   │       ├── CuratedPreviewGrid.tsx
│   │       └── TopBrandBar.tsx
│   │
│   ├── lib/
│   │   ├── auth/                 # Authentication utilities
│   │   │   ├── index.ts
│   │   │   ├── session.ts        # JWT sign/verify
│   │   │   ├── password.ts       # bcrypt hash/verify
│   │   │   └── middleware-auth.ts # Edge-compatible JWT check
│   │   │
│   │   ├── supabase/             # Supabase clients
│   │   │   ├── server.ts         # Server Components/Actions
│   │   │   ├── browser.ts        # Client Components
│   │   │   ├── client.ts         # Shared client config
│   │   │   └── middleware.ts     # Middleware client
│   │   │
│   │   ├── storage/              # Storage abstraction
│   │   │   ├── index.ts          # getStorageProvider()
│   │   │   ├── types.ts          # StorageProvider interface
│   │   │   ├── supabase-provider.ts
│   │   │   └── local-provider.ts
│   │   │
│   │   ├── data/                 # Data fetching layer
│   │   │   ├── sarees.ts         # Product queries (with seed data)
│   │   │   ├── attribute-definitions.ts
│   │   │   ├── attribute-definitions-shared.ts
│   │   │   └── site-settings.ts
│   │   │
│   │   ├── types.ts              # Shared TypeScript types
│   │   ├── media-url.ts          # Media URL generation
│   │   └── utils.ts              # Helper functions
│   │
│   ├── types/
│   │   └── database.ts           # Database TypeScript types
│   │
│   └── middleware.ts             # Next.js middleware (auth check)
│
├── supabase/
│   └── migrations/               # SQL migrations (11 files)
│       ├── 20240225000001_initial_schema.sql
│       ├── 20240225000002_rls_and_auth.sql
│       ├── 20240225000003_storage.sql
│       ├── 20240225100000_fix_profiles_admin_policy_recursion.sql
│       ├── 20250225000001_product_images_and_homepage.sql
│       ├── 20250226000001_attribute_definitions.sql
│       ├── 20250226000002_product_attribute_values.sql
│       ├── 20250226000003_site_settings.sql
│       ├── 20250227000001_disable_rls_portable_db.sql
│       ├── 20250227000002_app_users_and_storage_key.sql
│       └── 20250228000001_product_lifecycle_and_drafts.sql
│
├── public/                       # Static assets
├── .next/                        # Build output (gitignored)
├── node_modules/                 # Dependencies (gitignored)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
├── .env.local                    # Environment variables (gitignored)
└── README.md
```

### Key Directories Explained

#### `src/app/`
- Uses Next.js 14 **App Router** with route groups
- `(store)` and `(admin)` are route groups (not in URL path)
- Server Components by default; client components marked with `"use client"`

#### `src/components/`
- Organized by domain (admin, auth, layout, saree, sections)
- Client components for interactivity (forms, image upload, drag-and-drop)

#### `src/lib/`
- Business logic and shared utilities
- Supabase clients separated by context (server, browser, middleware)
- Storage abstraction allows swapping providers (Supabase ↔ local)

#### `src/app/actions/`
- All Server Actions in one directory
- Pattern: `"use server"` at top of file
- Form handling with `FormData` extraction
- Returns `{ error?: string }` or success data

#### `supabase/migrations/`
- Run in order (filenames have timestamps)
- Idempotent (safe to re-run with `IF NOT EXISTS` and `DO $$ BEGIN` blocks)

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  app_users   │ (Admin authentication)
├──────────────┤
│ id           │ UUID PK
│ email        │ TEXT UNIQUE
│ password_hash│ TEXT (bcryptjs)
│ role         │ TEXT (customer | admin)
│ created_at   │ TIMESTAMPTZ
└──────────────┘

┌──────────────────────┐
│  profiles            │ (Optional: customer profiles, extends auth.users)
├──────────────────────┤
│ user_id              │ UUID PK → auth.users(id)
│ full_name            │ TEXT
│ phone                │ TEXT
│ country              │ TEXT
│ role                 │ TEXT (customer | admin)
│ created_at, updated_at
└──────────────────────┘

┌──────────────────────┐
│  types               │ (Product categories)
├──────────────────────┤
│ id                   │ UUID PK
│ slug                 │ TEXT UNIQUE
│ name                 │ TEXT
│ banner_url           │ TEXT
│ sort_order           │ INT
│ created_at, updated_at
└──────────────────────┘
         ▲
         │
         │ FK: type_id
         │
┌─────────────────────────────────────────┐
│  products                               │
├─────────────────────────────────────────┤
│ id                   │ UUID PK
│ type_id              │ UUID FK → types(id) ON DELETE SET NULL
│ slug                 │ TEXT UNIQUE
│ title                │ TEXT
│ name                 │ TEXT NOT NULL
│ product_code         │ TEXT UNIQUE NOT NULL
│ sku                  │ TEXT
│ price_inr            │ DECIMAL(12,2)
│ price_aed            │ DECIMAL(12,2)
│ description          │ TEXT
│ attributes           │ JSONB (legacy/fallback)
│ stock_status         │ TEXT (in_stock | out_of_stock | low_stock)
│ featured             │ BOOLEAN
│ new_arrival          │ BOOLEAN
│ show_on_homepage     │ BOOLEAN
│ status               │ TEXT (draft | pending | approved | rejected)
│ submitted_at         │ TIMESTAMPTZ
│ approved_at          │ TIMESTAMPTZ
│ rejected_at          │ TIMESTAMPTZ
│ rejection_reason     │ TEXT
│ is_discontinued      │ BOOLEAN
│ discontinued_at      │ TIMESTAMPTZ
│ discontinued_reason  │ TEXT
│ created_at, updated_at
└─────────────────────────────────────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌──────────────────────┐      ┌──────────────────────────┐
│  product_images      │      │  product_attribute_values│
├──────────────────────┤      ├──────────────────────────┤
│ id                   │ UUID PK │ product_id          │ UUID PK,FK
│ product_id           │ UUID FK → products(id) ON DELETE CASCADE
│ storage_key          │ TEXT  │ attribute_key        │ TEXT PK,FK
│ sort_order           │ INT   │ value               │ TEXT
│ alt_text             │ TEXT  │ updated_at          │ TIMESTAMPTZ
│ is_primary           │ BOOLEAN
│ show_on_homepage     │ BOOLEAN                      FK: attribute_key
│ created_at           │ TIMESTAMPTZ                    │
└──────────────────────┘                               ▼
                                             ┌─────────────────────┐
┌──────────────────────┐                   │ attribute_definitions│
│  product_drafts      │                   ├─────────────────────┤
├──────────────────────┤                   │ key                  │ TEXT PK
│ id                   │ UUID PK            │ label                │ TEXT
│ product_id           │ UUID FK → products(id) ON DELETE CASCADE
│ status               │ TEXT (draft | pending | approved | rejected)
│ draft_data_json      │ TEXT (JSON)        │ group                │ TEXT
│ submitted_at         │ TIMESTAMPTZ        │ input_type           │ TEXT
│ approved_at          │ TIMESTAMPTZ        │ options_json         │ TEXT
│ rejected_at          │ TIMESTAMPTZ        │ sort_order           │ INT
│ rejection_reason     │ TEXT               │ is_active            │ BOOLEAN
│ created_at, updated_at                     │ is_required          │ BOOLEAN
└──────────────────────┘                   │ created_at           │ TIMESTAMPTZ
                                             └─────────────────────┘

┌──────────────────────────────┐      ┌──────────────────────────────┐
│  store_settings (single row) │      │  site_settings (single row)  │
├──────────────────────────────┤      ├──────────────────────────────┤
│ id                           │ UUID PK │ id                       │ UUID PK
│ whatsapp_number              │ TEXT  │ business_name              │ TEXT
│ call_number                  │ TEXT  │ contact_phone              │ TEXT
│ whatsapp_message_template    │ TEXT  │ contact_whatsapp           │ TEXT
│ created_at, updated_at              │ contact_email              │ TEXT
└──────────────────────────────┘      │ address_text               │ TEXT
                                       │ instagram_url              │ TEXT
                                       │ support_hours              │ TEXT
                                       │ homepage_rotation_seconds  │ INT
                                       │ updated_at                 │ TIMESTAMPTZ
                                       └──────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Storage: Supabase Storage Bucket                               │
│  Bucket: product-images (public)                                │
│  Keys: {product_id}/{uuid}.{ext}                                 │
│  Referenced by: product_images.storage_key                       │
└──────────────────────────────────────────────────────────────────┘
```

### Tables

#### Core Tables

**`app_users`**
- Custom authentication (no Supabase Auth dependency)
- Stores email, bcrypt password hash, role
- Used for admin login

**`products`**
- Main product table
- Dual naming: `title`/`name` (display vs internal), `sku`/`product_code` (external vs internal)
- Status workflow: draft → pending → approved/rejected
- Soft delete via `is_discontinued`
- Legacy `attributes` JSONB for backward compatibility

**`product_images`**
- One-to-many with products
- `storage_key`: path in Supabase Storage bucket
- `is_primary`: main product image
- `show_on_homepage`: featured in homepage carousel
- Sortable via `sort_order`

**`types`**
- Product categories (e.g., "Kanchipuram Silk", "Cotton")
- Used for filtering and future type-specific pages

#### Attribute System

**`attribute_definitions`**
- Global schema for product specifications
- Defines form fields dynamically
- Supports: text, textarea, select (with JSON options)
- Grouping for organized display
- Required validation enforced in Server Actions

**`product_attribute_values`**
- Per-product attribute values
- Composite PK: (product_id, attribute_key)
- Replaces/extends legacy `products.attributes` JSONB
- `ON DELETE RESTRICT` FK to prevent accidental data loss

#### Workflow Tables

**`product_drafts`**
- Stores pending edits for approved products
- `draft_data_json`: Full product snapshot + changes
- Separate approval workflow for edits vs new products
- One draft per product (UNIQUE constraint)

#### Settings Tables

**`store_settings`**
- Single-row table for WhatsApp/call contact info
- Message template with placeholders (`{title}`, `{sku}`)

**`site_settings`**
- Single-row table for site-wide config
- Business info, social links, homepage carousel speed

#### Optional Tables

**`profiles`**
- Extends Supabase Auth users (for future customer profiles)
- Currently optional; admin uses `app_users` instead

---

### Row-Level Security (RLS)

**Enabled on**:
- `attribute_definitions`
- `product_attribute_values`
- `profiles` (optional, if using Supabase Auth)

**Public read, admin write**:
- Products, types, images, attributes: anyone can read
- Only admin role can INSERT/UPDATE/DELETE

**Admin detection**:
```sql
EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
```

**Note**: Some tables have RLS disabled for portability (e.g., `products`, `types`). Application-level auth via middleware enforces access control.

---

### Indexes

**Performance indexes**:
- `products`: slug, type_id, status, is_discontinued, featured, new_arrival, product_code, created_at
- `product_images`: product_id
- `product_attribute_values`: product_id
- `attribute_definitions`: (is_active, sort_order) partial index
- `product_drafts`: product_id, status
- `types`: slug
- `app_users`: email

---

### Migrations Summary

| File | Purpose |
|------|---------|
| `20240225000001_initial_schema.sql` | Core tables: profiles, store_settings, types, products, product_images |
| `20240225000002_rls_and_auth.sql` | RLS policies, auth trigger for profiles |
| `20240225000003_storage.sql` | Storage bucket + policies |
| `20240225100000_fix_profiles_admin_policy_recursion.sql` | Fix RLS recursion issue |
| `20250225000001_product_images_and_homepage.sql` | Add `show_on_homepage`, `is_primary` to images |
| `20250226000001_attribute_definitions.sql` | Global attribute schema table |
| `20250226000002_product_attribute_values.sql` | Per-product attribute values |
| `20250226000003_site_settings.sql` | Site-wide settings table |
| `20250227000001_disable_rls_portable_db.sql` | Disable RLS on some tables for portability |
| `20250227000002_app_users_and_storage_key.sql` | Custom auth table, rename `url` → `storage_key` |
| `20250228000001_product_lifecycle_and_drafts.sql` | Product workflow (status, drafts, discontinue) |

---

## API Reference

### Server Actions

All Server Actions are in `src/app/actions/` and use `"use server"` directive.

#### Products (`actions/products.ts`)

**CRUD**
- `createProduct(formData: FormData)` → `{ error?: string; id?: string }`
- `updateProduct(id: string, formData: FormData)` → `{ error?: string }`
- `deleteProductPermanently(id: string, productCode: string, confirmation: string)` → `{ error?: string; deleted?: boolean }`

**Images**
- `uploadProductImage(productId: string, formData: FormData)` → `{ error?: string }`
- `updateProductImageOrder(productId: string, imageIds: string[])` → `{ error?: string }`
- `setPrimaryProductImage(imageId: string, productId: string)` → `{ error?: string }`
- `updateProductImage(imageId: string, productId: string, payload: { alt_text?, show_on_homepage? })` → `{ error?: string }`
- `deleteProductImage(imageId: string, productId: string)` → `{ error?: string }`

**Workflow**
- `submitProductForApproval(productId: string)` → `{ error?: string }`
- `approveProduct(productId: string)` → `{ error?: string }`
- `rejectProduct(productId: string, rejectionReason: string)` → `{ error?: string }`
- `discontinueProduct(productId: string, reason: string | null)` → `{ error?: string }`
- `reEnableProduct(productId: string)` → `{ error?: string }`

**Drafts** (for approved products)
- `saveProductDraft(productId: string, draftData: DraftData)` → `{ error?: string }`
- `submitDraftForApproval(productId: string)` → `{ error?: string }`
- `approveDraft(productId: string)` → `{ error?: string }`
- `rejectDraft(productId: string, rejectionReason: string)` → `{ error?: string }`

#### Types (`actions/types.ts`)
- `createType(formData: FormData)` → `{ error?: string; id?: string }`
- `updateType(id: string, formData: FormData)` → `{ error?: string }`
- `deleteType(id: string)` → `{ error?: string }`

#### Attributes (`actions/attribute-definitions.ts`)
- `createAttributeDefinition(formData: FormData)` → `{ error?: string }`
- `updateAttributeDefinition(key: string, formData: FormData)` → `{ error?: string }`
- `toggleAttributeActive(key: string, isActive: boolean)` → `{ error?: string }`

#### Settings (`actions/settings.ts`)
- `updateStoreSettings(formData: FormData)` → `{ error?: string }`
- `updateSiteSettings(formData: FormData)` → `{ error?: string }`

#### Auth (`actions/auth.ts`)
- `login(formData: FormData)` → `{ error?: string }` (redirects on success)
- `logout()` → void (redirects to /admin/login)

---

### Route Handlers

#### Media API (`/api/media/[...key]`)
- **GET** `/api/media/{storage_key}`: Serve image from storage
- Range request support (for future video)
- Automatic Content-Type detection
- Example: `/api/media/abc123/def456.jpg`

---

## Tech Stack

### Core
- **Next.js 14** (App Router, Server Components, Server Actions)
- **React 18** (Server Components, Suspense)
- **TypeScript 5**
- **Tailwind CSS 3**

### Backend
- **Supabase** (Postgres, Storage, REST API)
- **jose** (JWT signing/verification, Edge-compatible)
- **bcryptjs** (Password hashing)

### UI/UX
- **lucide-react** (Icon library)
- **clsx** (Conditional class names)
- **Google Fonts** (Inter, Lora)

### Developer Experience
- **ESLint** (with Next.js config)
- **PostCSS** (Tailwind processing)
- **TypeScript strict mode**

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | - | Supabase project URL (database only) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | - | Supabase anon public key |
| `AUTH_SECRET` | Yes | - | JWT signing secret (≥32 chars) |
| `SESSION_SECRET` | No | - | Alternative to `AUTH_SECRET` |
| `STORAGE_PROVIDER` | No | `cloudflare-r2` | Storage provider (`cloudflare-r2`, `supabase`, `local`) |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Yes* | - | Cloudflare account ID (*if using R2) |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Yes* | - | R2 API access key (*if using R2) |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Yes* | - | R2 API secret key (*if using R2) |
| `CLOUDFLARE_R2_BUCKET` | Yes* | - | R2 bucket name (*if using R2, e.g., `product-images`) |
| `CLOUDFLARE_R2_PUBLIC_BASE_URL` | No | - | Custom domain for R2 (e.g., `https://cdn.example.com`) |
| `MEDIA_DELIVERY_MODE` | No | `stream` | Delivery mode (`stream`, `redirect`, `hybrid`) |
| `MEDIA_CACHE_IMMUTABLE_SECONDS` | No | `31536000` | Cache TTL for immutable keys (1 year) |
| `MEDIA_CACHE_DEFAULT_SECONDS` | No | `3600` | Cache TTL for other keys (1 hour) |
| `NODE_ENV` | Auto | - | Set by Next.js (`development`, `production`) |

---

## Security Considerations

### Authentication
- JWT tokens in HTTP-only cookies (no XSS access)
- Secure flag in production (HTTPS only)
- 7-day expiration with sliding window
- bcrypt password hashing (10 rounds)
- Rate limiting recommended for login endpoint (use Vercel Edge Config or upstash)

### Authorization
- Middleware enforces admin-only routes
- Server Actions check admin status via JWT
- RLS policies on attribute tables
- No client-side role checks (server-side only)

### Data Validation
- Required attribute validation in Server Actions
- Status transition guards (e.g., can't approve draft)
- Confirmation required for destructive actions (delete product)
- SQL injection protected by Supabase client (parameterized queries)

### Storage
- Public bucket for product images (read-only)
- Authenticated write access only
- Storage keys are UUIDs (non-guessable)
- File type validation in upload actions

### Recommendations
- Use strong `AUTH_SECRET` (32+ random chars)
- Enable HTTPS in production (Vercel does this automatically)
- Set up CORS if serving API to external domains
- Add rate limiting for auth endpoints
- Monitor Supabase logs for suspicious activity
- Regularly update dependencies (`npm audit`, `npm outdated`)

---

## Troubleshooting

### Common Issues

#### 1. "AUTH_SECRET must be set"
**Problem**: Missing or short `AUTH_SECRET` env var.

**Solution**: Generate a 32+ character secret:
```bash
openssl rand -base64 32
```
Add to `.env.local`:
```
AUTH_SECRET=your-generated-secret-here
```

#### 2. Admin login fails with "Invalid email or password"
**Possible causes**:
- Wrong email/password
- `app_users` table not populated
- Password hash mismatch

**Solution**:
1. Check `app_users` table in Supabase
2. Regenerate password hash:
   ```javascript
   const bcrypt = require('bcryptjs');
   bcrypt.hash('your-password', 10).then(console.log);
   ```
3. Update row in Supabase:
   ```sql
   UPDATE app_users SET password_hash = '$2a$...' WHERE email = 'admin@example.com';
   ```

#### 3. Images not loading / 404 on /api/media/...
**Possible causes**:
- R2 credentials invalid or missing
- Wrong bucket name
- Wrong `STORAGE_PROVIDER` env var

**Solution**:
1. Verify R2 credentials in Cloudflare Dashboard
2. Check bucket name matches `CLOUDFLARE_R2_BUCKET`
3. Verify `STORAGE_PROVIDER=cloudflare-r2`
4. Test credentials with a direct upload:
   ```typescript
   const provider = getStorageProvider();
   await provider.upload("test.txt", Buffer.from("test"), { contentType: "text/plain" });
   ```
5. Restart dev server: `npm run dev`

**For Supabase Storage (legacy):**
- Verify bucket exists: Supabase Dashboard → Storage → `product-images`
- Check env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Set `STORAGE_PROVIDER=supabase`

#### 4. Middleware redirect loop
**Problem**: Middleware keeps redirecting to `/admin/login`.

**Possible causes**:
- JWT verification failing
- Cookie not being set
- Wrong `AUTH_SECRET`

**Solution**:
1. Clear cookies in browser
2. Check `AUTH_SECRET` matches in all environments
3. Check browser console for errors
4. Verify cookie is set in Network tab (name: `session`)

#### 5. "products table does not exist"
**Problem**: Migrations not run.

**Solution**: Run all migrations in Supabase SQL Editor in order (see Setup section).

#### 6. Product images upload but don't display
**Possible causes**:
- `product_images.storage_key` is null
- Storage provider misconfiguration
- R2 bucket not accessible

**Solution**:
1. Check `product_images` table: `storage_key` should have value (e.g., `abc123/uuid.jpg`)
2. Test storage provider:
   ```bash
   # In dev console or server action
   const provider = getStorageProvider();
   const head = await provider.head("your-storage-key");
   console.log(head); // Should show { exists: true, ... }
   ```
3. For R2: Verify bucket is not private-only (allow public reads or use redirect mode)
4. Check media route logs for errors

#### 7. R2 upload fails with "403 Forbidden"
**Possible causes**:
- Invalid API credentials
- Insufficient token permissions
- Wrong bucket name

**Solution**:
1. Regenerate R2 API token with **Object Read & Write** permission
2. Verify token applies to correct bucket
3. Check `CLOUDFLARE_R2_ACCOUNT_ID` matches your account
4. Test with Cloudflare R2 dashboard upload first

#### 8. Redirect mode not working (still streaming)
**Possible causes**:
- `CLOUDFLARE_R2_PUBLIC_BASE_URL` not set
- Custom domain not connected
- SSL not provisioned

**Solution**:
1. Set `CLOUDFLARE_R2_PUBLIC_BASE_URL=https://cdn.yourstore.com`
2. Verify custom domain in R2 bucket settings
3. Test custom domain: `curl -I https://cdn.yourstore.com/test.jpg`
4. Check media route logs for "falling back to stream" warning
5. Wait 5-10 minutes for SSL provisioning after connecting domain

#### 7. Vercel deployment succeeds but site crashes
**Possible causes**:
- Missing environment variables
- Build errors swallowed

**Solution**:
1. Check Vercel **Deployments** → **Functions** logs
2. Verify all env vars set: Vercel project → Settings → Environment Variables
3. Required vars for R2:
   - `CLOUDFLARE_R2_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_BUCKET`
4. Redeploy after adding env vars

---

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test locally
4. Run linter: `npm run lint`
5. Commit with clear message: `git commit -m "Add feature X"`
6. Push and create Pull Request

### Code Style
- Follow existing patterns (Server Components, Server Actions)
- Use TypeScript (avoid `any`)
- Tailwind for styling (no inline styles)
- Add comments for complex logic
- Keep components small and focused

### Database Changes
- Create new migration file with timestamp prefix
- Make migrations idempotent (`IF NOT EXISTS`, `DO $$ BEGIN`)
- Test migration on fresh database
- Document schema changes in README

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Roadmap

### Planned Features
- [ ] Customer authentication (Email OTP via Supabase Auth)
- [ ] Shopping cart and checkout
- [ ] Order management system
- [ ] Inventory tracking
- [ ] Product reviews and ratings
- [ ] Search and advanced filtering
- [ ] Type-specific landing pages (`/type/[slug]`)
- [ ] Related/similar products algorithm
- [ ] Email notifications (order confirmations, admin alerts)
- [ ] Multi-language support (i18n)
- [ ] SEO optimization (structured data, Open Graph)
- [ ] Analytics dashboard (admin)
- [ ] Image optimization (blur placeholders, WebP)
- [ ] PWA support (offline mode)

### Known Issues
- [ ] Product form doesn't sync `name` and `product_code` in `updateProduct`
- [ ] Seed data served silently when DB is empty (should log warning)
- [ ] No rate limiting on login endpoint
- [ ] Weak secret handling in middleware (returns empty array instead of throwing)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/saree-store/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/saree-store/discussions)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

## Acknowledgments

- Next.js team for App Router and Server Actions
- Supabase for backend-as-a-service platform
- Vercel for hosting and deployment
- Tailwind CSS for utility-first styling

---

**Built with ❤️ for saree retailers worldwide**
