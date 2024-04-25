import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../exception/exception';

export const SSOUserDecorator = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): SSOUserHeadersDto => {
        const request = ctx.switchToHttp().getRequest();

        if (!request.headers['x-access-token']
            || !request.headers['x-sso-uid']
            || !request.headers['x-email-id']
            || !request.headers['x-sso-firstname']
            || !request.headers['x-sso-lastname']) {
            throw new VepError(VepErrorMsg.User_InvalidHeaders, 'Missing headers for jwt payload')
        }

        return {
            accessToken: request.headers['x-access-token'],
            ssoUid: request.headers['x-sso-uid'],
            emailId: request.headers['x-email-id'],
            firstName: request.headers['x-sso-firstname'],
            lastName: request.headers['x-sso-lastname'],
        }
    },
);

export class SSOUserHeadersDto {
    accessToken!: string;
    ssoUid!: string;
    emailId!: string;
    firstName!: string;
    lastName!: string;
}