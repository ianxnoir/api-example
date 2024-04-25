import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as AWSXRay from 'aws-xray-sdk';
import compression from 'compression';
import session from 'express-session';
import helmet from 'helmet';
import fs from 'fs';
import axios from 'axios';
import { v4 } from 'uuid';
import { AppModule } from './app.module';
import { XRayInterceptor } from './core/interceptors/xray-logging-interceptor';
import { VepValidationPipe } from './core/validation-pipe/vep-validation.pipe';
import cookieParser from 'cookie-parser';

const XRayExpress = AWSXRay.express;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  AWSXRay.setDaemonAddress(configService.get('xray.DAEMON_ENDPOINT') || '127.0.0.1:2000');

  app.useGlobalPipes(
    new VepValidationPipe({
      disableErrorMessages: false,
      transform: true, // transform object to DTO class
    })
  );

  app.enable('trust proxy');

  const options = new DocumentBuilder()
    .setTitle('VEP Fair Service API')
    .setDescription('VEP Fair Service API')
    .setVersion('1.0')
    .addTag('vep-fair')
    .addServer(configService.get<any>('endpoint.esd-aws-develop'), 'esd-aws-develop')
    .addServer('', 'clouddev')
    .addServer('', 'sit')
    .addServer('', 'uat')
    .addServer('', 'prd')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  const outputPath = './docs/swagger.json';
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 4), { encoding: 'utf8' });

  //#region Express Middleware
  app.use(compression());
  app.use(cookieParser());
  app.use(
    session({
      secret: configService.get<any>('app.sessionSecret'),
      resave: false,
      saveUninitialized: true,
      cookie: { secure: 'auto' },
    })
  );
  app.use(helmet());
  //#endregion

  app.use(XRayExpress.openSegment('VEP-FAIR'));
  AWSXRay.captureHTTPsGlobal(require('https'));
  AWSXRay.captureHTTPsGlobal(require('http'));
  AWSXRay.captureMySQL(require('mysql'));
  app.useGlobalInterceptors(new XRayInterceptor());

  app.use(AWSXRay.express.closeSegment());

  axios.interceptors.request.use((req) => {
    const x_request_id = v4();
    req.headers.common['x-request-id'] = x_request_id;
    return req;
  });

  await app.listen(configService.get<any>('app.appPort'));
}

// eslint-disable-next-line no-console
bootstrap()
  .then(() => console.log('Bootstrap', new Date().toLocaleString()))
  .catch(console.error);
