import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import type { StorageProvider, HeadResult, DownloadResult, DownloadRangeOpts } from "./types";

const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR ?? "./storage";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
};

function getBaseDir(): string {
  const dir = process.env.LOCAL_STORAGE_DIR ?? LOCAL_STORAGE_DIR;
  if (!dir) throw new Error("LOCAL_STORAGE_DIR is required for local storage");
  return path.resolve(dir);
}

function resolveKey(key: string): string {
  if (key.includes("..")) throw new Error("Invalid key");
  return path.join(getBaseDir(), key);
}

function mimeFromKey(key: string): string | undefined {
  const ext = path.extname(key).slice(1).toLowerCase();
  return MIME[ext];
}

export const localProvider: StorageProvider = {
  async head(key: string): Promise<HeadResult> {
    const filePath = resolveKey(key);
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) return { exists: false };
      return {
        exists: true,
        size: stat.size,
        contentType: mimeFromKey(key),
        lastModified: stat.mtime.toUTCString(),
      };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return { exists: false };
      throw e;
    }
  },

  async download(key: string): Promise<DownloadResult> {
    const filePath = resolveKey(key);
    const stat = await fs.stat(filePath).catch((e) => {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") throw new Error("Not found");
      throw e;
    });
    if (!stat.isFile()) throw new Error("Not found");
    const stream = createReadStream(filePath);
    return {
      stream,
      size: stat.size,
      contentType: mimeFromKey(key),
    };
  },

  downloadRange(key: string, range: DownloadRangeOpts): Promise<DownloadResult> {
    const filePath = resolveKey(key);
    const stream = createReadStream(filePath, { start: range.start, end: range.end });
    const length = range.end - range.start + 1;
    return Promise.resolve({
      stream,
      size: length,
      contentType: mimeFromKey(key),
    });
  },

  async upload(
    key: string,
    body: Blob | Buffer | ReadableStream<Uint8Array> | NodeJS.ReadableStream,
    _opts?: { contentType?: string }
  ): Promise<void> {
    const filePath = resolveKey(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const buf =
      body instanceof Buffer
        ? body
        : body instanceof Blob
          ? Buffer.from(await body.arrayBuffer())
          : await streamToBuffer(body as ReadableStream<Uint8Array> | NodeJS.ReadableStream);
    await fs.writeFile(filePath, buf);
  },

  async delete(key: string): Promise<void> {
    const filePath = resolveKey(key);
    await fs.unlink(filePath).catch((e) => {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    });
  },

  async exists(key: string): Promise<boolean> {
    const h = await this.head(key);
    return h.exists;
  },

  async list(prefix: string): Promise<string[]> {
    const dirPath = resolveKey(prefix);
    const files: string[] = [];

    async function walk(dir: string, relativeBase: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(relativeBase, entry.name);
          
          if (entry.isDirectory()) {
            await walk(fullPath, relativePath);
          } else if (entry.isFile()) {
            files.push(relativePath);
          }
        }
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
        throw e;
      }
    }

    await walk(dirPath, prefix);
    return files;
  },
};

async function streamToBuffer(
  stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream
): Promise<Buffer> {
  if (typeof (stream as ReadableStream).getReader === "function") {
    const r = (stream as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await r.read();
      if (done) break;
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
