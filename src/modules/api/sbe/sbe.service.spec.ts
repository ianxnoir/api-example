import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SBEService } from './sbe.service';

describe('SbeService', () => {
  let service: SBEService;
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule],
      providers: [SBEService],
    }).compile();

    service = module.get<SBEService>(SBEService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
