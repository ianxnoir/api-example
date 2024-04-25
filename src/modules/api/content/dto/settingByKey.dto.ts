import { VepErrorMsg } from "../../../../config/exception-constant"
import { VepError } from "../../../../core/exception/exception"

export class SettingByKey {
    fairCode: string
    key: string
    value: unknown | undefined
    constructor(fairCode: string, key: string, value: unknown) {
        this.fairCode = fairCode
        this.key = key
        this.value = value
    }

    returnNonNullValue(): unknown {
        if (!this.value) {
            throw new VepError(VepErrorMsg.ContentService_FairSettingKeyError, `key ${this.key} could not be found in fairSetting, fairCode: ${this.fairCode}`)
        }
        return this.value!
    }

    returnValue(): unknown | undefined {
        return this.value
    }
}

export class StringSettingByKey extends SettingByKey {
    value: string | undefined;

    returnNonNullValue(): string {
        if (!this.value) {
            throw new VepError(VepErrorMsg.ContentService_FairSettingKeyError, `key ${this.key} could not be found in fairSetting, fairCode: ${this.fairCode}`)
        }
        return this.value!
    }

    returnValue() {
        return this.value
    }
}

export class BooleanSettingByKey extends SettingByKey {
    value: number | undefined;

    returnNonNullValue(): boolean {
        if (this.value == undefined) {
            throw new VepError(VepErrorMsg.ContentService_FairSettingKeyError, `key ${this.key} could not be found in fairSetting, fairCode: ${this.fairCode}`)
        }
        return this.returnValue()
    }

    returnValue(): boolean {
        return (this.value === 1)
    }
}

export class ObjectSettingByKey<T> extends SettingByKey {
    value: T | undefined;

    returnNonNullValue(): T {
        if (!this.value) {
            throw new VepError(VepErrorMsg.ContentService_FairSettingKeyError, `key ${this.key} could not be found in fairSetting, fairCode: ${this.fairCode}`)
        }
        return this.value!
    }

    returnValue() {
        return this.value
    }
}