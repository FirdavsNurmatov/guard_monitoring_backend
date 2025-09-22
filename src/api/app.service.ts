import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

export default class Application {
  public static async main(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.use(helmet());
    app.enableCors({
      origin: ['http://localhost:5173', 'http://localhost:5174'],
    });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    app.useStaticAssets(
      join(__dirname, '..', '..', '..', 'uploads', 'objects'),
      {
        prefix: '/uploads/objects',
        setHeaders: (res, path) => {
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        },
      },
    );

    app.setGlobalPrefix('api/v1');

    const port = process.env.PORT ?? 3000;
    await app.listen(port, () => {
      console.log(`Server: http://localhost:${port}/api/v1`);
    });
  }
}
