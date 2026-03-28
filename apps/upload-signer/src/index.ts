/**
 * Upload-signer: Cloudflare Worker — presigned uploads + R2 ops for static admin clients.
 * POST /sign-upload | /finalize-temp | /delete-objects (all require admin JWT).
 */

import {
  createRemoteJWKSet,
  decodeJwt,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from "jose";
import type { Env } from "./env";
import { r2Request } from "./r2-s3";

export type { Env } from "./env";

const PRESIGNED_EXPIRES_SECONDS = 900; // 15 minutes
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const SAFE_PRODUCT_ID = /^[a-zA-Z0-9_-]{1,128}$/;
const MAX_KEYS_FINALIZE = 50;
const MAX_KEYS_DELETE = 100;

interface SignUploadBody {
  fileName?: string;
  contentType?: string;
  productId?: string;
  mode?: "temp" | "final";
}

function jsonResponse(data: object, status: number, corsHeaders: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allow = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(",").map((o) => o.trim()).includes(origin)
    : true;
  const acao = allow ? origin || "*" : "";
  return {
    "Access-Control-Allow-Origin": acao,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

type TokenDiag = {
  /** From JWT header (unsigned) — e.g. ES256, HS256 */
  alg?: string;
  /** From JWT payload (unsigned) — helps match issuer */
  iss?: string;
  /** If JWKS URL was fetched, HTTP status */
  jwks_status?: number;
};

type AdminAuthResult =
  | { ok: true; sub: string }
  | { ok: false; reason: "invalid_token" | "not_admin" | "missing_auth_env"; diag?: TokenDiag };

/** Supabase asymmetric JWTs (ES256 / ECC P-256) — verify via JWKS. */
async function verifySupabaseJwtWithJwks(
  token: string,
  supabaseUrl: string,
  diag: TokenDiag
): Promise<JWTPayload | null> {
  const base = supabaseUrl.replace(/\/$/, "");
  const jwksPath = `${base}/auth/v1/.well-known/jwks.json`;
  const jwksUrl = new URL(jwksPath);

  const jwksRes = await fetch(jwksUrl.toString(), { method: "GET" });
  diag.jwks_status = jwksRes.status;
  if (!jwksRes.ok) {
    console.error("upload-signer: JWKS fetch failed", jwksPath, jwksRes.status);
    return null;
  }

  const JWKS = createRemoteJWKSet(jwksUrl);

  let unverifiedPayload: JWTPayload;
  try {
    unverifiedPayload = decodeJwt(token);
  } catch {
    return null;
  }
  if (typeof unverifiedPayload.iss === "string") {
    diag.iss = unverifiedPayload.iss;
  }

  /** Issuer order: token’s iss first (Supabase may vary slightly), then defaults. */
  const issuerCandidates = new Set<string>();
  if (typeof unverifiedPayload.iss === "string") issuerCandidates.add(unverifiedPayload.iss);
  issuerCandidates.add(`${base}/auth/v1`);
  issuerCandidates.add(`${base}/auth/v1/`);

  const verifyOpts = [
    { audience: "authenticated" as const },
    {},
  ];

  for (const iss of issuerCandidates) {
    for (const extra of verifyOpts) {
      try {
        const { payload } = await jwtVerify(token, JWKS, {
          issuer: iss,
          clockTolerance: 120,
          ...extra,
        });
        return payload;
      } catch {
        /* try next */
      }
    }
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: "authenticated",
      clockTolerance: 120,
    });
    return payload;
  } catch {
    try {
      const { payload } = await jwtVerify(token, JWKS, { clockTolerance: 120 });
      return payload;
    } catch (e) {
      console.error("upload-signer: JWKS verify failed", e);
      return null;
    }
  }
}

/**
 * Verify Supabase access_token:
 * - HS256 with SUPABASE_JWT_SECRET when set (legacy shared secret), or
 * - ES256 (ECC P-256) via JWKS when SUPABASE_URL is set — no shared secret; UI only shows key IDs.
 * Admin role may be in app_metadata or user_metadata.
 */
function readTokenDiagnostics(token: string, diag: TokenDiag): void {
  try {
    diag.alg = decodeProtectedHeader(token).alg;
  } catch {
    /* ignore */
  }
  try {
    const p = decodeJwt(token);
    if (typeof p.iss === "string") diag.iss = p.iss;
  } catch {
    /* ignore */
  }
}

async function verifyAdminToken(token: string, env: Env): Promise<AdminAuthResult> {
  const jwtSecret = env.SUPABASE_JWT_SECRET?.trim();
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const diag: TokenDiag = {};
  readTokenDiagnostics(token, diag);

  if (!jwtSecret && !supabaseUrl) {
    return { ok: false, reason: "missing_auth_env" };
  }

  let payload: JWTPayload | null = null;

  if (jwtSecret) {
    const secret = new TextEncoder().encode(jwtSecret);
    try {
      const verified = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
        audience: "authenticated",
        clockTolerance: 120,
      });
      payload = verified.payload;
    } catch {
      try {
        const verified = await jwtVerify(token, secret, {
          algorithms: ["HS256"],
          clockTolerance: 120,
        });
        payload = verified.payload;
      } catch {
        payload = null;
      }
    }
  }

  /** ES256 / RS256 tokens must use JWKS — HS256 path will not verify them. */
  if (!payload && supabaseUrl) {
    payload = await verifySupabaseJwtWithJwks(token, supabaseUrl, diag);
  }

  if (!payload) {
    return { ok: false, reason: "invalid_token", diag };
  }

  const appMeta = payload.app_metadata as Record<string, unknown> | undefined;
  const userMeta = payload.user_metadata as Record<string, unknown> | undefined;
  const role =
    (typeof appMeta?.role === "string" && appMeta.role) ||
    (typeof userMeta?.role === "string" && userMeta.role) ||
    undefined;

  if (role !== "admin") {
    return { ok: false, reason: "not_admin" };
  }
  if (!payload.sub) {
    return { ok: false, reason: "invalid_token" };
  }
  return { ok: true, sub: String(payload.sub) };
}

