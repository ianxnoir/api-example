import { VepErrorMsg } from "../../config/exception-constant";
import { VepError } from "../exception/exception";

var jwt = require('jsonwebtoken');

export class JwtUtil {
    public static retrieveAdminUserInfo(adminJwtToken: string, algorithms: 'HS256'| 'RS256', jwtVerifyKey: string): AdminUserDto {
        try {
            var jwtPayload = jwt.verify(adminJwtToken, jwtVerifyKey,
                {
                    algorithms: [algorithms],
                }
            );

            let branchOfficeUser = 0
            if (jwtPayload["branchOfficeUser"]?.data?.length) {
                branchOfficeUser = parseInt(jwtPayload["branchOfficeUser"].data[0])
            } else {
                branchOfficeUser = jwtPayload["branchOfficeUser"] == 1 ? 1 : 0
            }

            return {
                name: jwtPayload["name"],
                emailAddress: jwtPayload["emailAddress"],
                permission: jwtPayload["permission"],
                branchOffice: jwtPayload["branchOffice"],
                branchOfficeUser,
                fairAccessList: jwtPayload["fairAccessList"],
            }
        } catch (ex: any) {
            throw new VepError(VepErrorMsg.Admin_Invalid_Jwt, ex.message)
        }
    }
}

export class AdminUserDto {
    name!: string;
    emailAddress!: string;
    permission!: number[];
    branchOffice!: string;
    branchOfficeUser!: number;
    fairAccessList!: string;
}