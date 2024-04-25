import { Global, Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { Logger, S3Service } from '.';
import { configuration } from '../../config';

@Global()
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  providers: [Logger, S3Service, ConfigService],
  exports: [Logger, S3Service, ConfigService],
})
export class UtilsModule {}