function sanitizeExtension(fileName: string): string {
  const ext = (fileName.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z]/g, "");
  return ALLOWED_EXTENSIONS.has(ext) ? ext : "jpg";
}

function buildStorageKey(productId: string, mode: "temp" | "final", fileName: string): string {
  const ext = sanitizeExtension(fileName);
  const uuid = crypto.randomUUID();
  const name = `${uuid}.${ext}`;
  if (mode === "temp") {
    return `temp/${productId}/${name}`;
  }
  return `${productId}/${name}`;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const keyBuf: ArrayBuffer =
    key instanceof ArrayBuffer
      ? key
      : (key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
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

async function getPresignedPutUrl(storageKey: string, contentType: string, env: Env): Promise<string> {
  const endpoint = `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path = `/${env.CLOUDFLARE_R2_BUCKET}/${storageKey}`;
  const url = new URL(path, endpoint);

  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const region = "auto";
  const service = "s3";

  const signedHeaders = "content-type;host";
  const canonicalHeaders = `content-type:${contentType}\nhost:${url.host}\n`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${env.CLOUDFLARE_R2_ACCESS_KEY_ID}/${credentialScope}`;

  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
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

  const kSecret = new TextEncoder().encode(`AWS4${env.CLOUDFLARE_R2_SECRET_ACCESS_KEY}`);
  const kDate = await hmacSha256(kSecret, dateStamp);
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

  return url.toString();
}

/** Copy temp/* → productId/* (GET + PUT + DELETE), same semantics as admin temp-upload-helpers. */
async function finalizeTempKeys(
  env: Env,
  productId: string,
  tempKeys: string[]
): Promise<Record<string, string>> {
  const keyMap: Record<string, string> = {};
  for (const tempKey of tempKeys) {
    if (!tempKey || typeof tempKey !== "string") continue;
    if (!tempKey.startsWith("temp/")) {
      keyMap[tempKey] = tempKey;
      continue;
    }
    const fileName = tempKey.split("/").pop() || "unknown.jpg";
    const finalKey = `${productId}/${fileName}`;
    const getRes = await r2Request(env, "GET", tempKey);
    if (!getRes.ok) {
      console.warn("finalize-temp: missing", tempKey, getRes.status);
      keyMap[tempKey] = tempKey;
      continue;
    }
    const contentType = getRes.headers.get("content-type") || "image/jpeg";
    const buf = await getRes.arrayBuffer();
    const putRes = await r2Request(env, "PUT", finalKey, buf, { "Content-Type": contentType });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => "");
      throw new Error(`R2 put failed ${finalKey}: ${putRes.status} ${text}`);
    }
    const delRes = await r2Request(env, "DELETE", tempKey);
    if (!delRes.ok && delRes.status !== 404) {
      console.warn("finalize-temp: delete temp failed", tempKey, delRes.status);
    }
    keyMap[tempKey] = finalKey;
  }
  return keyMap;
}

