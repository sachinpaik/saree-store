/**
 * Retries fetch on network failures and transient HTTP errors.
 * Helps unstable paths (packet loss, regional routing) where the browser reports
 * ERR_TIMED_OUT, failed fetch, or occasional 502/503/504 from the edge.
 */

export type FetchRetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  /** Retry when response has one of these status codes (default: 502, 503, 504). */
  retryOnStatus?: number[];
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const maxAttempts = options.maxAttempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const retryOnStatus = options.retryOnStatus ?? [502, 503, 504];

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.ok) return res;
      if (retryOnStatus.includes(res.status) && attempt < maxAttempts) {
        lastError = new Error(`HTTP ${res.status}`);
        const backoff = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 250;
        await delay(backoff);
        continue;
      }
      return res;
    } catch (e) {
      lastError = e;
      if (attempt === maxAttempts) throw e;
      const backoff = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 250;
      await delay(backoff);
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error(String(lastError ?? "fetchWithRetry: unknown error"));
}
