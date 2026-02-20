/**
 * Abstraction for media storage (local disk or S3-compatible).
 * Project config.mediaStorage determines which driver is used.
 */
export interface MediaStorageConfig {
  type: 'local' | 's3';
  /** Provider hint: stratus | gcs | azure | wasabi | r2 (for UI/docs) */
  provider?: string;
  /** S3: custom endpoint (e.g. R2, Wasabi) */
  endpoint?: string;
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** Local: base path (default from env UPLOAD_PATH or ./uploads) */
  basePath?: string;
}

export interface IMediaStorage {
  upload(key: string, buffer: Buffer, mimeType?: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Returns a URL to access the object (signed for S3, relative or absolute for local) */
  getUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
