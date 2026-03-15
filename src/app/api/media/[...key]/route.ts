import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import * as imageService from "@/modules/images/image.service";

/**
 * MEDIA DELIVERY STRATEGY
 * 
 * This route supports three delivery modes via MEDIA_DELIVERY_MODE env var:
 * 
 * 1. "stream" (default for development):
 *    - App downloads from storage and streams to client
 *    - Pros: Works with any provider, no CORS issues, preview works immediately
 *    - Cons: Uses app server bandwidth and compute
 *    - Best for: Admin previews, local development
 * 
 * 2. "redirect":
 *    - App issues 302 redirect to Cloudflare public URL
 *    - Requires: CLOUDFLARE_R2_PUBLIC_BASE_URL configured (custom domain or R2.dev)
 *    - Pros: Offloads traffic to Cloudflare CDN, zero app bandwidth
 *    - Cons: One extra request (redirect), custom domain setup required
 *    - Best for: Production storefront with custom domain (e.g., https://cdn.example.com)
 * 
 * 3. "hybrid":
 *    - Admin paths (/admin) → stream (for immediate previews)
 *    - Public paths → redirect (for CDN performance)
 *    - Best for: Production with admin UX and storefront performance balance
 * 
 * RECOMMENDATIONS:
 * - Development: MEDIA_DELIVERY_MODE=stream (default)
 * - Production (admin-heavy): MEDIA_DELIVERY_MODE=hybrid
 * - Production (storefront-optimized): MEDIA_DELIVERY_MODE=redirect (with custom domain)
 * 
 * CACHING:
 * - Immutable keys (UUID-based): 1 year cache
 * - Other keys: 1 hour cache (configurable)
 * - ETag support for conditional requests
 */

const MEDIA_CACHE_IMMUTABLE_SECONDS = parseInt(
  process.env.MEDIA_CACHE_IMMUTABLE_SECONDS ?? "31536000",
  10
);
const MEDIA_CACHE_DEFAULT_SECONDS = parseInt(
  process.env.MEDIA_CACHE_DEFAULT_SECONDS ?? "3600",
  10
);

type DeliveryMode = "stream" | "redirect" | "hybrid";

function getDeliveryMode(): DeliveryMode {
  const mode = process.env.MEDIA_DELIVERY_MODE ?? "stream";
  if (mode === "redirect" || mode === "hybrid") return mode as DeliveryMode;
  return "stream";
}

function isImmutableKey(key: string): boolean {
  // Keys with uuid or hash-like segment are considered immutable
  const uuidLike = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const hashLike = /[0-9a-f]{16,}/i;
  return uuidLike.test(key) || hashLike.test(key);
}

function isAdminRequest(request: NextRequest): boolean {
  const referer = request.headers.get("referer") || "";
  return referer.includes("/admin");
}

function toWebStream(
  stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream
): ReadableStream<Uint8Array> {
  if (typeof (stream as ReadableStream<Uint8Array>).getReader === "function") {
    return stream as ReadableStream<Uint8Array>;
  }
  return Readable.toWeb(stream as unknown as Readable) as ReadableStream<Uint8Array>;
}

function parseRange(rangeHeader: string | null, size: number): { start: number; end: number } | null {
  if (!rangeHeader?.startsWith("bytes=") || size === undefined) return null;
  const part = rangeHeader.slice(6).trim().split(",")[0]?.trim();
  if (!part) return null;
  const [s, e] = part.split("-").map((x) => (x === "" ? undefined : parseInt(x, 10)));
  const start = s ?? 0;
  const end = e ?? size - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) return null;
  return { start, end };
}

/**
 * Decide whether to stream or redirect based on mode and request context
 */
