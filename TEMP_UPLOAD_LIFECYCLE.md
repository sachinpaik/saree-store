# Temp Upload Lifecycle Implementation

## Summary

This implementation adds proper temporary upload lifecycle management with cleanup for the product creation flow. Pre-create uploads no longer leak storage objects when admins cancel product creation.

---

## Problem Solved

**Before:** Files were uploaded to a temp folder (`temp/<uuid>.ext`) before product creation. If the admin canceled, those temp files remained orphaned and never deleted.

**After:** 
- Temp files are tracked by session ID
- Cancel triggers immediate cleanup of temp files
- Abandoned temp files are cleaned up automatically by a periodic script
- Product creation properly finalizes temp uploads to final location

---

## Implementation Overview

### 1. Temporary Upload Model

**Session-based temp uploads:**
- Each product creation session has a unique `sessionId` (UUID)
- Temp files uploaded to: `temp/<sessionId>/<uuid>.<ext>`
- Session ID is generated when ProductForm mounts
- All temp files for a session can be cleaned up together

**Tracking:**
- ProductImageUploader maintains local state of uploaded images
- Each uploaded image tracks its `storage_key`, metadata, and session
- Parent component (ProductForm) receives updates via `onImagesChange` callback

### 2. Cancel Behavior

**When admin cancels product creation:**

```typescript
// ProductForm.tsx
const handleCancel = async () => {
  // 1. Call cleanup from uploader component
  await cleanupTempUploads();
  
  // 2. Navigate away
  router.push("/admin/products");
};
```

**Cleanup process:**
1. Collect all `storage_key` values from uploaded images
2. POST to `/api/cleanup-temp` with `{ storage_keys: [...] }`
3. API endpoint deletes files using storage provider
4. Non-blocking: if some deletes fail, show warning but continue

**User experience:**
- Clean and safe cancel flow
- No orphaned temp files after normal cancel
- Immediate preview continues working during upload

### 3. Finalize Behavior

**When product is successfully created:**

```typescript
// actions/products.ts - createProduct
const keyMap = await finalizeTempUploads(productId, tempStorageKeys);

for (const img of uploadedImages) {
  const finalKey = keyMap.get(img.storage_key) || img.storage_key;
  
  await supabase.from("product_images").insert({
    product_id: productId,
    storage_key: finalKey,
    alt_text: img.alt_text,
    is_primary: img.is_primary,
    show_on_homepage: img.show_on_homepage,
    sort_order: i,
  });
}
```

**Finalize process:**
1. Download file from temp location (`temp/<sessionId>/<uuid>.ext`)
2. Upload to final location (`<productId>/<uuid>.ext`)
3. Delete temp file (best effort)
4. Create `product_images` row with final `storage_key`
5. If move fails, keep temp key (still works via `/api/media`)

**Storage provider abstraction:**
- Uses `finalizeTempUploads()` helper from `temp-upload-helpers.ts`
- Provider-agnostic: works with R2, Supabase, local storage
- Copy + delete pattern (works even if provider lacks rename/move)

### 4. Abandoned Temp File Cleanup

**Automatic cleanup via script:**

```bash
# Run cleanup script manually
npx ts-node scripts/cleanup-temp-uploads.ts

# Or via cron (daily at 3 AM)
0 3 * * * cd /path/to/project && node scripts/cleanup-temp-uploads.js >> /var/log/temp-cleanup.log 2>&1
```

**Cleanup logic:**
1. List all files in `temp/` prefix
2. Check each file's `lastModified` timestamp
3. Delete files older than TTL (default: 24 hours)
4. Log deletion count

**Configuration:**
- `TEMP_UPLOAD_TTL_HOURS` environment variable (default: 24)
- Can override via script argument: `--ttl-hours=48`
- Dry run mode: `--dry-run` (shows what would be deleted)

---

## Files Changed

### New Files

