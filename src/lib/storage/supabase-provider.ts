import type { StorageProvider, HeadResult, DownloadResult } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

function getConfig() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase storage");
  }
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SERVICE_ROLE_KEY, bucket: BUCKET };
}

function objectUrl(key: string): string {
  const { url, bucket } = getConfig();
  const path = key.split("/").map((s) => encodeURIComponent(s)).join("/");
  return `${url}/storage/v1/object/authenticated/${bucket}/${path}`;
}

export const supabaseProvider: StorageProvider = {
  async head(key: string): Promise<HeadResult> {
    const { key: serviceKey } = getConfig();
    const res = await fetch(objectUrl(key), {
      method: "HEAD",
      headers: { Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    });
    if (res.status === 404) return { exists: false };
    if (!res.ok) return { exists: false };
    const contentLength = res.headers.get("content-length");
    return {
      exists: true,
      size: contentLength ? parseInt(contentLength, 10) : undefined,
      contentType: res.headers.get("content-type") ?? undefined,
      etag: res.headers.get("etag") ?? undefined,
      lastModified: res.headers.get("last-modified") ?? undefined,
      cacheControl: res.headers.get("cache-control") ?? undefined,
    };
  },

  async download(key: string): Promise<DownloadResult> {
    const { key: serviceKey } = getConfig();
    const res = await fetch(objectUrl(key), {
      headers: { Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    });
    if (res.status === 404 || !res.body) {
      throw new Error("Not found");
    }
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const size = res.headers.get("content-length");
    return {
      stream: res.body,
      size: size ? parseInt(size, 10) : undefined,
      contentType: res.headers.get("content-type") ?? undefined,
      etag: res.headers.get("etag") ?? undefined,
    };
  },

  async upload(
    key: string,
    body: Blob | Buffer | ReadableStream<Uint8Array> | NodeJS.ReadableStream,
    opts?: { contentType?: string }
  ): Promise<void> {
    const { url, key: serviceKey, bucket } = getConfig();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${serviceKey}`,
      "x-upsert": "false",
    };
    if (opts?.contentType) headers["content-type"] = opts.contentType;
    const bodyPayload =
      body instanceof Buffer
        ? body
        : body instanceof Blob
          ? body
          : typeof (body as ReadableStream).getReader === "function"
            ? await new Response(body as ReadableStream<Uint8Array>).arrayBuffer()
            : await streamToBuffer(body as NodeJS.ReadableStream);
    const path = key.split("/").map((s) => encodeURIComponent(s)).join("/");
    const bodyInit: BodyInit =
      bodyPayload instanceof Buffer
        ? new Uint8Array(bodyPayload)
        : (bodyPayload as BodyInit);
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers,
      body: bodyInit,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `Upload failed: ${res.status}`);
    }
  },

  async delete(key: string): Promise<void> {
    const { url, key: serviceKey, bucket } = getConfig();
    const path = key.split("/").map((s) => encodeURIComponent(s)).join("/");
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok && res.status !== 404) {
      const t = await res.text();
      throw new Error(t || `Delete failed: ${res.status}`);
    }
  },

  async exists(key: string): Promise<boolean> {
    const h = await this.head(key);
    return h.exists;
  },

  async list(prefix: string): Promise<string[]> {
    const { url, key: serviceKey, bucket } = getConfig();
    const files: string[] = [];
    let offset = 0;
    const limit = 1000;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const searchParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        prefix: prefix,
      });

      const res = await fetch(
        `${url}/storage/v1/object/list/${bucket}?${searchParams}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${serviceKey}` },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error(`Supabase list failed: ${res.status}`);
      }

      const data = await res.json();
      
      // Response format: array of { name, id, updated_at, created_at, last_accessed_at, metadata }
      if (Array.isArray(data) && data.length > 0) {
        for (const item of data) {
          if (item.name) {
            // Prepend prefix if not already included
            const fullKey = item.name.startsWith(prefix) ? item.name : `${prefix}/${item.name}`;
            files.push(fullKey);
          }
        }
        
        if (data.length < limit) {
          break;
        }
        offset += limit;
      } else {
        break;
      }
    }

    return files;
  },
};

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
