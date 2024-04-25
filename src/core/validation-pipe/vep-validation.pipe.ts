import { Injectable, ValidationError, ValidationPipe } from "@nestjs/common";
import { VepErrorMsg } from "../../config/exception-constant";
import { VepError } from "../exception/exception";

@Injectable()
export class VepValidationPipe extends ValidationPipe {
    createExceptionFactory() {
        return (validationErrors: ValidationError[] = []) => {
            if (this.isDetailedOutputDisabled) {
                return new VepError(VepErrorMsg.Validation_Error, "" )
            }
            const errors = this.flattenValidationErrors(validationErrors);
            return new VepError(VepErrorMsg.Validation_Error, errors )
        };
    }
}