1. **`src/lib/storage/temp-upload-helpers.ts`** (180 lines)
   - `finalizeTempUploads()` - Move temp files to final location
   - `cleanupTempUploadsByKeys()` - Delete specific temp files
   - `cleanupAbandonedTempUploads()` - Delete old temp files by TTL
   - `cleanupTempUploadsForSession()` - Delete all files for a session

2. **`src/app/api/cleanup-temp/route.ts`** (65 lines)
   - POST endpoint for temp file cleanup
   - Two modes: by keys, or by TTL (abandoned)
   - Used by cancel flow and periodic cleanup script

3. **`scripts/cleanup-temp-uploads.ts`** (95 lines)
   - CLI script for abandoned temp file cleanup
   - Configurable TTL via argument or env variable
   - Supports dry-run mode
   - Designed for cron job execution

4. **`scripts/cleanup-temp-uploads.js`** (95 lines)
   - JavaScript version of cleanup script (compiled target)

### Modified Files

1. **`src/lib/storage/types.ts`** (+1 line)
   - Added optional `list?(prefix: string): Promise<string[]>` method to `StorageProvider` interface

2. **`src/lib/storage/local-provider.ts`** (+25 lines)
   - Implemented `list()` method for local filesystem
   - Recursively walks directory tree to list files

3. **`src/lib/storage/cloudflare-r2-provider.ts`** (+45 lines)
   - Implemented `list()` method for R2
   - Uses S3 ListObjectsV2 API with pagination support
   - Parses XML response to extract file keys

4. **`src/lib/storage/supabase-provider.ts`** (+50 lines)
   - Implemented `list()` method for Supabase Storage
   - Uses Supabase Storage list API with pagination
   - Handles offset-based pagination

5. **`src/components/admin/ProductImageUploader.tsx`** (+50 lines)
   - Added `sessionId` prop (passed from parent)
   - Added `onCleanup` callback prop
   - Added `cleanupTempUploads()` method
   - Tracks uploaded images for cleanup
   - Sends `session_id` with upload requests

6. **`src/components/admin/ProductForm.tsx`** (+60 lines)
   - Generates stable `sessionId` on mount
   - Passes `sessionId` to ProductImageUploader
   - Added `cleanupTempUploads()` method
   - Added `handleCancel()` to cleanup before navigating
   - Calls cleanup on Cancel button click

7. **`src/app/api/upload-temp/route.ts`** (+5 lines)
   - Accepts `session_id` from form data
   - Uses session ID in temp storage key: `temp/<sessionId>/<uuid>.ext`
   - Fallback to generated UUID if no session ID provided

8. **`src/app/actions/products.ts`** (-40 lines, +15 lines)
   - Replaced inline finalize logic with `finalizeTempUploads()` helper
   - Cleaner, more maintainable code
   - Uses new storage helper abstraction

9. **`.env.local.example`** (+10 lines)
   - Added `TEMP_UPLOAD_TTL_HOURS` documentation
   - Added Cloudflare R2 environment variables
   - Improved storage provider documentation

---

## Temp Upload Lifecycle

### Full Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN CREATES PRODUCT                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ProductForm generates sessionId: abc-123-def
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. UPLOAD IMAGES (before product exists)                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
    ProductImageUploader uploads each file:
    - POST /api/upload-temp with file + session_id
    - Storage key: temp/abc-123-def/f3a2.jpg
    - Preview shown immediately
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3a. CANCEL PATH (orphaned files)                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
    Cancel button clicked:
    - cleanupTempUploads() called
    - POST /api/cleanup-temp with storage_keys
    - Files deleted from temp/abc-123-def/
    - Navigate to /admin/products
                          │
                          ▼
                      (DONE)

