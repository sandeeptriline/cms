import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { IMediaStorage, MediaStorageConfig } from './storage/storage.interface';
import { LocalStorage } from './storage/local.storage';
import { S3Storage } from './storage/s3.storage';
import { v4 as uuidv4 } from 'uuid';

export interface MediaAssetRow {
  id: string;
  project_id: string;
  filename: string;
  storage_key: string;
  mime_type: string | null;
  metadata: unknown;
  created_at: Date;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly defaultLocalPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly projectsService: ProjectsService,
  ) {
    this.defaultLocalPath =
      process.env.UPLOAD_PATH || process.env.MEDIA_UPLOAD_PATH || 'uploads';
  }

  async list(tenantId: string, projectId: string): Promise<MediaAssetRow[]> {
    await this.projectsService.findOne(tenantId, projectId);
    const tenant = await this.getTenant(tenantId);
    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const rows = await client.$queryRawUnsafe<
        Array<{
          id: string;
          project_id: string;
          filename: string;
          storage_key: string;
          mime_type: string | null;
          metadata: unknown;
          created_at: Date;
        }>
      >(
        `SELECT id, project_id, filename, storage_key, mime_type, metadata, created_at
         FROM media_assets WHERE project_id = ? ORDER BY created_at DESC`,
        projectId,
      );
      return rows;
    });
  }

  async getOne(
    tenantId: string,
    projectId: string,
    assetId: string,
  ): Promise<MediaAssetRow & { url: string }> {
    await this.projectsService.findOne(tenantId, projectId);
    const tenant = await this.getTenant(tenantId);
    const asset = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const rows = await client.$queryRawUnsafe<
        Array<{
          id: string;
          project_id: string;
          filename: string;
          storage_key: string;
          mime_type: string | null;
          metadata: unknown;
          created_at: Date;
        }>
      >(
        `SELECT id, project_id, filename, storage_key, mime_type, metadata, created_at
         FROM media_assets WHERE id = ? AND project_id = ?`,
        assetId,
        projectId,
      );
      return rows[0] ?? null;
    });
    if (!asset) {
      throw new NotFoundException(`Media asset ${assetId} not found`);
    }
    const storage = await this.getStorage(tenantId, projectId, tenant.db_name);
    const project = await this.projectsService.findOne(tenantId, projectId);
    const config = (project.config as Record<string, unknown>)?.mediaStorage as MediaStorageConfig | undefined;
    const type = config?.type ?? 'local';
    const baseUrl = (process.env.MEDIA_BASE_URL || process.env.API_URL || '').replace(/\/$/, '');
    const apiPrefix = process.env.API_PREFIX || 'api';
    const url =
      type === 'local'
        ? `${baseUrl}/${apiPrefix}/projects/${projectId}/media/serve/${assetId}`
        : await storage.getUrl(asset.storage_key);
    return { ...asset, url };
  }

  /** Stream a local file for the given asset (used by serve endpoint). */
  async getLocalStream(
    tenantId: string,
    projectId: string,
    assetId: string,
  ): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; filename: string }> {
    const tenant = await this.getTenant(tenantId);
    const asset = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const rows = await client.$queryRawUnsafe<
        Array<{ storage_key: string; mime_type: string | null; filename: string }>
      >(
        `SELECT storage_key, mime_type, filename FROM media_assets WHERE id = ? AND project_id = ?`,
        assetId,
        projectId,
      );
      return rows[0] ?? null;
    });
    if (!asset) {
      throw new NotFoundException(`Media asset ${assetId} not found`);
    }
    const storage = await this.getStorage(tenantId, projectId, tenant.db_name);
    const project = await this.projectsService.findOne(tenantId, projectId);
    const config = (project.config as Record<string, unknown>)?.mediaStorage as MediaStorageConfig | undefined;
    const type = config?.type ?? 'local';
    if (type !== 'local') {
      throw new BadRequestException('Serve endpoint is only for local storage');
    }
    const basePath = config?.basePath ?? this.defaultLocalPath;
    const fullPath = path.join(
      basePath,
      tenantId,
      projectId,
      asset.storage_key.replace(/\.\./g, '').replace(/^\/+/, ''),
    );
    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat || !stat.isFile()) {
      throw new NotFoundException('File not found');
    }
    const stream = createReadStream(fullPath);
    return {
      stream,
      mimeType: asset.mime_type || 'application/octet-stream',
      filename: asset.filename,
    };
  }

  async upload(
    tenantId: string,
    projectId: string,
    file: { buffer?: Buffer; originalname: string; mimetype?: string; size?: number },
  ): Promise<MediaAssetRow> {
    if (!file?.originalname) {
      throw new BadRequestException('File is required');
    }
    const buffer = file.buffer;
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new BadRequestException('File upload must use memory storage');
    }
    const filename = file.originalname || 'unnamed';
    const mimeType = file.mimetype || null;
    await this.projectsService.findOne(tenantId, projectId);
    const tenant = await this.getTenant(tenantId);
    const id = uuidv4();
    const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
    const storageKey = `${id}${ext}`;

    const storage = await this.getStorage(tenantId, projectId, tenant.db_name);
    await storage.upload(storageKey, buffer, mimeType || undefined);

    const metadata = file.size ? { size: file.size } : null;
    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await client.$executeRawUnsafe(
        `INSERT INTO media_assets (id, project_id, filename, storage_key, mime_type, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        projectId,
        filename,
        storageKey,
        mimeType,
        metadata ? JSON.stringify(metadata) : null,
      );
      const rows = await client.$queryRawUnsafe<
        Array<{
          id: string;
          project_id: string;
          filename: string;
          storage_key: string;
          mime_type: string | null;
          metadata: unknown;
          created_at: Date;
        }>
      >(
        `SELECT id, project_id, filename, storage_key, mime_type, metadata, created_at
         FROM media_assets WHERE id = ?`,
        id,
      );
      return rows[0];
    });
  }

  async delete(
    tenantId: string,
    projectId: string,
    assetId: string,
  ): Promise<void> {
    await this.projectsService.findOne(tenantId, projectId);
    const tenant = await this.getTenant(tenantId);
    const asset = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const rows = await client.$queryRawUnsafe<
        Array<{ id: string; storage_key: string }>
      >(`SELECT id, storage_key FROM media_assets WHERE id = ? AND project_id = ?`, assetId, projectId);
      return rows[0] ?? null;
    });
    if (!asset) {
      throw new NotFoundException(`Media asset ${assetId} not found`);
    }
    const storage = await this.getStorage(tenantId, projectId, tenant.db_name);
    await storage.delete(asset.storage_key);
    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await client.$executeRawUnsafe(
        `DELETE FROM media_assets WHERE id = ? AND project_id = ?`,
        assetId,
        projectId,
      );
    });
  }

  private async getTenant(tenantId: string): Promise<{ db_name: string }> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
      select: { db_name: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  private async getStorage(
    tenantId: string,
    projectId: string,
    dbName: string,
  ): Promise<IMediaStorage> {
    const project = await this.projectsService.findOne(tenantId, projectId);
    const config = (project.config as Record<string, unknown>)?.mediaStorage as MediaStorageConfig | undefined;
    const type = config?.type ?? 'local';
    const basePath = config?.basePath ?? this.defaultLocalPath;
    const baseUrl = process.env.MEDIA_BASE_URL || process.env.API_URL || '';

    if (type === 's3') {
      if (!config.bucket) {
        throw new BadRequestException('Project media storage is set to S3 but bucket is not configured. Configure it in Project Settings.');
      }
      return new S3Storage({ ...config, type: 's3' });
    }

    return new LocalStorage(basePath, tenantId, projectId, baseUrl || undefined);
  }
}
