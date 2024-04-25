import { Module } from '@nestjs/common';
import { ESService } from './esService';

@Module({
  imports: [],
  providers: [ESService],
  exports: [ESService],
})
export class ESModule {}