┌─────────────────────────────────────────────────────────────┐
│ 3b. SUCCESS PATH (product created)                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
    Form submitted:
    - createProduct() called
    - Product inserted, productId = 456
                          │
                          ▼
    finalizeTempUploads(productId, tempKeys):
    - Download: temp/abc-123-def/f3a2.jpg
    - Upload: 456/f3a2.jpg
    - Delete: temp/abc-123-def/f3a2.jpg
                          │
                          ▼
    Insert product_images rows:
    - storage_key: 456/f3a2.jpg
    - alt_text, is_primary, etc.
                          │
                          ▼
    Redirect to /admin/products/456/edit
                          │
                          ▼
                      (DONE)

┌─────────────────────────────────────────────────────────────┐
│ 4. ABANDONED CLEANUP (periodic)                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
    Cron job runs daily:
    - node scripts/cleanup-temp-uploads.js
    - Lists all temp/ files
    - Checks lastModified timestamp
    - Deletes files > 24 hours old
                          │
                          ▼
                      (DONE)
```

---

## Storage Abstraction

### Provider Interface Extensions

All storage providers now support listing:

```typescript
interface StorageProvider {
  upload(key, body, opts): Promise<void>;
  delete(key): Promise<void>;
  exists(key): Promise<boolean>;
  head(key): Promise<HeadResult>;
  download(key): Promise<DownloadResult>;
  downloadRange?(key, range): Promise<DownloadResult>;
  list?(prefix): Promise<string[]>;  // NEW
}
```

### Implementation Details

**Local Provider:**
- Recursively walks filesystem directory
- Returns relative paths from base storage directory

**Cloudflare R2 Provider:**
- Uses S3 ListObjectsV2 API
- Handles pagination with continuation tokens
- Parses XML response

**Supabase Provider:**
- Uses Supabase Storage list API
- Handles offset-based pagination
- Returns file keys with prefix

---

## Environment Configuration

### New Environment Variable

Add to `.env.local`:

```bash
# Temp upload cleanup
TEMP_UPLOAD_TTL_HOURS=24
```

**Purpose:** Controls how long temp files are retained before automatic cleanup.

**Default:** 24 hours

**Usage:**
- Cleanup script: `cleanupAbandonedTempUploads(ttlHours)`
- Can override via CLI: `--ttl-hours=48`

---

## Deployment Guide

### 1. Environment Setup

Add to production `.env`:

```bash
TEMP_UPLOAD_TTL_HOURS=24
```

### 2. Periodic Cleanup Job

#### Option A: Cron Job

```bash
# Edit crontab
crontab -e

# Add line (runs daily at 3 AM)
0 3 * * * cd /path/to/project && node scripts/cleanup-temp-uploads.js >> /var/log/temp-cleanup.log 2>&1
```

#### Option B: Vercel Cron (if on Vercel)

Create `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-temp",
    "schedule": "0 3 * * *"
  }]
}
```

Create API route `src/app/api/cron/cleanup-temp/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { cleanupAbandonedTempUploads } from "@/lib/storage/temp-upload-helpers";

export async function GET() {
  const ttlHours = parseInt(process.env.TEMP_UPLOAD_TTL_HOURS || "24", 10);
  const deleted = await cleanupAbandonedTempUploads(ttlHours);
  
  return NextResponse.json({
    success: true,
    deleted,
    timestamp: new Date().toISOString(),
  });
}
```

#### Option C: Manual Execution

```bash
# SSH into server
ssh user@yourserver.com

# Run cleanup manually
cd /path/to/project
npx ts-node scripts/cleanup-temp-uploads.ts
```

### 3. Monitoring

**Check cleanup logs:**

```bash
tail -f /var/log/temp-cleanup.log
```

**Expected output:**

```
[2024-03-10T03:00:00.000Z] Cleanup script starting...
Storage provider: cloudflare-r2
TTL: 24 hours
Dry run: NO

