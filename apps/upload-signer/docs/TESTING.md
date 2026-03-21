# Testing upload-signer

## R2 “console” vs the Worker

- **Cloudflare R2 (Dashboard → R2 → your bucket)** is only for **browsing objects**, metrics, and bucket settings. There is **no button there to call** the upload-signer Worker.
- **upload-signer** is a **Worker URL** (e.g. `https://upload-signer.*.workers.dev`). You test it with **HTTP** (browser admin app, `curl`, Postman, etc.).

**What you use the R2 console for:** after a successful upload, open **R2 → bucket → Objects** and confirm the new key (e.g. `temp/<session>/…` or `<productId>/…`) appears.

---

## 1. Quick check (no JWT)

Expect **401** if auth is missing:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST "https://YOUR_WORKER_URL/sign-upload"
```

Replace `YOUR_WORKER_URL` with your Worker base URL (no path beyond `/sign-upload`).

---

## 2. Full flow: presigned upload → see object in R2

You need a **Supabase access token** for a user with **`app_metadata.role === "admin"`** (same JWT the admin app uses).

1. Sign in to the **admin** app, open DevTools → **Application** → **Local Storage** (or **Session Storage**) → find Supabase keys, **or** use the Network tab on any API call and copy `Authorization: Bearer …`.
2. Call **`POST /sign-upload`**:

```bash
export WORKER="https://YOUR_WORKER_URL"
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."

curl -sS -X POST "$WORKER/sign-upload" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "contentType": "image/jpeg",
    "productId": "test-session-123",
    "mode": "temp"
  }'
```

You should get JSON like `{ "putUrl": "https://...", "storageKey": "temp/test-session-123/....jpg" }`.

3. **Upload bytes** to R2 using the presigned URL (must match `Content-Type` you sent, usually `image/jpeg`):

```bash
# Save putUrl and storageKey from the previous response, then:
curl -sS -X PUT "$PUT_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/small.jpg
```

4. **In the R2 console:** **Cloudflare Dashboard → R2 → your bucket → Objects** → find the key from `storageKey` (e.g. under `temp/test-session-123/`).

---

## 3. Other endpoints (same `Authorization` header)

| Path | Purpose |
|------|--------|
| `POST /finalize-temp` | Body: `{ "productId": "uuid", "tempKeys": ["temp/…"] }` — copies temp objects under `productId/…` |
| `POST /delete-objects` | Body: `{ "keys": ["path/to/object"] }` — deletes keys |

After finalize/delete, refresh the **R2** object list to confirm changes.

---

## 4. Troubleshooting

| Symptom | Check |
|--------|--------|
| 401 / 403 | Token present? User has **admin** in Supabase `app_metadata`? |
| 403 only | JWT valid but not admin role |
| CORS in browser | Worker `CORS_ORIGINS` includes your admin origin |
| 500 on sign | R2 secrets on Worker (`CLOUDFLARE_R2_*`) and bucket name |
| Object missing in R2 | Wrong bucket selected; upload PUT failed (check status code on `PUT` to `putUrl`) |

See also: [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md).
