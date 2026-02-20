import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IMediaStorage, MediaStorageConfig } from './storage.interface';

export class S3Storage implements IMediaStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: MediaStorageConfig & { type: 's3' }) {
    if (!config.bucket) {
      throw new Error('S3 storage requires bucket in config');
    }
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: config.endpoint || undefined,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
      forcePathStyle: !!config.endpoint,
    });
  }

  async upload(key: string, buffer: Buffer, mimeType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream',
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async getUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
