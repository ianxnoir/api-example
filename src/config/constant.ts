export const constant = {
  // eventCode: {
  //     'vep-content': {
  //         codeService: {
  //             marketsNews: '301'
  //         }
  //     }
  // },
  // codeMapper: {
  //     http_request_received: '00001',
  //     http_response_sent: '00002',
  //     api_call: '00003',
  //     exception_raised: '00004'
  // }

  actionType: {
    INSERT_PAST_BUYER: "INSERT_PAST_BUYER",
    INSERT_ONSITE_BUYER: "INSERT_ONSITE_BUYER",
    VEP_INSERT_BUYER: "VEP_INSERT_BUYER",
    VEP_UPDATE_BUYER: "VEP_UPDATE_BUYER",
    INSERT_BUYER_WITH_BM_TENTATIVE: "INSERT_BUYER_WITH_BM_TENTATIVE",
    VEP_REG_BUYER: "VEP_REG_BUYER"
  },

  submitFormDefaultValue : {
    Tier: "GENERAL",
    SourceTypeCode: "17"
  },

  taskStatus: {
    FAILED: "FAILED",
    VALIDATING: "VALIDATING",
    VALIDATED: "VALIDATED",
    IMPORTING: "IMPORTING",
    COMPLETED: "COMPLETED",
    PARTIAL_IMPORTED: "PARTIAL_IMPORTED",
    UPLOADING: "UPLOADING",
    PENDING: "PENDING"
  },

  defaultUserName: {
    SYSTEM: "SYSTEM"
  },

  // participantType
  // 1 - ORGANIC
  // 2 - VIP_CIP
  // 3 - VIP_MISSION
  // 4 - EXHIBITOR

  // DbSubsegment-{Microservice Name}-{Class Name}-{function name}
  segmentName: {
    QUERY_FAIR_REGISTRATION_IMPORT_TASK_BY_TASK_ID : "DbSubsegment-vep-fair-BuyerImportService-getFailureReportDownloadUrl",
    QUERY_CUSTOM_QUESTIONS_IMPORT_TASK_BY_TASK_ID : "DbSubsegment-vep-fair-CustomQuestionsService-getFailureReportDownloadUrl"
  },

  API_RESPONSE_CODE: {
    SUCCESS: 200,
    FAIL: 400,
  },
  API_RESPONSE_FIELDS: {
    STATUS: 'status',
    MESSAGE: 'message'
  },
  FAIR_RELATIONSHIP: {
    FAIR_TYPE: 'fairType',
    SINGLE: 'single',
    COMBINED: 'combined',
    NO_RECORD: 'no fair record found'
  },

  FAIR_REGISTRATION_STATUS: {
    INCOMPLETE: 'INCOMPLETE',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
    SUBMITED: 'SUBMITED',
  },

  SEMINAR_REGISTRATION_EVENT: {
    CANCEL: 'CANCEL_TIC',
    CANCEL_REGISTER: 'CANCEL_AND_REGISTER_TIC',
    REGISTER: 'REGISTER_TIC',
    UPDATE: 'UPDATE_INFO'
  }

};

export type participantType = {
  participantType: number;
  tier: string;
  displayName: string;
  visitorDisplayName?: string;
}

export type participantTypeMap = {
  [key: string]: participantType
}
