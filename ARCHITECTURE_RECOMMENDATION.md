# Architecture Recommendation

## Recommended Architecture NOW

### System Design

**Storage: Cloudflare R2**
- S3-compatible API (portable, no vendor lock-in)
- Zero egress costs (vs Supabase $0.09/GB)
- Native Web Crypto (no dependencies)
- UUID-based immutable keys

**Database: Supabase Postgres**
- Stays on Supabase (no change)
- Only stores provider-agnostic `storage_key`
- No hardcoded URLs in DB
- Separation of concerns: data vs files

**Media Delivery: Hybrid Mode**
- Admin requests → stream (instant preview)
- Public requests → redirect to Cloudflare CDN
- Best UX: admins see uploads immediately
- Best performance: public traffic uses CDN

**Auth: Custom JWT (app-level)**
- Independent of storage provider
- No changes needed

---

## Why This is Simpler (No Existing Data)

### 1. No Migration Complexity
**Without data:**
- ✅ No bulk transfer scripts
- ✅ No downtime window
- ✅ No dual-provider resolution
- ✅ No legacy URL handling
- ✅ Clean single-provider deployment

**With data:**
- ❌ Would need migration script
- ❌ Would need `storage_provider` column
- ❌ Would need fallback resolution
- ❌ Would need gradual migration strategy

### 2. No Mixed-Provider Support
**Without data:**
- ✅ Single provider (cleaner code)
- ✅ No per-image provider tracking
- ✅ Simpler provider factory
- ✅ Easier testing

**With data:**
- ❌ Would need `product_images.storage_provider` column
- ❌ Would need provider resolution logic
- ❌ Would need fallback chains
- ❌ Would complicate `/api/media` route

### 3. No Backward Compatibility Burden
**Without data:**
- ✅ Default to R2 immediately
- ✅ No legacy URL parsing
- ✅ Clean `getMediaUrl()` function
- ✅ Simplified media route

**With data:**
- ❌ Would need to parse Supabase URLs
- ❌ Would need migration detection
- ❌ Would need dual-mode media route

### 4. Simpler Database Schema
**Current (clean):**
```sql
CREATE TABLE product_images (
  storage_key TEXT NOT NULL  -- Provider-agnostic
);
```

**With migration (complex):**
```sql
CREATE TABLE product_images (
  storage_key TEXT NOT NULL,
  storage_provider TEXT DEFAULT 'r2',  -- Added complexity
  migrated_at TIMESTAMPTZ              -- Migration tracking
);
```

### 5. Easier Rollback
**Without data:**
- Change 1 env var → done
- No data inconsistency risk
- No partial migration state

**With data:**
- Would need to track migration progress
- Risk of split data across providers
- Complex rollback procedure

---

## Production Recommendation

### Deployment Configuration

```bash
# Required
STORAGE_PROVIDER=cloudflare-r2
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET=product-images

# Recommended
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://cdn.yourstore.com
MEDIA_DELIVERY_MODE=hybrid

# Optional (defaults are good)
MEDIA_CACHE_IMMUTABLE_SECONDS=31536000  # 1 year
MEDIA_CACHE_DEFAULT_SECONDS=3600        # 1 hour
```

### Custom Domain Setup

1. **Cloudflare R2:**
   - Connect custom domain: `cdn.yourstore.com`
   - Automatic SSL provisioning
   - Global CDN (200+ cities)

2. **DNS Configuration:**
   ```
   CNAME cdn.yourstore.com → {bucket}.{account}.r2.cloudflarestorage.com
   ```

3. **Result:**
   - Public traffic: zero app bandwidth
   - Admin traffic: instant previews
   - Monitoring: Cloudflare Analytics

---

## Architecture Benefits

### 1. Cost Efficiency
**Supabase Storage:**
- Storage: $0.021/GB/month
- Egress: $0.09/GB
- **Example (1TB/month):** ~$92/month

**Cloudflare R2:**
- Storage: $0.015/GB/month
- Egress: $0/GB (free)
- Operations: $0.36 per million reads
- **Example (1TB/month):** ~$1.60/month

**Savings: 98%**

### 2. Performance
**Stream mode:**
- Latency: ~150ms (app → R2 → client)
- Good for: admin previews

