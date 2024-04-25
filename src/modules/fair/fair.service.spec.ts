import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '../../config';
import { FairService } from './fair.service';
import { FairDbService } from '../fairDb/fairDb.service';
import { ContentService } from '../api/content/content.service';
import { C2MService } from '../api/c2m/content.service';
import { Logger } from '../../core/utils';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FairPeriod } from '../../dao/FairPeriod';
import { FairRegistration } from '../../dao/FairRegistration';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { FairParticipant } from '../../dao/FairParticipant';
import { FairRegistrationPregeneration } from '../../dao/FairRegistrationPregeneration';
import { Registration } from '../../entities/registration.entity';
import { ContentCacheService } from '../api/content/content-cache.service';
import { ElasticacheClusterModule } from '../../core/elasticachecluster/elasticachecluster.providers';
import { ESService } from '../esHelper/esService';
let app: TestingModule;
let fairService: FairService;

const fakeFairs = [
  {
    fair_code: 'hkjewellery',
    fair_short_name: { en: 'Jewellery', tc: '珠寶展', sc: '珠宝展' },
    vms_project_year: '2021',
    vms_project_no: '007',
    fiscal_year: '2122',
    fair_type: 'physical',
    eoa_fair_id: '1951',
    online_event_start_datetime: '2021-09-28 10:00',
    online_event_end_datetime: '2022-12-31 16:00',
    wins_event_start_datetime: '2021-09-28 10:00',
    wins_event_end_datetime: '2022-12-31 15:00',
    c2m_start_datetime: '2021-12-13 00:00',
    c2m_end_datetime: '2024-12-14 02:00',
    hybrid_fair_start_datetime: '2021-09-28 10:00',
    hybrid_fair_end_datetime: '2022-12-31 16:00'
  },
  {
    fair_code: 'hkdgp',
    fair_short_name: { en: 'Diamond Fair', sc: '', tc: '' },
    vms_project_year: '2022',
    vms_project_no: '008',
    fiscal_year: '2122',
    fair_type: 'hybrid',
    eoa_fair_id: '1949',
    online_event_start_datetime: undefined,
    online_event_end_datetime: undefined,
    wins_event_start_datetime: '2021-11-01 00:00',
    wins_event_end_datetime: '2023-11-01 00:00',
    c2m_start_datetime: '2021-12-13 00:00',
    c2m_end_datetime: '2024-12-14 02:00',
    hybrid_fair_start_datetime: '2022-01-03 00:00',
    hybrid_fair_end_datetime: '2022-01-07 00:00'
  }
]

describe('Unit tests for fair service', () => {
  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        CacheModule.register(),
        ElasticacheClusterModule
      ],
      providers: [
        FairService,
        FairDbService,
        ContentService,
        ContentCacheService,
        C2MService,
        Logger,
        ESService,
        {
          provide: getRepositoryToken(FairRegistration),
          useClass: FairRegistrationFake,
        },
        {
          provide: getRepositoryToken(FairPeriod),
          useClass: FairPeriodFake,
        },
        {
          provide: getRepositoryToken(FairRegistrationStatus),
          useClass: FairRegistrationStatusFake,
        },
        {
          provide: getRepositoryToken(FairRegistrationPregeneration),
          useClass: FairRegistrationStatusFake,
        },
        {
          provide: getRepositoryToken(FairParticipant),
          useClass: FairParticipantFake,
        },
        {
          provide: getRepositoryToken(FairRegistrationPregeneration),
          useClass: FairRegistrationPregenerationFake,
        },
        {
          provide: getRepositoryToken(Registration),
          useClass: RegistrationFake,
        }
      ],
    }).compile();

    fairService = await app.resolve<FairService>(FairService);

    jest.useFakeTimers('modern');
  
    fairService.getOpenFairs = jest.fn().mockImplementation(async () => {
      return fakeFairs
    });

    fairService.getCombinedFairByFairDict = jest.fn().mockImplementation(async () => {
      return {
        hkjewellery: [ 'hkjewellery', 'hkdgp'],
        hkdgp: [ 'hkjewellery', 'hkdgp']
      }
    });
  });

  afterAll(async () => {
    await app.close();
    jest.useRealTimers();
  });

  test('getActiveFairs : Current date is not within hybrid fair period - should return empty array', async () => {
    jest.setSystemTime(new Date(2021, 8, 25)); // 2021-9-25

    const res = await fairService.getActiveFairs();
    expect(res.length).toEqual(0);
  });

  test('getActiveFairs : Current date is within hybrid fair period - should return hkjewellery and hkdgp', async () => {
    jest.setSystemTime(new Date(2022, 0, 5)); // 2022-1-25

    const res = await fairService.getActiveFairs();
    expect(res).toEqual(fakeFairs);
  });

  test('getBeforeFairs : Current date is before hybrid fair period - should return hkjewellery and hkdgp', async () => {
    jest.setSystemTime(new Date(2021, 8, 25)); // 2021-9-25

    const res = await fairService.getBeforeFairs();
    expect(res).toEqual(fakeFairs);
  });

  test('getBeforeFairs : Current date is after hybrid fair period - should return empty array', async () => {
    jest.setSystemTime(new Date(2023, 8, 25)); // 2023-9-25

    const res = await fairService.getBeforeFairs();
    expect(res.length).toEqual(0);
  });

  test('getBeforeFairs : Current date is before hkjewellery\'s hybrid end date before after hkdgp\'s hybrid end date - should return hkjewellery and hkdgp', async () => {
    jest.setSystemTime(new Date(2022, 4, 25)); // 2022-5-25

    const res = await fairService.getBeforeFairs();
    expect(res).toEqual(fakeFairs);
  });
});

export class FairRegistrationFake {
  public async save(): Promise<void> {}
  public async findOne(): Promise<void> {}
  public async find(): Promise<void> {}
  public async findAndCount(): Promise<any> {
    return [
      [{
        fairParticipant: {
          ssoUid: 'ssoUid'
        }
      }]
    ]
  }
}

export class FairPeriodFake {
  public async save(): Promise<void> {}
  public async findOne(): Promise<void> {}
  public async find(): Promise<void> {}
}

export class FairRegistrationStatusFake {
  public async save(): Promise<void> {}
  public async findOne(): Promise<void> {}
  public async find(): Promise<void> {}
}

export class FairParticipantFake {
  public async save(): Promise<void> {}
  public async findOne(): Promise<void> {}
  public async find(): Promise<void> {}
}
export class FairRegistrationPregenerationFake {
  public async save(): Promise<void> {}
  public async findOne(): Promise<void> {}
  public async find(): Promise<void> {}
}

export class RegistrationFake {
  public async save(): Promise<void> { }
  public async findOne(): Promise<void> { }
  public async find(): Promise<void> { }
}