# Storage Migration Checklist

Quick reference for migrating from Supabase Storage to Cloudflare R2.

---

## Pre-Migration

### Information Gathering
- [ ] Note: This is a **fresh deployment** with **no existing image data**
- [ ] Confirm: No product images exist in Supabase Storage
- [ ] Document: Current `STORAGE_PROVIDER` setting (if any)

---

## Cloudflare R2 Setup

### Account & Bucket
- [ ] Log in to Cloudflare Dashboard
- [ ] Navigate to **R2 Object Storage**
- [ ] Note your **Account ID** (visible in URL or dashboard)
- [ ] Click **Create bucket**
- [ ] Bucket name: `product-images`
- [ ] Location: **Automatic** (recommended)
- [ ] Click **Create bucket**

### API Credentials
- [ ] In R2 dashboard, click **Manage R2 API Tokens**
- [ ] Click **Create API Token**
- [ ] Token name: `saree-store-production` (or similar)
- [ ] Permissions: **Object Read & Write**
- [ ] (Optional) Specify bucket: `product-images`
- [ ] TTL: **Forever** (or set expiry for rotation)
- [ ] Click **Create API Token**
- [ ] **Copy immediately** (shown only once):
  - [ ] Access Key ID → Save securely
  - [ ] Secret Access Key → Save securely

### Custom Domain (Optional, Recommended for Production)
- [ ] In R2, select bucket `product-images`
- [ ] Go to **Settings** tab
- [ ] Scroll to **Public Access**
- [ ] Click **Connect Domain**
- [ ] Enter your subdomain: `cdn.yourstore.com`
- [ ] Click **Continue**
- [ ] Add CNAME record to your DNS:
  - Type: `CNAME`
  - Name: `cdn` (or full subdomain)
  - Content: `{bucket}.{account-id}.r2.cloudflarestorage.com`
  - Proxy: **DNS only** (gray cloud)
- [ ] Wait for DNS propagation (5-10 minutes)
- [ ] Wait for SSL certificate (automatic, ~5 minutes)
- [ ] Test: `curl -I https://cdn.yourstore.com` (should show Cloudflare headers)

---

## Local Development Setup

### Environment Variables
- [ ] Open `.env.local` (create if missing)
- [ ] Add/update the following:

```bash
# Storage Provider
STORAGE_PROVIDER=cloudflare-r2

# Cloudflare R2 Credentials
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id-here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key-here
CLOUDFLARE_R2_BUCKET=product-images

# Optional: Custom domain (leave commented for local dev)
# CLOUDFLARE_R2_PUBLIC_BASE_URL=https://cdn.yourstore.com

# Optional: Delivery mode (default: stream)
# MEDIA_DELIVERY_MODE=stream
```

- [ ] Save file
- [ ] **Never commit** `.env.local` to git (check `.gitignore`)

### Test Local Setup
- [ ] Start dev server: `npm run dev`
- [ ] Check console for errors
- [ ] Navigate to `http://localhost:3000/admin/login`
- [ ] Log in as admin
- [ ] Go to **Products** → **Create New Product**
- [ ] Fill in basic details
- [ ] Upload a test image
- [ ] Verify: Image preview appears immediately
- [ ] Check Cloudflare R2 bucket: Image should be visible
- [ ] Check database `product_images` table: `storage_key` should be set (e.g., `abc123/uuid.jpg`)
- [ ] Verify: Image URL is `/api/media/{storage_key}` (not full Cloudflare URL)

---

## Production Deployment (Vercel)

### Environment Variables
- [ ] Log in to Vercel Dashboard
- [ ] Select your project
- [ ] Go to **Settings** → **Environment Variables**
- [ ] Add the following variables:

#### Required
```
STORAGE_PROVIDER=cloudflare-r2
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET=product-images
```

- [ ] For each variable:
  - [ ] Name: (copy from above)
  - [ ] Value: (paste your credential)
  - [ ] Environment: Select **Production**, **Preview**, **Development**
  - [ ] Click **Save**

