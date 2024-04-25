import { Test, TestingModule } from '@nestjs/testing';
import { UtilsModule } from "../../core/utils/utils";
import { CaptchaService } from "./captcha.service";
import { CaptchaDto } from './dto/captcha.dto';
import { CaptchaVerifyRequestDto } from './dto/captchaVerifyRequest.dto';
import axios from "axios";
import { VepErrorMsg } from '../../config/exception-constant';

let app: TestingModule;
let captchaService: CaptchaService

beforeAll(async () => {
  jest.clearAllMocks()
  app = await Test.createTestingModule({
    imports: [
      UtilsModule
    ],
    providers: [
      CaptchaService,
    ]
  }).compile()
  captchaService = app.get(CaptchaService)
})


describe('Check captcha verification', () => {
  it('Should return the response showing success', async () => {
    let captchaDto = new CaptchaDto();
    let captchaVerifyRequestDto = new CaptchaVerifyRequestDto()
    captchaDto.providerId = 'recaptcha';
    captchaVerifyRequestDto.ip = '122.152.158.136';
    captchaVerifyRequestDto.ticket = '12345';
    captchaVerifyRequestDto.randstr = '12345';

    const mockedResponse = {
      data: {
        "success": true
      }
    }

    jest.spyOn(axios, "post").mockImplementationOnce(async () => mockedResponse)

    const result = await captchaService.validateCaptcha(captchaDto);

    expect(result).toEqual(mockedResponse.data)
  })

  it('Should return error when some fields are missing or invalid ', async () => {
    let captchaDto = new CaptchaDto();
    let captchaVerifyRequestDto = new CaptchaVerifyRequestDto()
    captchaDto.providerId = 'test';
    captchaVerifyRequestDto.ip = 'test';
    captchaVerifyRequestDto.ticket = 'test';
    captchaVerifyRequestDto.randstr = 'test';

    const mockedResponse = {
      data: {
        "status": "400",
        "response": {
          "data": {
            "status": '1',
            "message": 'Some fields are missing or invalid',
            "datetime": '01/01/2021 00:00:00',
          }
        }
      }
      
    }

    jest.spyOn(axios, "post").mockRejectedValueOnce(mockedResponse)

    try {
        await captchaService.validateCaptcha(captchaDto)
    }
    catch (error: any) {
      expect(error.message).toBe(VepErrorMsg.Captcha_Error.message)
    }
  });
})


afterAll(async () => {
  await app?.close();
});
