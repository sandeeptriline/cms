import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantPrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    // Connection will be established when switching to tenant database
  }

  /**
   * Get Prisma client for a specific tenant database
   */
  getTenantClient(dbName: string): PrismaClient {
    // Get base database URL
    const baseUrl = this.configService.get<string>('DATABASE_URL');
    if (!baseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    // Replace database name in connection string
    const tenantUrl = baseUrl.replace(/\/[^\/]+$/, `/${dbName}`);

    // Create new Prisma client for tenant database
    return new PrismaClient({
      datasources: {
        db: {
          url: tenantUrl,
        },
      },
    });
  }

  /**
   * Execute query in tenant database context
   */
  async withTenant<T>(dbName: string, callback: (client: PrismaClient) => Promise<T>): Promise<T> {
    const client = this.getTenantClient(dbName);
    try {
      return await callback(client);
    } finally {
      await client.$disconnect();
    }
  }
}