async function deleteObjectKeys(env: Env, keys: string[]): Promise<number> {
  let deleted = 0;
  for (const key of keys) {
    if (!key || typeof key !== "string") continue;
    const r = await r2Request(env, "DELETE", key);
    if (r.ok || r.status === 404) deleted++;
  }
  return deleted;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(request, env);
    const pathname = new URL(request.url).pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Not Found" }, 404, cors);
    }

    const auth = request.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return jsonResponse({ error: "Missing or invalid Authorization" }, 401, cors);
    }

    const admin = await verifyAdminToken(token, env);
    if (!admin.ok) {
      if (admin.reason === "missing_auth_env") {
        return jsonResponse(
          {
            error: "Worker misconfigured",
            code: "missing_auth_env",
            hint:
              "Set Worker secret SUPABASE_URL to your Supabase project URL (https://xxxx.supabase.co) for ECC/ES256 JWTs, and/or SUPABASE_JWT_SECRET for Legacy HS256. See apps/upload-signer/docs/SUPABASE_JWT_SIGNING_KEYS.md",
          },
          500,
          cors
        );
      }
      if (admin.reason === "invalid_token") {
        const d = admin.diag;
        const hasUrl = Boolean(env.SUPABASE_URL?.trim());
        const hasSecret = Boolean(env.SUPABASE_JWT_SECRET?.trim());
        const jwksOk = d?.jwks_status === 200;
        const alg = d?.alg;
        const isAsymmetric = alg === "ES256" || alg === "RS256" || (Boolean(alg) && alg !== "HS256");

        /** Suggested base URL from token iss (no path) — user should set Worker SUPABASE_URL to this. */
        let suggestedSupabaseOrigin: string | undefined;
        if (d?.iss) {
          try {
            suggestedSupabaseOrigin = new URL(d.iss).origin;
          } catch {
            /* ignore */
          }
        }

        const lines: string[] = [];

        if (isAsymmetric && !hasUrl) {
          lines.push(
            `Your access token uses ${alg ?? "asymmetric"} (not HS256). SUPABASE_JWT_SECRET cannot verify it — you must add Worker secret SUPABASE_URL.`
          );
          lines.push(
            `Set SUPABASE_URL to your project base URL (same as admin NEXT_PUBLIC_SUPABASE_URL), e.g. ${suggestedSupabaseOrigin ?? "https://YOUR_PROJECT_REF.supabase.co"} — no trailing slash.`
          );
          lines.push(
            "GitHub: add secret UPLOAD_SIGNER_SUPABASE_URL, or Cloudflare: Workers → upload-signer → Variables → add secret SUPABASE_URL. Then redeploy upload-signer."
          );
        } else {
          lines.push("JWT did not verify.");
          lines.push(
            "• Set Worker secret SUPABASE_URL to your project API URL (same as NEXT_PUBLIC_SUPABASE_URL). Redeploy after saving."
          );
          lines.push("• Legacy HS256 only: set SUPABASE_JWT_SECRET (Supabase → Settings → API).");
          if (alg === "HS256" && !hasSecret) {
            lines.push(
              "• Your token is HS256: ensure SUPABASE_JWT_SECRET matches Supabase JWT Secret, or sign in again after switching to ES256."
            );
          }
          if (isAsymmetric && hasUrl && !jwksOk && d?.jwks_status !== undefined) {
            lines.push(
              `• JWKS fetch returned HTTP ${d.jwks_status}. Check SUPABASE_URL matches https://<project-ref>.supabase.co`
            );
          }
          if (isAsymmetric && hasUrl && jwksOk) {
            lines.push(
              `• Token iss=${d?.iss ?? "?"}. If verification still fails, confirm SUPABASE_URL origin matches this iss host.`
            );
          }
        }

        return jsonResponse(
          {
            error: "Unauthorized",
            code: "invalid_token",
            hint: lines.join(" "),
            fix:
              isAsymmetric && !hasUrl
                ? "add_worker_secret_SUPABASE_URL"
                : undefined,
            suggested_supabase_url: suggestedSupabaseOrigin,
            debug: {
              token_alg: alg,
              token_iss: d?.iss,
              jwks_http_status: d?.jwks_status,
              worker_has_supabase_url: hasUrl,
              worker_has_jwt_secret: hasSecret,
            },
          },
          401,
          cors
        );
      }
      return jsonResponse(
        {
          error: "Forbidden",
          code: "not_admin",
          hint:
            "JWT is valid but app_metadata.role is not admin. In Supabase set raw_app_meta_data role to admin for this user, then sign out and sign in again to refresh the token.",
        },
        403,
        cors
      );
    }

    try {
      if (pathname === "/sign-upload") {
        let body: SignUploadBody;
        try {
          body = (await request.json()) as SignUploadBody;
        } catch {
          return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
        }

        const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
        const contentType =
          typeof body.contentType === "string" ? body.contentType.trim() : "application/octet-stream";
        const productId = typeof body.productId === "string" ? body.productId.trim() : "";
        const mode = body.mode === "temp" || body.mode === "final" ? body.mode : "final";

        if (!fileName || fileName.length > 255) {
          return jsonResponse({ error: "Invalid or missing fileName" }, 400, cors);
        }
        if (!productId || !SAFE_PRODUCT_ID.test(productId)) {
          return jsonResponse({ error: "Invalid or missing productId" }, 400, cors);
        }

        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "video/mp4",
        ];
        const ct = allowedTypes.includes(contentType) ? contentType : "application/octet-stream";

        const storageKey = buildStorageKey(productId, mode, fileName);

        try {
          const putUrl = await getPresignedPutUrl(storageKey, ct, env);
          return jsonResponse({ putUrl, storageKey }, 200, cors);
        } catch (e) {
          console.error("Presign error:", e);
          return jsonResponse(
            { error: e instanceof Error ? e.message : "Failed to sign upload" },
            500,
            cors
          );
        }
      }

      if (pathname === "/finalize-temp") {
        const body = (await request.json()) as { productId?: string; tempKeys?: string[] };
        const productId = typeof body.productId === "string" ? body.productId.trim() : "";
        const tempKeys = Array.isArray(body.tempKeys) ? body.tempKeys : [];
        if (!productId || !SAFE_PRODUCT_ID.test(productId)) {
          return jsonResponse({ error: "Invalid or missing productId" }, 400, cors);
        }
        if (tempKeys.length > MAX_KEYS_FINALIZE) {
          return jsonResponse({ error: `Too many keys (max ${MAX_KEYS_FINALIZE})` }, 400, cors);
        }
        const keyMap = await finalizeTempKeys(env, productId, tempKeys);
        return jsonResponse({ keyMap }, 200, cors);
      }

      if (pathname === "/delete-objects") {
        const body = (await request.json()) as { keys?: string[] };
        const keys = Array.isArray(body.keys) ? body.keys : [];
        if (keys.length > MAX_KEYS_DELETE) {
          return jsonResponse({ error: `Too many keys (max ${MAX_KEYS_DELETE})` }, 400, cors);
        }
        const deleted = await deleteObjectKeys(env, keys);
        return jsonResponse({ deleted }, 200, cors);
      }
    } catch (e) {
      console.error("Worker error:", e);
      return jsonResponse(
        { error: e instanceof Error ? e.message : "Request failed" },
        500,
        cors
      );
    }

    return jsonResponse({ error: "Not Found" }, 404, cors);
  },
};
