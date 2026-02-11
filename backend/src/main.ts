import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Cookie parser for HTTP-only cookies
  app.use(cookieParser());
  
  // Global exception filter for better error logging
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global interceptor for BigInt serialization
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Global prefix
  const globalPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  
  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('CMS Platform API')
    .setDescription('Multi-tenant Headless CMS Platform API Documentation')
    .setVersion('1.0')
    .addTag('tenants', 'Tenant management operations')
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Tenant-ID',
        in: 'header',
        description: 'Tenant ID for multi-tenant requests',
      },
      'tenant-id',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Tenant-Slug',
        in: 'header',
        description: 'Tenant slug for multi-tenant requests',
      },
      'tenant-slug',
    )
    .addServer(`http://localhost:${process.env.PORT || 3001}`, 'Local development')
    .addServer('https://api.example.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
  });
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      tryItOutEnabled: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend API is running on: http://localhost:${port}/${globalPrefix}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
