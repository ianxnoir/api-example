import { Module, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '../../../config';

import { SBEService } from './sbe.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  providers: [SBEService],
  exports: [SBEService],
})
export class SBEModule {}
