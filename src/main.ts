import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown lifecycle hooks (OnModuleDestroy, beforeApplicationShutdown)
  app.enableShutdownHooks();

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global prefix for clean API versioning
  app.setGlobalPrefix('api/v1');

  // Global validation pipe with strict payload sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server listening on port ${port}`);
}

await bootstrap();
