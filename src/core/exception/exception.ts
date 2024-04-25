export class VepError extends Error {
    vepErrorMsg: VepErrorMsgObj;
    errorDetail: any;
    constructor(vepErrorMsg: VepErrorMsgObj, detail?: any) {
        super(vepErrorMsg.message);
        this.name = "VepError";
        this.vepErrorMsg = vepErrorMsg
        this.errorDetail = detail || ""
    }
}

export interface VepErrorObj {
    [key: string]: VepErrorMsgObj
}

export type VepErrorMsgObj = {
    code: string;
    message: string;
    status?: number;
}
