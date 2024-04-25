export class NameHelper {
    public static GenerateInitial(firstName: string | null | undefined, lastName: string | null | undefined): string {
        if (!lastName) {
            if (!firstName) {
                return ''
            } else {
                return firstName.charAt(0).toLocaleUpperCase()
            }
        }

        if (lastName!.charAt(0).match(/[a-z]/i)) {
            return (firstName ? firstName!.charAt(0).toLocaleUpperCase() : '') + lastName.charAt(0).toLocaleUpperCase()
        } else {
            return lastName.charAt(0).toLocaleUpperCase()
        }
    }

    public static GenerateDisplayName(firstName: string, lastName: string): string {
        if (NameHelper.testCJK(firstName) || NameHelper.testCJK(lastName)) {
            return lastName + firstName;
        } else {
            return (firstName + ' ' + lastName).trim();
        }
    }

    public static testCJK = (text:any) => {
        if (typeof(text) === 'string')
            return /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]$/.test(text);
        else 
            return false;
    } 
}
