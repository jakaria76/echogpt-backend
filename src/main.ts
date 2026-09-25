import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Middlewares
  app.use(helmet());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Routing Prefix
  app.setGlobalPrefix('api/v1');

  // Global Exception Filter for standardized API errors
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Validation Pipe for Request DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger (OpenAPI) Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('EchoGPT Backend REST API')
    .setDescription(
      'Production-ready backend API for EchoGPT Chrome Extension supporting Multi-AI provider orchestration, web search, subscriptions, and administrative telemetry.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on: http://localhost:${port}/api/v1`);
  console.log(`📑 Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();