**Redirect mode:**
- Latency: ~50ms (CDN cache hit)
- Good for: public storefront

**Hybrid mode:**
- Best of both worlds
- Admin: 150ms (acceptable for preview)
- Public: 50ms (optimal UX)

### 3. Scalability
- R2: Unlimited bandwidth (no egress fees)
- CDN: Global edge cache
- No app server bottleneck (redirect mode)
- Zero scaling concerns for media

### 4. Portability
**S3-compatible API means:**
- Can switch to AWS S3
- Can switch to MinIO
- Can switch to DigitalOcean Spaces
- Can switch to Backblaze B2

**Change required:** Update credentials only (API stays same)

---

## Future-Proof Design

### What's Easy to Add Later

#### 1. Image Optimization
```typescript
// /api/media/[...key] can add:
if (request.nextUrl.searchParams.has('w')) {
  // Resize image to width
  return resizeImage(key, width);
}
```

Integration with Cloudflare Images for transforms.

#### 2. Private Content (Signed URLs)
```typescript
export function getSignedUrl(key: string, ttl: number): string {
  // Generate time-limited R2 signed URL
  return r2Provider.getSignedUrl(key, ttl);
}
```

For user uploads, invoices, private documents.

#### 3. Video Support
Already implemented:
- Range requests (206 responses)
- Streaming via `/api/media`
- Future: Cloudflare Stream integration

#### 4. Multi-Provider Support
If needed later:
```sql
ALTER TABLE product_images ADD COLUMN storage_provider TEXT DEFAULT 'r2';
```

Then update media route to resolve provider per image.

---

## What NOT to Do (Complexity Traps)

### ❌ Don't Store Full URLs in DB
**Bad:**
```sql
UPDATE product_images SET url = 'https://cdn.example.com/abc/xyz.jpg';
```

**Why:** Vendor lock-in, can't switch providers, URLs break if domain changes.

**Good:**
```sql
UPDATE product_images SET storage_key = 'abc/xyz.jpg';
```

**Why:** Provider-agnostic, flexible delivery, easy migration.

---

### ❌ Don't Add `storage_provider` Column (Yet)
**Current architecture:** Single provider per deployment

**When to add:**
- If you need gradual migration from Supabase Storage
- If you need multi-cloud redundancy

**For now:** Unnecessary complexity

---

### ❌ Don't Implement Dual-Write on Upload
**Bad:**
```typescript
await supabaseProvider.upload(key, file);  // Backup
await r2Provider.upload(key, file);        // Primary
```

**Why:** Double cost, double latency, unclear source of truth.

**Good:** Single provider, clean architecture.

---

### ❌ Don't Mix Caching Strategies
**Bad:**
```typescript
if (request.headers.get('x-admin')) {
  return Response(stream, { 'Cache-Control': 'no-cache' });
} else {
  return Response(stream, { 'Cache-Control': 'max-age=31536000' });
}
```

**Why:** Cache key collisions, incorrect invalidation.

**Good:** Use immutable keys (UUID-based), cache aggressively.

---

## Monitoring & Observability

### Key Metrics to Track

