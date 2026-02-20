import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { TenantId } from '../tenants/decorators/tenant.decorator';
import { MediaService, MediaAssetRow } from './media.service';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

@Controller('projects/:projectId/media')
@UseGuards(TenantGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async list(
    @TenantId() tenantId: string,
    @Param('projectId') projectId: string,
  ): Promise<MediaAssetRow[]> {
    return this.mediaService.list(tenantId, projectId);
  }

  @Get('serve/:assetId')
  async serve(
    @TenantId() tenantId: string,
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const { stream, mimeType, filename } =
      await this.mediaService.getLocalStream(tenantId, projectId, assetId);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${filename.replace(/"/g, '\\"')}"`,
    });
    stream.pipe(res);
  }

  @Get(':assetId')
  async getOne(
    @TenantId() tenantId: string,
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ): Promise<MediaAssetRow & { url: string }> {
    return this.mediaService.getOne(tenantId, projectId, assetId);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async upload(
    @TenantId() tenantId: string,
    @Param('projectId') projectId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
        fileIsRequired: true,
      }),
    )
    file: { buffer: Buffer; originalname: string; mimetype?: string; size?: number },
  ): Promise<MediaAssetRow> {
    return this.mediaService.upload(tenantId, projectId, file);
  }

  @Delete(':assetId')
  async delete(
    @TenantId() tenantId: string,
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ): Promise<{ success: boolean }> {
    await this.mediaService.delete(tenantId, projectId, assetId);
    return { success: true };
  }
}