function shouldStream(mode: DeliveryMode, request: NextRequest, key: string): boolean {
  if (mode === "stream") return true;
  if (mode === "hybrid" && isAdminRequest(request)) return true;
  
  // For redirect mode, check if public URL is available
  const publicUrl = imageService.getPublicUrl(key);
  if (!publicUrl) {
    console.warn(`MEDIA_DELIVERY_MODE=${mode} but no CLOUDFLARE_R2_PUBLIC_BASE_URL configured, falling back to stream`);
    return true;
  }
  
  return false;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await context.params;
  const key = keyParts.join("/");
  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Optional: require auth for private/ prefix (stub)
  if (key.startsWith("private/")) {
    // TODO: check session and/or admin; for now allow
  }

  const head = await imageService.head(key);
  if (!head.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const size = head.size;
  const contentType = head.contentType ?? "application/octet-stream";
  const etag = head.etag;
  const cacheControl = isImmutableKey(key)
    ? `public, max-age=${MEDIA_CACHE_IMMUTABLE_SECONDS}, immutable`
    : `public, max-age=${MEDIA_CACHE_DEFAULT_SECONDS}`;

  // Conditional GET
  if (etag) {
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch?.split(/,\s*/).some((v) => v.trim() === etag || v.trim() === `W/${etag}`)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "Cache-Control": cacheControl,
          ETag: etag,
        },
      });
    }
  }

  // Delivery mode decision
  const mode = getDeliveryMode();
  const stream = shouldStream(mode, request, key);

  // REDIRECT MODE: Send 302 to Cloudflare public URL
  if (!stream) {
    const publicUrl = imageService.getPublicUrl(key);
    if (publicUrl) {
      return NextResponse.redirect(publicUrl, {
        status: 302,
        headers: {
          "Cache-Control": cacheControl,
        },
      });
    }
  }

  // STREAM MODE: Download and stream through app
  const rangeHeader = request.headers.get("range");
  const range = size !== undefined ? parseRange(rangeHeader, size) : null;

  if (rangeHeader && range === null && size !== undefined) {
    return new NextResponse(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${size}`,
        "Cache-Control": cacheControl,
      },
    });
  }

  if (range) {
    let downloadStream: ReadableStream<Uint8Array> | NodeJS.ReadableStream;
    let contentLength: number;
    try {
      try {
        const result = await imageService.downloadRange(key, range);
        downloadStream = result.stream;
        contentLength = result.size ?? range.end - range.start + 1;
      } catch {
        const result = await imageService.download(key);
        downloadStream = result.stream;
        const fullSize = result.size ?? size;
        if (fullSize !== undefined && fullSize <= 2 * 1024 * 1024) {
          const buf = await streamToBuffer(downloadStream);
          const slice = buf.subarray(range.start, range.end + 1);
          downloadStream = new ReadableStream<Uint8Array>({
            start(ctrl) {
              ctrl.enqueue(slice);
              ctrl.close();
            },
          });
          contentLength = slice.length;
        } else {
          return new NextResponse(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${size}`, "Cache-Control": cacheControl },
          });
        }
      }
    } catch (e) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const webStream = toWebStream(downloadStream);
    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(contentLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": cacheControl,
        ...(etag && { ETag: etag }),
      },
    });
  }

  try {
    const result = await imageService.download(key);
    const webStream = toWebStream(result.stream);
    const headers: Record<string, string> = {
      "Content-Type": result.contentType ?? contentType,
      "Cache-Control": cacheControl,
      ...(etag && { ETag: etag }),
    };
    if (result.size !== undefined) {
      headers["Content-Length"] = String(result.size);
      headers["Accept-Ranges"] = "bytes";
    }
    return new NextResponse(webStream, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream
): Promise<Uint8Array> {
  if (typeof (stream as ReadableStream<Uint8Array>).getReader === "function") {
    const reader = (stream as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const len = chunks.reduce((a, c) => a + c.length, 0);
    const out = new Uint8Array(len);
    let off = 0;
    for (const c of chunks) {
      out.set(c, off);
      off += c.length;
    }
    return out;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return new Uint8Array(Buffer.concat(chunks));
}
