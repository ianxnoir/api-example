import { S3Service } from './s3.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VepErrorMsg } from '../../config/exception-constant';

let app: TestingModule;
let s3: S3Service

beforeAll(async () => {
    jest.clearAllMocks()
    app = await Test.createTestingModule({
        providers: [S3Service, ConfigService]
    }).compile();

    s3 = app.get(S3Service);
});

describe("Unit tests for S3Service Service", () => {

    test('if cannot found file for getFile', async () => {
        try{
            await s3.getFile('fakeRoute/settings.json', "fakeBucket")
        }
        catch(err){
            expect(err.message).toBe(VepErrorMsg.S3_File_Missing.message)
        }
        
    });

    afterAll(async () => {
        await app?.close();
    });
});