#### Optional (Recommended for Production)
```
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://cdn.yourstore.com
MEDIA_DELIVERY_MODE=hybrid
```

- [ ] If using custom domain, add `CLOUDFLARE_R2_PUBLIC_BASE_URL`
- [ ] Set `MEDIA_DELIVERY_MODE=hybrid` for best performance

### Deploy
- [ ] Trigger deployment:
  - Option A: Push to git (automatic deploy)
  - Option B: Click **Deployments** → **Redeploy**
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors
- [ ] Visit production URL

### Test Production
- [ ] Navigate to production admin panel
- [ ] Log in as admin
- [ ] Create a test product
- [ ] Upload test image
- [ ] Verify: Image uploads successfully
- [ ] Check: Image preview in admin
- [ ] Navigate to public product page
- [ ] Verify: Image loads correctly
- [ ] (If redirect mode) Open browser DevTools → Network tab
- [ ] (If redirect mode) Verify: Image request shows 302 redirect to CDN URL
- [ ] Check Cloudflare R2 dashboard: Object count increased

---

## Monitoring & Validation

### Cloudflare Analytics
- [ ] Open Cloudflare Dashboard → **R2**
- [ ] Select `product-images` bucket
- [ ] View **Metrics**:
  - [ ] Storage used (should increase after uploads)
  - [ ] Class A operations (writes: should increase after uploads)
  - [ ] Class B operations (reads: should increase after page views)

### Cloudflare CDN (if redirect mode)
- [ ] Cloudflare Dashboard → **Analytics** → **Cache**
- [ ] Check cache hit ratio (should be >90% after warmup)

### Vercel Analytics
- [ ] Vercel Dashboard → Project → **Analytics**
- [ ] Check **Bandwidth Usage**:
  - Stream mode: Should be similar to before
  - Redirect mode: Should drop significantly
- [ ] Check **Function Duration**:
  - `/api/media` should be <20ms (redirect) or 100-200ms (stream)

### Application Logs
- [ ] Vercel Dashboard → **Deployments** → Latest → **Functions**
- [ ] Check for errors related to:
  - `R2 upload failed` → Check credentials
  - `Falling back to stream` → Check `CLOUDFLARE_R2_PUBLIC_BASE_URL`
  - `404 Not found` → Check storage keys

---

## Rollback Plan (If Needed)

### Quick Rollback
If issues arise, revert to Supabase Storage:

- [ ] Vercel → **Settings** → **Environment Variables**
- [ ] Change: `STORAGE_PROVIDER=cloudflare-r2` → `STORAGE_PROVIDER=supabase`
- [ ] Verify Supabase credentials still exist:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_STORAGE_BUCKET`
- [ ] Trigger redeploy
- [ ] Wait for deployment
- [ ] Test: Upload should work with Supabase Storage

**Note:** Since there's no existing data, rollback is trivial and risk-free.

---

## Post-Migration Cleanup

### Optional: Remove Supabase Storage Credentials
Once confident R2 is working:

- [ ] Remove from `.env.local`:
  - `SUPABASE_SERVICE_ROLE_KEY` (if not needed for other features)
  - `SUPABASE_STORAGE_BUCKET`
- [ ] Remove from Vercel:
  - Same variables

**Caution:** Only remove if you're certain you won't need Supabase Storage fallback.

### Update Documentation
- [ ] Update internal docs with R2 credentials location (password manager, etc.)
- [ ] Document custom domain setup (if used)
- [ ] Add monitoring dashboard links (Cloudflare, Vercel)

---

## Troubleshooting

### Upload Fails with "403 Forbidden"
**Cause:** Invalid R2 credentials

**Fix:**
- [ ] Verify `CLOUDFLARE_R2_ACCESS_KEY_ID` is correct
- [ ] Verify `CLOUDFLARE_R2_SECRET_ACCESS_KEY` is correct
- [ ] Regenerate API token in Cloudflare if needed
- [ ] Update Vercel env vars
- [ ] Redeploy

### Upload Succeeds but Image Doesn't Load
**Cause:** Bucket name mismatch or storage key issue

**Fix:**
- [ ] Check `product_images` table: `storage_key` should be set
- [ ] Check R2 bucket name matches `CLOUDFLARE_R2_BUCKET`
- [ ] Test media route: `curl -I https://yoursite.com/api/media/{storage_key}`
- [ ] Check browser console for errors

