# How upload-signer checks “is this really an admin?”

This page explains **in plain terms** what happens when you upload an image in the admin app and why you sometimes set a **JWT secret** and sometimes only a **project URL**.

---

## The big picture

1. You **log in** to the admin app with email/password (or OAuth). **Supabase Auth** runs that login.
2. Supabase puts a **session** in the browser. That session includes an **access token** — a small signed string (a **JWT**) that means: “this request is from user X.”
3. When you upload a file, the admin sends that token to **upload-signer**:
   - `Authorization: Bearer <access_token>`
4. **upload-signer** must answer two questions:
   - **Is this token real?** (not forged, not expired, signed by *your* Supabase project)
   - **Is this user an admin?** (we require `role: admin` in the token’s metadata)

Only if both are true does the Worker give you a presigned URL to upload to R2.

```text
Browser (admin)                    upload-signer Worker
      |                                    |
      |  POST /sign-upload                 |
      |  Authorization: Bearer <JWT>       |
      |---------------------------------->|
      |                                    | 1) Verify JWT signature
      |                                    | 2) Check admin role
      |  200 { putUrl, storageKey }        |
      |<----------------------------------|
      |                                    |
      |  PUT file to R2 (presigned URL)    |
      |----------------------------------->|
```

---

## Question 1: How do we know the JWT is “real”?

Supabase **signs** every access token with a **private** key or **secret** that only Supabase (and your project config) knows.  
The Worker **does not** log users in — it only **verifies** the signature.

There are two common setups in Supabase:

### A) Legacy **HS256** (“shared secret”)

- There is one **shared secret** string (often shown as “JWT Secret” in the API settings).
- Tokens are signed with **HMAC** using that secret.
- **upload-signer** needs that **same** secret in **`SUPABASE_JWT_SECRET`**.  
  It recomputes the signature and checks it matches — like checking a wax seal.

**Mental model:** one shared password used to sign and verify.

### B) **ECC (P-256)** / **ES256** (modern “JWT signing keys”)

- Supabase holds a **private** key (you never see it).
- The dashboard may only show a **key id** — that’s normal.
- **Verification** uses the **public** keys, which Supabase publishes at a fixed URL:

  `https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json`

- **upload-signer** does **not** need a copy of the private key. It downloads the **public** keys (JWKS) and checks the token signature.

**Mental model:** like HTTPS — private key signs, public key verifies.

For this path, you set **`SUPABASE_URL`** on the Worker to your project base URL (`https://….supabase.co`).  
The Worker uses that URL to find the JWKS file. **No “JWT secret” string exists to paste** for pure ES256.

---

## Question 2: How do we know the user is an admin?

Supabase puts **metadata** inside the JWT. We read:

- `app_metadata.role` **or** `user_metadata.role`

It must be the string **`admin`** (set in Supabase for that user).  
If you change metadata in the dashboard, the user must **sign out and sign in** so the **new** token includes it.

---

## What you set on the Worker (cheat sheet)

| Your Supabase JWT setup | Set on Worker |
|-------------------------|----------------|
| **Legacy HS256** shared secret | **`SUPABASE_JWT_SECRET`** = that secret |
| **ECC / ES256** (only key ids in UI) | **`SUPABASE_URL`** = `https://xxxx.supabase.co` (same as admin env) |
| Migrating or unsure | You can set **both**; the Worker tries HS256 first, then JWKS |

You always need the **same Supabase project** as the admin app (`NEXT_PUBLIC_SUPABASE_URL`).

---

## What the Worker never sees

- Your **Supabase password** or **anon key** for “logging in” (the admin app uses those in the browser).
- The **private** key for ECC (only Supabase has it).

The Worker only sees the **Bearer token** on each request and the **env vars** you configured (secret +/or URL).

---

## If you still see `invalid_token`

After redeploying the latest **upload-signer**, a failed request may include a **`debug`** object in the JSON (not secret values), for example:

| Field | Meaning |
|--------|--------|
| `token_alg` | `ES256` = asymmetric (JWKS). `HS256` = needs `SUPABASE_JWT_SECRET`. |
| `token_iss` | Issuer in the token — the hostname should match your **`SUPABASE_URL`** project ref. |
| `jwks_http_status` | `200` = JWKS URL is reachable. `404` = wrong `SUPABASE_URL`. |
| `worker_has_supabase_url` | `false` = Worker never got `SUPABASE_URL` (secret not set or deploy didn’t sync). |

**Most common fix:** `SUPABASE_URL` on the Worker must be exactly  
`https://<project-ref>.supabase.co` — same project as **`NEXT_PUBLIC_SUPABASE_URL`** in the admin build. Then **redeploy** the Worker and try again.

---

## Related docs

- [SUPABASE_JWT_HS256.md](./SUPABASE_JWT_HS256.md) — shared secret details  
- [SUPABASE_JWT_SIGNING_KEYS.md](./SUPABASE_JWT_SIGNING_KEYS.md) — ECC / key id / JWKS  
- [DEPLOY_FROM_GITHUB.md](./DEPLOY_FROM_GITHUB.md) — GitHub secrets for deploy  
