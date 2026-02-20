import * as fs from 'fs/promises';
import * as path from 'path';
import { IMediaStorage } from './storage.interface';

/**
 * Local filesystem storage. Files stored under basePath/tenantId/projectId/...
 */
export class LocalStorage implements IMediaStorage {
  constructor(
    private readonly basePath: string,
    private readonly tenantId: string,
    private readonly projectId: string,
    private readonly baseUrl?: string,
  ) {}

  private resolveKey(storageKey: string): string {
    const safeKey = storageKey.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.basePath, this.tenantId, this.projectId, safeKey);
  }

  async upload(key: string, buffer: Buffer, _mimeType?: string): Promise<void> {
    const fullPath = this.resolveKey(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolveKey(key);
    try {
      await fs.unlink(fullPath);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code !== 'ENOENT') throw err;
    }
  }

  async getUrl(key: string): Promise<string> {
    const normalized = key.replace(/\\/g, '/');
    if (this.baseUrl) {
      const base = this.baseUrl.replace(/\/$/, '');
      return `${base}/media/file/${this.tenantId}/${this.projectId}/${normalized}`;
    }
    return `/media/file/${this.tenantId}/${this.projectId}/${normalized}`;
  }
}