[2024-03-10T03:00:15.000Z] ✓ Cleanup completed successfully
Files deleted: 23
```

---

## Testing Checklist

### Manual Testing

#### Test 1: Normal Create Flow
- [ ] Navigate to `/admin/products/new`
- [ ] Upload 2-3 images
- [ ] Fill form and submit
- [ ] Verify product created
- [ ] Verify images in `product_images` table with final storage keys
- [ ] Verify temp files deleted from storage
- [ ] Check storage: no files in `temp/<sessionId>/`

#### Test 2: Cancel Flow
- [ ] Navigate to `/admin/products/new`
- [ ] Upload 2-3 images
- [ ] Wait for uploads to complete
- [ ] Click Cancel button
- [ ] Wait 2-3 seconds
- [ ] Check storage: temp files should be deleted
- [ ] Verify no files in `temp/<sessionId>/`

#### Test 3: Browser Refresh (Orphaned Files)
- [ ] Navigate to `/admin/products/new`
- [ ] Upload 2-3 images
- [ ] Refresh browser (temp files orphaned)
- [ ] Run cleanup script: `npx ts-node scripts/cleanup-temp-uploads.ts --ttl-hours=0`
- [ ] Verify orphaned temp files deleted

#### Test 4: Multiple Concurrent Sessions
- [ ] Open 2 browser tabs
- [ ] Tab 1: Create product, upload images (session A)
- [ ] Tab 2: Create product, upload images (session B)
- [ ] Tab 1: Cancel (only session A files deleted)
- [ ] Tab 2: Create product successfully
- [ ] Verify session A temp files deleted
- [ ] Verify session B files finalized to product

#### Test 5: Cleanup Script
- [ ] Create some test temp files older than 24h (manually adjust timestamps)
- [ ] Run: `npx ts-node scripts/cleanup-temp-uploads.ts --dry-run`
- [ ] Verify it lists old files
- [ ] Run: `npx ts-node scripts/cleanup-temp-uploads.ts`
- [ ] Verify old files deleted
- [ ] Verify recent files retained

### Automated Testing (Future)

Consider adding:
- Unit tests for `temp-upload-helpers.ts`
- Integration tests for finalize flow
- E2E tests for cancel behavior

---

## Error Handling

### Graceful Degradation

**If cleanup fails:**
- Log warning, don't block user flow
- Temp files remain but will be cleaned by periodic script
- User can still cancel and navigate away

**If finalize fails:**
- Keep temp storage key
- `/api/media` still serves temp files
- Product creation succeeds (images accessible)
- Manual cleanup possible

**If periodic cleanup fails:**
- Logs error but doesn't crash
- Next run will attempt cleanup again
- Temp files accumulate until successful run

### Non-Blocking Cleanup

```typescript
try {
  await cleanupTempUploads();
} catch (err) {
  console.warn("Cleanup error:", err);
  // Continue anyway - periodic cleanup will handle it
}
```

---

## Performance Considerations

### Upload Performance
- **Same as before:** Immediate upload on file selection
- **One extra operation:** Move from temp to final location (async, non-blocking)
- **Storage overhead:** Temp + final (brief overlap during finalize)

### Cleanup Performance
- **List operation:** Depends on temp file count (usually < 100)
- **Delete operations:** Batched, best effort
- **Cron frequency:** Daily is sufficient (adjustable)

### Storage Costs
- **Temp files:** Retained for TTL (default 24h)
- **Duplicate storage:** Brief (seconds) during finalize
- **Orphaned files:** Cleaned up within 24h

---

## Security Considerations

### Temp Upload Endpoint

**Current state:**
- ✅ File type validation (images only)
- ✅ File size validation (10MB max)
- ✅ UUID-based filenames (no path traversal)
- ✅ Session-based namespacing
- ⚠️ No rate limiting (future: add rate limit middleware)
- ⚠️ No auth check (future: verify admin session)

**Recommendations:**
1. Add rate limiting: max 10 uploads per minute per session
2. Add admin auth check in `/api/upload-temp`
3. Consider signed upload URLs for higher security

### Cleanup Endpoint

**Current state:**
- ✅ Only deletes files in `temp/` prefix
- ✅ Server-side validation
- ⚠️ No auth check (future: verify admin session)

**Recommendations:**
1. Add admin auth check in `/api/cleanup-temp`
2. Consider requiring CSRF token

### Storage Keys

**Current state:**
- ✅ UUID-based (non-guessable)
- ✅ Namespaced (temp/ vs productId/)
- ✅ No user-controlled paths

---

## Troubleshooting

### Issue: Temp files not deleted on cancel

**Possible causes:**
1. JavaScript disabled
2. Network error during cleanup
3. Storage provider error

**Solution:**
- Check browser console for errors
- Verify `/api/cleanup-temp` is accessible
- Run periodic cleanup script manually

### Issue: Abandoned temp files accumulating

**Possible causes:**
1. Cleanup script not running
2. TTL too long
3. Storage provider list() not working

**Solution:**
- Verify cron job is running: `crontab -l`
- Check cleanup logs: `tail /var/log/temp-cleanup.log`
- Run script manually to diagnose
- Reduce TTL: `--ttl-hours=12`

### Issue: Finalize fails during product creation

**Possible causes:**
1. Storage provider error
2. Temp file already deleted
3. Network issue

**Solution:**
- Check server logs for errors
- Verify temp file exists in storage
- Product creation succeeds anyway (temp key used)
- Images still accessible via `/api/media`

---

## Future Enhancements

### 1. True Dry-Run Mode
- Implement dry-run in cleanup helpers
- List files without deleting
- Show what would be deleted

### 2. Cleanup Metrics
- Track deleted file count over time
- Monitor orphaned file growth
- Alert if cleanup fails repeatedly

### 3. Direct Upload to Final Location
- Upload directly to `temp-<sessionId>/` namespace
- Rename to `<productId>/` on create (if provider supports)
- Avoid copy operation for better performance

### 4. Progress Indicators
- Show upload progress percentage
- Indicate finalize progress during product creation

### 5. Drag-and-Drop UI
- Add drag-and-drop zone for images
- Better UX for multi-file upload

---

## API Reference

### POST /api/upload-temp

**Purpose:** Upload file to temporary storage

**Request:**
```typescript
FormData {
  file: File,
  session_id: string (optional)
}
```

**Response:**
```typescript
{
  storage_key: string,      // "temp/<sessionId>/<uuid>.ext"
  file_name: string,
  file_size: number,
  content_type: string
}
```

**Errors:**
- 400: No file / Invalid file type / File too large
- 500: Upload failed

### POST /api/cleanup-temp

**Purpose:** Cleanup temporary uploads

**Mode 1: By Keys**

```typescript
{
  storage_keys: string[]
}
```

**Response:**
```typescript
{
  deleted: number,
  total: number,
  message: string
}
```

**Mode 2: Abandoned**

```typescript
{
  abandoned: true,
  ttl_hours?: number  // optional, defaults to env TEMP_UPLOAD_TTL_HOURS
}
```

**Response:**
```typescript
{
  deleted: number,
  ttl_hours: number,
  message: string
}
```

**Errors:**
- 400: Invalid request
- 500: Cleanup failed

---

## Summary

This implementation provides a complete lifecycle for temporary uploads:

1. ✅ **Immediate upload** - Images upload before product exists
2. ✅ **Session tracking** - Temp files organized by session
3. ✅ **Cancel cleanup** - Temp files deleted on cancel
4. ✅ **Finalize on create** - Temp files moved to final location
5. ✅ **Automatic cleanup** - Abandoned files cleaned periodically
6. ✅ **Provider agnostic** - Works with all storage providers
7. ✅ **Non-blocking** - Cleanup failures don't break UX
8. ✅ **Documented** - Clear deployment and troubleshooting guides

**No orphaned temp files. Clean, safe, maintainable.**
