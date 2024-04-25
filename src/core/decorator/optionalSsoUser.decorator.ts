import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SSOUserHeadersDto } from './ssoUser.decorator';

export const OptionalSSOUserDecorator = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): SSOUserHeadersDto | null => {
        const request = ctx.switchToHttp().getRequest();

        if (!request.headers['x-access-token']
            || !request.headers['x-sso-uid']
            || !request.headers['x-email-id']
            || !request.headers['x-sso-firstname']
            || !request.headers['x-sso-lastname']) {
            return null
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