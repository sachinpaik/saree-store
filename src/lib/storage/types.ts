export interface HeadResult {
  exists: boolean;
  size?: number;
  contentType?: string;
  etag?: string;
  lastModified?: string;
  cacheControl?: string;
}

export interface DownloadResult {
  stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream;
  size?: number;
  contentType?: string;
  etag?: string;
}

export interface DownloadRangeOpts {
  start: number;
  end: number;
}

export interface StorageProvider {
  upload(key: string, body: Blob | Buffer | ReadableStream<Uint8Array> | NodeJS.ReadableStream, opts?: { contentType?: string }): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  head(key: string): Promise<HeadResult>;
  download(key: string, opts?: Record<string, unknown>): Promise<DownloadResult>;
  downloadRange?(key: string, range: DownloadRangeOpts): Promise<DownloadResult>;
  list?(prefix: string): Promise<string[]>;
}
