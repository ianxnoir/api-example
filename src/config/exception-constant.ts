import { VepErrorObj } from "../core/exception/exception";

export const VepErrorMsg: VepErrorObj = {
    General_Error: { code: "E0700100001", message: "General Error", status: 400 },

    User_InvalidHeaders: { code: "E0700100002", message: "User Headers Invalid", status: 400 },
    User_InvalidPermission: { code: "E0700100003", message: "User Permission Invalid", status: 400 },
    //validation pipe
    Validation_Error: { code: "E0700100400", message: "Validation Error", status: 400 },
    //database error
    Database_Error: { code: "E0700100502", message: "Database Error", status: 403 },
    S3_File_Missing: { code: "E0300300404", message: "S3 File Missing Error", status: 400 },
    S3_Listing_Missing: { code: "E0300400404", message: "S3 Listing Missing", status: 400 },
    S3_File_Copy_Fail: { code: "E0300300405", message: "Fail to copy s3 file", status: 400 },

    // Captcha error
    Captcha_Error: { code: "E0700200001", message: "Captcha error", status: 400 },

    // ExhibitorService
    ExhibitorService_Error: { code: "E0700500001", message: "Fail to retrieve data from Exhibitor Service", status: 400 },
    ExhibitorService_FailToRetrieveSerialNo: { code: "E0700500002", message: "Fail to retrieve serial no", status: 400 },

    // BuyerImportService
    BuyerImport_Update_Status_Error: { code: "E0700600001", message: "Fail to update the status in Buyer Import API from Fair Service", status: 400 },
    Task_Id_Not_Found_Error: { code: "E0700600002", message: "Fail to find any record matched with the task Id from Fair Service", status: 400 },
    Registration_Task_List_Not_Found_Error: { code: "E0700600003", message: "Fail to find any registration task list from Fair Service", status: 400 },
    Create_Registration_Task_Error: { code: "E0700600004", message: "Fail to create registration task list from Fair Service", status: 400 },
    Check_Email_Exists_In_Sso_Url_Error: { code: "E0700600005", message: "Fail to check email exists in SSO URL", status: 400 },

    //ContentService
    ContentService_Error: { code: "E0700700001", message: "Fail to retrieve data from Content Service", status: 400 },
    ContentService_FailToRetrieveStructureTagData: { code: "E0700700002", message: "Fail to retrieve data from Structure Tag Data", status: 400 },
    ContentService_FailToRetrieveFormData: { code: "E0700700003", message: "Fail to retrieve form template", status: 400 },
    ContentService_FailToRetrieveFairSetting: { code: "E0700700004", message: "Could not Find this fair Code from Fair Setting", status: 400 },
    ContentService_FailToRetrieveRawJson: { code: "E0700700005", message: "Fail to retrieve data from Raw Json", status: 400 },
    ContentService_FairSettingKeyError: { code: "E0700700006", message: "Fail to retrieve setting from fair setting by key", status: 400 },
    ContentService_FailToRetrieveCouncilwiseData: { code: "E0700700007", message: "Fail to retrieve councilwise data", status: 400 },
    ContentService_FailToRetrieveFairSettingFromDatabase: { code: "E0700700011", message: "Fail to retrieve Fair Setting From Database", status: 400 },

    //Profile Service
    Profile_Nested_Object_Error: { code: "E0700800001", message: "Fail in converting nested object", status: 400 },
    Profile_Product_Interest_Error: { code: "E0700700002", message: "Fail in converting nested object", status: 400 },
    Profile_Data_Convert_Error: { code: "E0700700003", message: "Fail in converting nested object", status: 400 },
    Profile_NotFound_Error: { code: "E0700700003", message: "Profile Not found", status: 404 },
    Profile_Fairs_Invalid: { code: "E0700700004", message: "Fairs Invalid", status: 400 },
    Profile_C2M_Invalid_Input: { code: "E0700700005", message: "C2M Update Profile Invalid Input", status: 400 },
    Profile_FailToRetrieveFairSetting: { code: "E0700700006", message: "Could not find this fair Code from Fair Setting", status: 400 },
    Profile_Unable_To_Form_Template_Slug: { code: "E0700700007", message: "Could not find slug for profile edit", status: 400 },
    Profile_Invalid_Data: { code: "E0700700008", message: "Could not convert field", status: 400 },
    Profile_Admin_Could_Not_Update: { code: "E0700700008", message: "Admin could not update this profile", status: 400 },
    Profile_Update_Product_Interest: { code: "E0700700009", message: "Fail to update product interest", status: 400 },
    Profile_Invalid_Field_Id: { code: "E0700700010", message: "Invalid Field Id", status: 400 },

    //Form Validation
    Form_Validation_CanNotFindFormStepValidation: { code: "E0700800001", message: "Could not found form step validation by form step id", status: 400 },
    Form_Validation_VisitorTypeInvalid: { code: "E0700800002", message: "Visitor Type Invalid", status: 400 },

    //SqsService, LambdaService & SsmService
    Fail_To_Send_Message: { code: "E0700900001", message: "Failed to send message to message queue", status: 400 },
    Fail_To_Call_Lambda: { code: "E0700900002", message: "Failed to call lambda", status: 400 },
    Fail_To_Get_Key: { code: "E0700900003", message: "Failed to get key with ssm service", status: 400 },

    //Registration Service
    Registration_Not_Eligible: { code: "E0701000001", message: "User not eligible for the registration", status: 400 },
    Prepare_Fair_Setting_Details_Error: { code: "E0701000002", message: "Unable to prepare fair setting details", status: 400 },
    Form_Details_Not_Found_Error: { code: "E0701000003", message: "Unable to get form details", status: 400 },
    Registration_Details_Promise_Error: { code: "E0701000004", message: "Unable to fair setting details or get form details in promise", status: 400 },
    Fair_Setting_Not_Found_Error: { code: "E0701000005", message: "Unable to fair setting", status: 400 },
    Prepare_Registration_Result_Error: { code: "E0701000006", message: "Unable to prepare fair registration result", status: 400 },
    Check_Registration_Result_For_Sso_User: { code: "E0701000007", message: "Unable to check registration result for Sso User", status: 400 },
    Check_Registration_Eligibility_Error: { code: "E0701000008", message: "Unable to check Registration Eligibility and not able to return the result", status: 400 },
    Registration_Status_Error: { code: "E0701000009", message: "Unable to update registration status", status: 400 },
    Admin_Invalid_Jwt: { code: "E0701000010", message: "Invalid Jwt Token", status: 401 },
    Invalid_Operation: { code: "E0701000011", message: "The operation is not valid for this user.", status: 403 },
    Invalid_Participant_Type_Code: { code: "E0701000012", message: "Unable to match fair Participant Type in ORGANIC / VIP_CIP / VIP_MISSION / EXHIBITOR.", status: 403 },
    Check_Registration_Record_Error: { code: "E0701000013", message: "Unable to check Registration Record by user's SsouId or emailId", status: 403 },
    SubmitForm_Email_NotFound: { code: "E0701000014", message: "Email not found in SubmitForm form data", status: 403 },
    Get_Form_Type_From_Dummy_Error: { code: "E0701000015", message: "Failed in a promise to get fair site setting data and form type from dummy form template", status: 403 },
    Get_Form_Type_Error: { code: "E0701000016", message: "Failed in a promise to get fair site setting data and form type", status: 403 },
    Prepare_Registration_Eligibility_Response_Error: { code: "E0701000017", message: "Failed to prepare registration eligibility response", status: 403 },
    Registration_Missing_Form_Submission_Key: { code: "E0701000018", message: "Could not validate form submission key", status: 403 },
    Access_ElastiCache_Error: { code: "E0701000019", message: "Failed in an async call to get redis elastic cache", status: 403 },
    Processing_Key_Already_Exists_Error: { code: "E0701000020", message: "Processing key already exists, fair registration is in progress", status: 403 },
    Generate_Processing_Key_Error: { code: "E0701000021", message: "Unable to form processing key", status: 403 },
    Set_ElastiCache_Error: { code: "E0701000024", message: "Failed to set elasticache", status: 403 },
    Get_ElastiCache_Error: { code: "E0701000025", message: "Failed to get elasticache", status: 403 },
    Convert_Submission_Value_Error: { code: "E0701000026", message: "Unable to parse submission value to JSON format", status: 403 },
    Submission_Key_Not_Found: { code: "E0701000027", message: "Submission key not found in cache", status: 403 },
    Invalid_Submission_Value_Error: { code: "E0701000027", message: "Obtained invalid JSON value ", status: 403 },
    Invalid_Reg_Form_Link: { code: "E0701000028", message: "Failed to verify reg form link", status: 400 },
    Send_Sqs_Error: { code: "E0701000029", message: "Failed send message to sqs", status: 403 },
    Insert_Form_Submission_Record_Error: { code: "E0701000030", message: "Failed insert record to fair registration form submission table", status: 403 },
    Duplicated_Processing_Value_Error: { code: "E0701000031", message: "Duplicated processing key found in redis elastic cache", status: 403 },
    Invalid_Reg_Form_Link_Req: { code: "E0701000032", message: "Failed to process generate reg form link request", status: 400 },
    Insert_Reg_Form_Link_Error: { code: "E0701000033", message: "Failed to insert reg form link record to db", status: 400 },
    Unhandled_Business_Rule_Error: { code: "E0701000034", message: "Failed to handle business rule validate error", status: 400 },
    Query_Reg_Form_Link_Error: { code: "E0701000035", message: "Failed to process query reg form link request", status: 400 },
    RegFormLink_Task_List_Not_Found_Error: { code: "E0701000036", message: "Fail to find any reg form link task list from Fair Service", status: 400 },
    To_Fair_Code_Not_Combined_Fair: { code: "E0701000037", message: "To registration fair code not combined fair of fair code", status: 400 },
    Aor_Form_Missing_Fair_List: { code: "E0701000038", message: "AOR form template missing fair list", status: 400 },
    Fail_To_Get_From_Fair_Code: { code: "E0701000039", message: "Fail to get from fair code registration record", status: 400 },
    SubmitForm_Email_Invalid: { code: "E0701000040", message: "Email is not match between jwt payload and form submission data", status: 400 },
    Fail_To_Get_isHigherPriority_For_Not_Logined_Users: { code: "E0701000041", message: "Failed to get isHigherPriority For Not Logined Users", status: 400 },
    Fail_To_Get_EmailId: { code: "E0701000042", message: "Failed to get EmailId", status: 400 },

    // Buyer Import Task
    Buyer_Import_Missing_ActionType_Error: { code: "E0701100001", message: "Missing Action Type", status: 400 },
    Buyer_Import_Missing_FairCode_Error: { code: "E0701100002", message: "Missing Fair Code", status: 400 },
    Buyer_Import_Missing_ProjectYear_Error: { code: "E0701100003", message: "Missing Project Year", status: 400 },
    Buyer_Import_Missing_FiscalYear_Error: { code: "E0701100004", message: "Missing Fiscal Year", status: 400 },
    Buyer_Import_Missing_SourceType_Error: { code: "E0701100005", message: "Missing Source Type", status: 400 },
    Buyer_Import_Missing_VisitorType_Error: { code: "E0701100006", message: "Missing Visitor Type", status: 400 },
    Buyer_Import_Invalid_Visitor_Type: { code: "E0701100007", message: "Unable to map visitor type to participant type", status: 400 },
    Buyer_Import_Unknown_Create_Task_Error: { code: "E0701100999", message: "Unknown Create Task Error", status: 400 },

    BuyerService_Error: { code: "E0701200001", message: "Fail to retrieve data from Buyer Service", status: 403 },
    BuyerService_FailToRetrieveInternalProfile: { code: "E0701200002", message: "Fail to retrieve Profile Internal", status: 403 },
    BuyerService_FailToRetrieveSsoProfile: { code: "E0701200003", message: "Fail to retrieve Sso Profile", status: 403 },
    BuyerService_FailToUpdateNotiPref: { code: "E0701200004", message: "Fail to update notification preference", status: 403 },

    Notification_Error: { code: "E0701300001", message: "Error from notification service", status: 403 },
    Notification_FailToRetrieveSystemTemplate: { code: "E0701300002", message: "Fail to retrieve system template", status: 403 },

    EnquiryForm_MissingUserEmail: { code: "E0701400001", message: "Could not find email form submission", status: 403 },
    EnquiryForm_SystemTemplateCouldNotFound: { code: "E0701400002", message: "Could not system template", status: 403 },

    // Participant Import
    Participant_Import_Status_Error: { code: "E0702100001", message: "Fail to Import Participant from Participant Service", status: 400 },
    Participant_Import_Missing_Registration_Status_Error: { code: "E0702000001", message: "Missing Registration Status", status: 400 },
    Participant_Import_Missing_Registration_Number_Error: { code: "E0702000002", message: "Missing Registration Number", status: 400 },
    Participant_Import_Missing_Project_Number_Error: { code: "E0702000003", message: "Missing Project Number", status: 400 },
    Participant_Import_Missing_Project_Year_Error: { code: "E0702000004", message: "Missing Project Year", status: 400 },
    Participant_Import_Missing_SSO_UID_Error: { code: "E0702000005", message: "Missing SSO UID", status: 400 },
    Participant_Import_Missing_Display_Name_Error: { code: "E0702000006", message: "Missing Display Name", status: 400 },
    Participant_Import_Missing_Title_Error: { code: "E0702000007", message: "Missing Title", status: 400 },
    Participant_Import_Missing_Email_Error: { code: "E0702000008", message: "Missing Email", status: 400 },
    Participant_Import_Missing_First_Name_Error: { code: "E0702000009", message: "Missing First Name", status: 400 },
    Participant_Import_Missing_Last_Name_Error: { code: "E0702000010", message: "Missing Last Name", status: 400 },
    Participant_Import_Missing_Country_Code_Error: { code: "E0702000011", message: "Missing Country Code", status: 400 },
    Participant_Import_Missing_Ticket_Pass_Code_Error: { code: "E0702000012", message: "Missing Ticket Pass Code", status: 400 },
    Participant_Import_Missing_Notification_Lang_Error: { code: "E0702000013", message: "Missing Notification Language", status: 400 },
    Participant_Import_Missing_Shown_In_Parti_List_Error: { code: "E0702000014", message: "Missing shownInPartiList", status: 400 },
    Participant_Import_Website_Type_Error: { code: "E0702000015", message: "Website Type is not conference", status: 400 },

    Participant_Import_Invalid_Registration_Status_Error: { code: "E0702100001", message: "Invalid Registration Status", status: 400 },
    Participant_Import_Invalid_Notification_Lang_Error: { code: "E0702100002", message: "Invalid Notification Language", status: 400 },
    Participant_Import_Invalid_Shown_In_Parti_List_Error: { code: "E0702100003", message: "Invalid shownInPartiList", status: 400 },
    Participant_Import_Invalid_Registration_Number_Error: { code: "E0702100004", message: "Invalid Registration Number", status: 400 },
    Participant_Import_Invalid_SSO_Email_Error: { code: "E0702100005", message: "Invalid SSOUID or Email", status: 400 },
    Participant_Duplicate_Error: { code: "E0702100006", message: "Participant can only have one registration", status: 400 },

    Participant_Import_Invalid_Ticket_Pass_Code_Error: { code: "E0702200001", message: "Invalid Ticket_Pass_Code", status: 400 },
    Ticket_Pass_Code_NotFound_Error: { code: "E0702200002", message: "Ticket Pass Code Not found", status: 404 },
    Fair_Setting_NotFound_Error: { code: "E0702200003", message: "Fair Setting Not found", status: 404 },
    Custom_Question_Duplicate_Error: {code: "E0702200004", message: "Custom Question Duplicated", status: 400 },

    //Custom Questions
    Custom_Questions_NotFound_Error: { code: "E0702300001", message: "Custom Questions Not found", status: 404 },
    Custom_Questions_FilterLabel_NotFound_Error: { code: "E070230002", message: "Custom Questions Filter Label Not found", status: 404 },
    Custom_Question_Import_Missing_FairCode_Error: { code: "E0702300011", message: "Missing Fair", status: 404 },
    Custom_Question_Import_Missing_ProjectYear_Error: { code: "E0702300012", message: "Missing Project Year", status: 404 },
    Custom_Question_Import_Missing_FiscalYear_Error: { code: "E0702300013", message: "Missing Fiscal Year", status: 404 },
    Create_Custom_Question_Task_Error: { code: "E0702300014", message: "Fail to create custom question task list from Fair Service", status: 404 },
    Custom_Question_Import_Unknown_Create_Task_Error: { code: "E0702300015", message: "Unknown Custom Question Import Task Creation Error", status: 404 },

    //Fair Service
    Fair_Listing_Error: { code: "E0701200001", message: "Unable to Get Fair Listing", status: 400 },
    Fair_SsoUid_Not_Found_Error: { code: "E0701200002", message: "Unable to Get the SsoUid by the Fair Code", status: 400 },
    Fair_Search_Participant_Error: { code: "E0701200003", message: "Fail to search fair participant", status: 400 },
    Fair_Search_Participant_ES_Error: { code: "E0701200004", message: "Fail to search fair participant in OpenSearch", status: 400 },
    Fair_Listing_From_Database_Error: { code: "E0701200005", message: "Unable to Get Fair Listing from database in getFairListingFromDB", status: 400 },
    Open_Fairs_From_Database_Error: { code: "E0701200006", message: "Unable to Get Open Fairs from database in getOpenFairsFromDB", status: 400 },

    // Conference Servicem
    Seminar_Registration_NotFound_Error: { code: "E0702300016", message: "No Access to This Video", status: 403 },
    Ticket_Pass_NotFound_Error: { code: "E0702300017", message: "No Access to This Seminar", status: 403 },   
}
