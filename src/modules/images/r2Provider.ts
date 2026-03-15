import type { HeadResult, DownloadResult, DownloadRangeOpts, R2Provider } from "./image.types";

/**
 * Cloudflare R2 Storage Provider (images module).
 *
 * Uses S3-compatible API for R2. Environment variables:
 * CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID,
 * CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET,
 * CLOUDFLARE_R2_PUBLIC_BASE_URL (optional).
 */

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl?: string;
}

function getConfig(): R2Config {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "Cloudflare R2 requires: CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, " +
        "CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET"
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL,
  };
}

function getEndpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

async function sha256Hex(data: BufferSource): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(key: BufferSource | string, data: string): Promise<ArrayBuffer> {
  const keyData: BufferSource = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function hmacSha256Hex(key: BufferSource, data: string): Promise<string> {
  const signature = await hmacSha256(key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: ArrayBuffer | null,
  config: R2Config
): Promise<Record<string, string>> {
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const region = "auto";
  const service = "s3";
  const bodyData = body || new ArrayBuffer(0);
  const bodySha256 = await sha256Hex(new Uint8Array(bodyData));

  const canonicalUri = url.pathname;
  const canonicalQueryString = Array.from(url.searchParams.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const signedHeaders = ["host", "x-amz-content-sha256", "x-amz-date"];
  const canonicalHeaders = [
    `host:${url.host}`,
    `x-amz-content-sha256:${bodySha256}`,
    `x-amz-date:${amzDate}`,
  ].join("\n") + "\n";
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders.join(";"),
    bodySha256,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256Hex(new TextEncoder().encode(canonicalRequest));
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, canonicalRequestHash].join("\n");
  const kDate = await hmacSha256(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = await hmacSha256Hex(kSigning, stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`;

  return {
    ...headers,
    Authorization: authorization,
    "X-Amz-Date": amzDate,
    "X-Amz-Content-Sha256": bodySha256,
  };
}

async function r2Request(
  method: string,
  key: string,
  body?: BodyInit | null,
  headers: Record<string, string> = {}
): Promise<Response> {
  const config = getConfig();
  const endpoint = getEndpoint(config.accountId);
  const url = new URL(`/${config.bucket}/${key}`, endpoint);

  let bodyBuffer: ArrayBuffer | null = null;
  if (body) {
    if (body instanceof ArrayBuffer) {
      bodyBuffer = body;
    } else if (body instanceof Uint8Array) {
      const newBuffer = new ArrayBuffer(body.byteLength);
      new Uint8Array(newBuffer).set(body);
      bodyBuffer = newBuffer;
    } else if (body instanceof Blob) {
      bodyBuffer = await body.arrayBuffer();
    } else if (typeof body === "string") {
      bodyBuffer = new TextEncoder().encode(body).buffer;
    } else {
      const blob = new Blob([body as BlobPart]);
      bodyBuffer = await blob.arrayBuffer();
    }
  }

  const signedHeaders = await signRequest(method, url, headers, bodyBuffer, config);
  return fetch(url.toString(), {
    method,
    headers: signedHeaders,
    body: bodyBuffer as BodyInit,
    cache: "no-store",
  });
}

export const r2Provider: R2Provider = {
  async head(key: string): Promise<HeadResult> {
    try {
      const res = await r2Request("HEAD", key);
      if (res.status === 404) return { exists: false };
      if (!res.ok) return { exists: false };
      const contentLength = res.headers.get("content-length");
      return {
        exists: true,
        size: contentLength ? parseInt(contentLength, 10) : undefined,
        contentType: res.headers.get("content-type") ?? undefined,
        etag: res.headers.get("etag")?.replace(/"/g, "") ?? undefined,
        lastModified: res.headers.get("last-modified") ?? undefined,
        cacheControl: res.headers.get("cache-control") ?? undefined,
      };
    } catch (err) {
      console.error("R2 head error:", err);
      return { exists: false };
    }
  },

  async download(key: string): Promise<DownloadResult> {
    const res = await r2Request("GET", key);
    if (res.status === 404 || !res.body) throw new Error("Not found");
    if (!res.ok) throw new Error(`R2 download failed: ${res.status}`);
    const size = res.headers.get("content-length");
    return {
      stream: res.body,
      size: size ? parseInt(size, 10) : undefined,
      contentType: res.headers.get("content-type") ?? undefined,
      etag: res.headers.get("etag")?.replace(/"/g, "") ?? undefined,
    };
  },

  async downloadRange(key: string, range: DownloadRangeOpts): Promise<DownloadResult> {
    const res = await r2Request("GET", key, null, {
      Range: `bytes=${range.start}-${range.end}`,
    });
    if (res.status !== 206 || !res.body) throw new Error("Range request failed");
    const contentLength = res.headers.get("content-length");
    return {
      stream: res.body,
      size: contentLength ? parseInt(contentLength, 10) : range.end - range.start + 1,
      contentType: res.headers.get("content-type") ?? undefined,
      etag: res.headers.get("etag")?.replace(/"/g, "") ?? undefined,
    };
  },

  async upload(
    key: string,
    body: Blob | Buffer | ReadableStream<Uint8Array> | NodeJS.ReadableStream,
    opts?: { contentType?: string }
  ): Promise<void> {
    const headers: Record<string, string> = {};
    if (opts?.contentType) headers["Content-Type"] = opts.contentType;

    let bodyBuffer: ArrayBuffer;
    if (body instanceof Buffer) {
      const newBuffer = new ArrayBuffer(body.byteLength);
      new Uint8Array(newBuffer).set(body);
      bodyBuffer = newBuffer;
    } else if (body instanceof Blob) {
      bodyBuffer = await body.arrayBuffer();
    } else if (typeof (body as ReadableStream).getReader === "function") {
      const chunks: Uint8Array[] = [];
      const reader = (body as ReadableStream<Uint8Array>).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const c of chunks) {
        combined.set(c, offset);
        offset += c.length;
      }
      bodyBuffer = combined.buffer;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of body as AsyncIterable<Buffer>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const combined = Buffer.concat(chunks);
      const newBuffer = new ArrayBuffer(combined.byteLength);
      new Uint8Array(newBuffer).set(combined);
      bodyBuffer = newBuffer;
    }

    const res = await r2Request("PUT", key, bodyBuffer, headers);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `R2 upload failed: ${res.status}`);
    }
  },

  async delete(key: string): Promise<void> {
    const res = await r2Request("DELETE", key);
    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `R2 delete failed: ${res.status}`);
    }
  },

  async list(prefix: string): Promise<string[]> {
    const config = getConfig();
    const endpoint = getEndpoint(config.accountId);
    const url = new URL(`/${config.bucket}`, endpoint);
    url.searchParams.set("list-type", "2");
    url.searchParams.set("prefix", prefix);
    const files: string[] = [];
    let continuationToken: string | null = null;

    do {
      if (continuationToken) url.searchParams.set("continuation-token", continuationToken);
      const signedHeaders = await signRequest("GET", url, {}, null, config);
      const res = await fetch(url.toString(), { method: "GET", headers: signedHeaders, cache: "no-store" });
      if (!res.ok) throw new Error(`R2 list failed: ${res.status}`);
      const text = await res.text();
      const keyRegex = /<Key>([^<]+)<\/Key>/g;
      let match;
      while ((match = keyRegex.exec(text)) !== null) files.push(match[1]);
      const truncatedMatch = text.match(/<IsTruncated>true<\/IsTruncated>/);
      const tokenMatch = text.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
      continuationToken = truncatedMatch && tokenMatch ? tokenMatch[1] : null;
    } while (continuationToken);

    return files;
  },
};

/**
 * Get direct public URL for a key when a public base is configured.
 * Uses NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL (client + server) or
 * CLOUDFLARE_R2_PUBLIC_BASE_URL (server only). Set the NEXT_PUBLIC_ var
 * so image URLs are direct CDN URLs in the browser.
 */
export function getR2PublicUrl(key: string): string | null {
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;
  if (!publicBaseUrl) return null;
  const base = publicBaseUrl.endsWith("/") ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
  return `${base}/${key}`;
}

const PRESIGNED_EXPIRES_SECONDS = 3600; // 1 hour

/**
 * Generate a presigned PUT URL for direct browser-to-R2 upload.
 * Only "host" is signed so the browser can send any Content-Type (or none) without 403.
 * Credentials stay server-side only.
 */
export async function getPresignedPutUrl(
  key: string,
  _contentType?: string
): Promise<{ putUrl: string; storageKey: string }> {
  const config = getConfig();
  const endpoint = getEndpoint(config.accountId);
  const path = `/${config.bucket}/${key}`;
  const url = new URL(path, endpoint);

  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const region = "auto";
  const service = "s3";

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${config.accessKeyId}/${credentialScope}`;

  const signedHeaders = "host";
  const canonicalHeaders = `host:${url.host}\n`;

  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    // Do NOT pre-encode; canonicalQueryString encoding will handle this once.
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(PRESIGNED_EXPIRES_SECONDS),
    "X-Amz-SignedHeaders": signedHeaders,
  };

  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join("&");

  const canonicalRequest = [
    "PUT",
    path,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const canonicalRequestHash = await sha256Hex(new TextEncoder().encode(canonicalRequest));
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");

  const kDate = await hmacSha256(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = await hmacSha256Hex(kSigning, stringToSign);

  queryParams["X-Amz-Signature"] = signature;
  const finalQuery = Object.keys(queryParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join("&");
  url.search = finalQuery;

  return { putUrl: url.toString(), storageKey: key };
}
