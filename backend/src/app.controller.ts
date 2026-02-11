import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'API root endpoint',
    description: 'Returns a simple message confirming the API is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is running',
    schema: {
      type: 'string',
      example: 'CMS Platform API is running!',
    },
  })
  getHello(): string {
    return 'CMS Platform API is running!';
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns the health status of the API service. Useful for monitoring and load balancers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
          description: 'Service status',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2026-02-11T10:00:00.000Z',
          description: 'Current server timestamp',
        },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