**Cloudflare Dashboard:**
1. **R2 Analytics:**
   - Storage used (GB)
   - Request count (Class A/B operations)
   - Bandwidth (upload, but NOT download—it's free)

2. **CDN Analytics (if redirect mode):**
   - Cache hit ratio (should be >90%)
   - Bandwidth saved (vs streaming)
   - Edge response time (p50, p95, p99)

**Vercel Analytics:**
1. **Function Duration:**
   - `/api/media` should be <20ms (redirect mode)
   - `/api/media` will be 100-200ms (stream mode)

2. **Bandwidth Usage:**
   - Should drop 90%+ in redirect mode
   - Stays high in stream mode

**Application Logs:**
1. Watch for:
   - `R2 upload failed` → Credential issues
   - `Falling back to stream` → Public URL misconfiguration
   - `404 Not found` → Missing storage keys

2. Success metrics:
   - Upload latency <500ms
   - Download latency <200ms (stream), <50ms (redirect)

---

## Migration Timeline (If Needed Later)

**Phase 1: New uploads to R2**
- Switch `STORAGE_PROVIDER=cloudflare-r2`
- All new images → R2
- Old images stay in Supabase

**Phase 2: Lazy migration**
- Keep Supabase Storage active
- Migrate on access (fetch from Supabase, upload to R2)
- Update `storage_key` (stays same, just new provider)

**Phase 3: Bulk migration**
- Background job: copy all old images
- No downtime
- No DB changes

**Phase 4: Decommission Supabase Storage**
- Verify all images in R2
- Delete Supabase bucket
- Save $90/month

**Current project:** Start at Phase 1 (skip 2-4)

---

## Comparison: This Architecture vs Alternatives

### Alternative 1: Keep Supabase Storage
**Pros:**
- No new provider setup
- No code changes

**Cons:**
- ❌ High egress costs (~$90/month for 1TB)
- ❌ Vendor lock-in
- ❌ Bandwidth scales with traffic

**Verdict:** Not recommended for production

---

### Alternative 2: Cloudflare Images (Transform Service)
**Pros:**
- Built-in image optimization
- On-the-fly resize/format conversion

**Cons:**
- ❌ Higher cost ($5/month + $1 per 100k images)
- ❌ Less control over caching
- ❌ Still need storage (R2 or external)

**Verdict:** Good for future enhancement, overkill for v1

---

### Alternative 3: AWS S3 + CloudFront
**Pros:**
- Industry standard
- Mature ecosystem

**Cons:**
- ❌ Complex pricing (egress, CloudFront, regions)
- ❌ More configuration (buckets, IAM, CloudFront)
- ❌ Higher cost than R2

**Verdict:** R2 is simpler and cheaper

---

### Alternative 4: Self-Hosted MinIO
**Pros:**
- Full control
- S3-compatible

**Cons:**
- ❌ Need to manage servers
- ❌ No CDN (need separate setup)
- ❌ Higher operational complexity

**Verdict:** Not worth it for this use case

---

## Recommended Architecture: Final Answer

### Stack
```
┌─────────────────────────────────────────┐
│ Frontend: Next.js 14 (Vercel)           │
│ Database: Supabase Postgres             │
│ Storage: Cloudflare R2                  │
│ CDN: Cloudflare (custom domain)         │
│ Auth: Custom JWT (app-level)            │
└─────────────────────────────────────────┘
```

### Data Flow
```
Upload:
  Admin → /actions/products → R2.upload(key) → DB.insert(storage_key)

Display:
  Client → /api/media/{key} → [hybrid mode]
    → Admin: stream from R2
    → Public: 302 redirect to CDN
```

### Why This Wins
1. ✅ **Cost:** 98% cheaper than Supabase Storage
2. ✅ **Performance:** CDN-backed, <50ms latency
3. ✅ **Scalability:** Unlimited bandwidth
4. ✅ **Simplicity:** No existing data, clean start
5. ✅ **Portability:** S3-compatible, easy switch
6. ✅ **Maintenance:** Zero server management

---

## Quick Start Checklist

### Setup (15 minutes)
- [ ] Create Cloudflare R2 bucket (`product-images`)
- [ ] Generate R2 API tokens
- [ ] Set env vars in `.env.local`
- [ ] Test local upload

### Production Deploy (10 minutes)
- [ ] Add R2 credentials to Vercel
- [ ] Optional: Set up custom domain
- [ ] Set `MEDIA_DELIVERY_MODE=hybrid`
- [ ] Deploy

### Monitoring
- [ ] Check Cloudflare Analytics (CDN hits)
- [ ] Monitor Vercel bandwidth (should drop)
- [ ] Test admin upload → public view flow

---

## Conclusion

**This architecture is optimal because:**
1. No existing data = clean implementation
2. R2 = zero egress costs
3. Hybrid mode = best UX for admins and customers
4. S3-compatible = future-proof
5. Simple code = maintainable

**You get:**
- 98% cost reduction
- 3x faster public delivery
- Zero vendor lock-in
- Production-ready from day 1

**Next steps:**
1. Review [STORAGE_MIGRATION.md](STORAGE_MIGRATION.md) for setup
2. Configure R2 credentials
3. Test locally
4. Deploy to production with hybrid mode
5. Monitor Cloudflare Analytics for CDN performance
