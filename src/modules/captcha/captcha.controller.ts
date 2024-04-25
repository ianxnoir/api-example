import { Body, Controller, Header, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { Logger } from '../../core/utils';
import { CaptchaService } from './captcha.service';
import { CaptchaDto, CaptchaSuccessfulResponseDto } from './dto/captcha.dto';

@ApiTags('Captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private logger: Logger, private captchaService: CaptchaService) {
    this.logger.setContext(CaptchaController.name)
  }

  @Post('captcha-verify')
  @UseInterceptors(ResponseInterceptor)
  @Header('content-type', 'application/json')
  @ApiOperation({ summary: 'Validating the incoming request with captcha' })
  @ApiResponse({
    status: 200,
    description: "Successful Response: Ticket is valid",
    type: CaptchaSuccessfulResponseDto,
    schema: { example: CaptchaSuccessfulResponseDto},

  })
  public async validateCaptcha (@Body() captchaDto: CaptchaDto) {
    this.logger.log('validate Captcha' + JSON.stringify(captchaDto));
    return await this.captchaService.validateCaptcha(captchaDto)
  }
}