### Redirect Mode Not Working (Still Streaming)
**Cause:** Missing or incorrect `CLOUDFLARE_R2_PUBLIC_BASE_URL`

**Fix:**
- [ ] Verify custom domain is connected in R2
- [ ] Test custom domain directly: `curl -I https://cdn.yourstore.com/test.txt`
- [ ] Set `CLOUDFLARE_R2_PUBLIC_BASE_URL=https://cdn.yourstore.com`
- [ ] Set `MEDIA_DELIVERY_MODE=redirect` or `hybrid`
- [ ] Redeploy
- [ ] Check Vercel logs for "falling back to stream" warnings

### High Latency on Image Load
**Cause:** Using stream mode instead of redirect

**Fix:**
- [ ] Set up custom domain (see Custom Domain section above)
- [ ] Set `CLOUDFLARE_R2_PUBLIC_BASE_URL`
- [ ] Set `MEDIA_DELIVERY_MODE=redirect` or `hybrid`
- [ ] Redeploy
- [ ] Verify 302 redirects in browser DevTools

---

## Success Criteria

### ✅ Migration Complete When:
- [ ] Admin can upload images
- [ ] Images preview immediately in admin
- [ ] Images load on public product pages
- [ ] Database `storage_key` contains provider-agnostic keys (not URLs)
- [ ] Cloudflare R2 bucket shows uploaded objects
- [ ] (If redirect mode) Vercel bandwidth usage drops
- [ ] (If redirect mode) Cloudflare cache hit ratio >90%
- [ ] No errors in Vercel function logs
- [ ] No 404s on `/api/media/*` requests

### 📊 Performance Targets:
- [ ] Upload latency: <500ms
- [ ] Admin preview load: <200ms
- [ ] Public image load (stream): <200ms
- [ ] Public image load (redirect): <50ms (CDN cache hit)

### 💰 Cost Validation:
- [ ] Confirm R2 storage costs: ~$0.015/GB/month (check dashboard)
- [ ] Confirm R2 egress: $0 (should always be $0)
- [ ] Compare to previous Supabase Storage costs (if migrating)

---

## Timeline

**Fresh Deployment (No Existing Data):**
- Setup (R2 + credentials): 15 minutes
- Local testing: 10 minutes
- Production deploy: 5 minutes
- Validation: 10 minutes
- **Total: ~40 minutes**

**With Custom Domain:**
- Add 15 minutes for DNS propagation + SSL

---

## Support & Resources

- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/
- **Storage Migration Guide:** [STORAGE_MIGRATION.md](STORAGE_MIGRATION.md)
- **Architecture Recommendation:** [ARCHITECTURE_RECOMMENDATION.md](ARCHITECTURE_RECOMMENDATION.md)
- **README:** [README.md](README.md) (Environment Variables section)

---

## Checklist Summary

- [ ] **Pre-Migration:** Confirmed no existing data
- [ ] **Cloudflare Setup:** R2 bucket + credentials + (optional) custom domain
- [ ] **Local Dev:** Configured `.env.local` + tested upload
- [ ] **Production Deploy:** Added Vercel env vars + deployed
- [ ] **Validation:** Tested upload + image load + monitoring
- [ ] **Performance:** Verified latency targets
- [ ] **Cost:** Confirmed zero egress charges

**Status:** ✅ Complete

---

**Last Updated:** 2026-03-11
