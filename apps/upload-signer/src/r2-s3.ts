/**
 * S3-compatible signed requests to R2 (GET/PUT/DELETE) for Worker-side storage ops.
 */

import type { Env } from "./env";

function endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
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

async function hmacSha256Hex(key: ArrayBuffer, data: string): Promise<string> {
  const sig = await hmacSha256(key, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: ArrayBuffer | null,
  env: Env
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
  const canonicalHeaders =
    [`host:${url.host}`, `x-amz-content-sha256:${bodySha256}`, `x-amz-date:${amzDate}`].join("\n") + "\n";
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
  const kDate = await hmacSha256(`AWS4${env.CLOUDFLARE_R2_SECRET_ACCESS_KEY}`, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = await hmacSha256Hex(kSigning, stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${env.CLOUDFLARE_R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`;

  return {
    ...headers,
    Authorization: authorization,
    "X-Amz-Date": amzDate,
    "X-Amz-Content-Sha256": bodySha256,
  };
}

export async function r2Request(
  env: Env,
  method: string,
  key: string,
  body?: ArrayBuffer | null,
  extraHeaders: Record<string, string> = {}
): Promise<Response> {
  const url = new URL(`/${env.CLOUDFLARE_R2_BUCKET}/${key}`, endpoint(env.CLOUDFLARE_R2_ACCOUNT_ID));
  const bodyBuffer = body ?? null;
  const signedHeaders = await signRequest(method, url, extraHeaders, bodyBuffer, env);
  // Note: do not set `cache` on RequestInit — Cloudflare Workers fetch does not implement it.
  return fetch(url.toString(), {
    method,
    headers: signedHeaders,
    body: bodyBuffer && method !== "GET" && method !== "HEAD" ? bodyBuffer : undefined,
  });
}
