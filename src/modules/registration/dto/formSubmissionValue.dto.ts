export class FormSubmissionValueDto {
    constructor(data : {[key:string]:string}) {
        this.fair_Code = data?.fair_Code
        this.fiscal_year = data?.fiscal_year
        this.form_id = data?.form_id
        this.file_upload_s3 = data?.file_upload_s3
    };
    fair_Code!: string
    fiscal_year!: string
    form_id!: string
    file_upload_s3!: string

    public convertToHash() : {[key:string]:string} {
        return {
            fair_Code : this.fair_Code,
            fiscal_year : this.fiscal_year,
            form_id : this.form_id,
            file_upload_s3 : this.file_upload_s3
        }
    }
}
