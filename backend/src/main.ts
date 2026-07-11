import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MulterExceptionFilter } from './common/filters/multer-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // FRONTEND_URL can be a comma-separated list — the ATS's own frontend,
  // plus cat-cons.com (or any other site embedding the public /jobs feed),
  // all need to call this API from the browser.
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strips unknown fields
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new MulterExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
