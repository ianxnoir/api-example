-- mysql -u root -p
-- source vepFairDb.sql

SET @CREATED_BY = 'SYSTEM';
SET @LAST_UPDATED_BY = 'SYSTEM';
SET @VISITOR_TYPE_CAT_BUYER = 'Buyer';
SET @VISITOR_TYPE_CAT_VIP = 'VIP';
SET @VISITOR_TYPE_CAT_EXHIBITOR = 'Exhibitor';
SET @VISITOR_TYPE_CAT_OTHER_BUYER = 'Other Buyer';
SET @VISITOR_TYPE_CAT_MISCELLANEOUS = 'Miscellaneous';
SET @VISITOR_TYPE_CAT_ORS = 'ORS Form Template';

SET character_set_server = 'utf8mb4';

CREATE TABLE fairParticipant(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    ssoUid VARCHAR(50),
    emailId VARCHAR(255),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    CONSTRAINT ssoUid_unique UNIQUE (ssoUid),
    CONSTRAINT emailId_unique UNIQUE(emailId),
    PRIMARY KEY (id)
);

INSERT INTO fairParticipant(id, ssoUid, emailId, createdBy, lastUpdatedBy) 
VALUES (1, '5f2ec1c6d2d24be681752bc7500380e1', 'test@yopmail.com', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipant(id, ssoUid, emailId, createdBy, lastUpdatedBy) 
VALUES (2, '327056e583594b9c94b9d0b4fea8a3f2', 'rockfong@esdlife.com', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipant(id, ssoUid, emailId, createdBy, lastUpdatedBy) 
VALUES (3, '2aae5509d6974433870a4684e842b6ef', 'veptesting20@yahoo.com', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipant(id, ssoUid, emailId, createdBy, lastUpdatedBy) 
VALUES (4, '13c4755b5d944cf9b1efd7a55328fa22', 'veptesting1@gmail.com', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipant(id, ssoUid, emailId, createdBy, lastUpdatedBy) 
VALUES (5, 'adcb79710d93492cac87b8260f18b99b', 'veptesting1+2@gmail.com', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipant(id, ssoUid, emailId, createdBy, lastUpdatedBy) 
VALUES (6, '9cf785345790438a90cf79e22929a03c', 'tracychan@esdlife.com', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipant(id, ssoUid, emailId, createdBy, lastUpdatedBy) 
VALUES (7, '327056e583594b9c94b9d0b4fea8a3f', 'rockfong@esdlife.co', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipant(id, ssoUid, emailId, createdBy, lastUpdatedBy) 
VALUES (8, 'e868a7fc544c42929a98b348374d0c5b', 'peterpang@esdlife.com', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipant(id, ssoUid, emailId, createdBy, lastUpdatedBy) 
VALUES (9, 'b3389bf89228415196b49648164ccb95', 'janicelau@esdlife.com', @CREATED_BY, @LAST_UPDATED_BY);

SELECT id, ssoUid, emailId FROM fairParticipant;


CREATE TABLE fairRegistrationType(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairRegistrationTypeCode VARCHAR(36),
    fairRegistrationTypeDesc VARCHAR(255),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO fairRegistrationType(id, fairRegistrationTypeCode, fairRegistrationTypeDesc, createdBy, lastUpdatedBy) 
VALUES (1, 'E_REG_FORM', 'e-Reg Form', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairRegistrationType(id, fairRegistrationTypeCode, fairRegistrationTypeDesc, createdBy, lastUpdatedBy) 
VALUES (2, 'VEP_IMPORT_PAST_BUYER', 'VEP Import - Past Buyer', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairRegistrationType(id, fairRegistrationTypeCode, fairRegistrationTypeDesc, createdBy, lastUpdatedBy) 
VALUES (3, 'VEP_IMPORT_ONSITE_REG', 'VEP Import - Onsite Registration', @CREATED_BY, @LAST_UPDATED_BY);


SELECT id, fairRegistrationTypeCode, fairRegistrationTypeDesc FROM fairRegistrationType;


CREATE TABLE fairRegistrationStatus(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairRegistrationStatusCode VARCHAR(255),
    fairRegistrationStatusDesc VARCHAR(255),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO fairRegistrationStatus(id, fairRegistrationStatusCode, fairRegistrationStatusDesc, createdBy, lastUpdatedBy) 
VALUES (1, 'CONFIRMED', 'Confirmed', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairRegistrationStatus(id, fairRegistrationStatusCode, fairRegistrationStatusDesc, createdBy, lastUpdatedBy) 
VALUES (2, 'CANCELLED', 'Cancelled', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairRegistrationStatus(id, fairRegistrationStatusCode, fairRegistrationStatusDesc, createdBy, lastUpdatedBy) 
VALUES (3, 'REJECTED', 'Rejected', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairRegistrationStatus(id, fairRegistrationStatusCode, fairRegistrationStatusDesc, createdBy, lastUpdatedBy) 
VALUES (4, 'SUBMITED', 'Submited', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairRegistrationStatus(id, fairRegistrationStatusCode, fairRegistrationStatusDesc, createdBy, lastUpdatedBy) 
VALUES (5, 'INCOMPLETE', 'Incomplete', @CREATED_BY, @LAST_UPDATED_BY);

SELECT id, fairRegistrationStatusCode, fairRegistrationStatusDesc FROM fairRegistrationStatus;


CREATE TABLE fairParticipantType(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairParticipantTypeCode VARCHAR(255),
    fairParticipantTypeDesc VARCHAR(255),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO fairParticipantType(id, fairParticipantTypeCode, fairParticipantTypeDesc, createdBy, lastUpdatedBy) 
VALUES (1, 'ORGANIC', 'Organic Buyer', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipantType(id, fairParticipantTypeCode, fairParticipantTypeDesc, createdBy, lastUpdatedBy) 
VALUES (2, 'VIP_CIP', 'VIP - CIP Buyer', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipantType(id, fairParticipantTypeCode, fairParticipantTypeDesc, createdBy, lastUpdatedBy) 
VALUES (3, 'VIP_MISSION', 'VIP - Mission Buyer', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipantType(id, fairParticipantTypeCode, fairParticipantTypeDesc, createdBy, lastUpdatedBy) 
VALUES (4, 'EXHIBITOR', 'Exhibitor', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairParticipantType(id, fairParticipantTypeCode, fairParticipantTypeDesc, createdBy, lastUpdatedBy) 
VALUES (99, 'RESERVED', 'RESERVED', @CREATED_BY, @LAST_UPDATED_BY);

SELECT id, fairParticipantTypeCode, fairParticipantTypeDesc FROM fairParticipantType;



CREATE TABLE c2mParticipantStatus(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    c2mParticipantStatusCode VARCHAR(255),
    c2mParticipantStatusDesc VARCHAR(255),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO c2mParticipantStatus(id, c2mParticipantStatusCode, c2mParticipantStatusDesc, createdBy, lastUpdatedBy) 
VALUES (1, 'ACTIVE', 'Active', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO c2mParticipantStatus(id, c2mParticipantStatusCode, c2mParticipantStatusDesc, createdBy, lastUpdatedBy) 
VALUES (2, 'INACTIVE', 'Inactive', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO c2mParticipantStatus(id, c2mParticipantStatusCode, c2mParticipantStatusDesc, createdBy, lastUpdatedBy) 
VALUES (3, 'HIDDEN', 'Hidden', @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO c2mParticipantStatus(id, c2mParticipantStatusCode, c2mParticipantStatusDesc, createdBy, lastUpdatedBy) 
VALUES (4, 'RESTRICTED', 'Restricted', @CREATED_BY, @LAST_UPDATED_BY);

SELECT id, c2mParticipantStatusCode, c2mParticipantStatusDesc FROM c2mParticipantStatus;



CREATE TABLE fairFormTemplate(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairFormTemplateCode VARCHAR(255), 
    fairFormTemplateType VARCHAR(20), 
    fairFormTemplateJson BLOB, 
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO fairFormTemplate(id, fairFormTemplateCode, fairFormTemplateType, fairFormTemplateJson, createdBy, lastUpdatedBy) 
VALUES (1, 'fairFormTemplateCode', 'fairFormTemplateType', '{"id": 1, "name": "Monty"}', @CREATED_BY, @LAST_UPDATED_BY);

SELECT id, fairFormTemplateCode, fairFormTemplateType, fairFormTemplateJson FROM fairFormTemplate;


CREATE TABLE sourceType(
    sourceTypeCode VARCHAR(20) NOT NULL UNIQUE,
    sourceTypeDesc VARCHAR(255),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sourceTypeCode)
);

-- Predefined according to the action type 
-- Insert Past Buyer (DI) - 08 - DATES
-- Insert Onsite Buyer (VMS) - Dim this field
-- Insert General Buyer - 18- VEP admin import
-- Update Buyer (VEP) - Dim this field
-- Remarks: VEP eReg form - 17  -VEP

INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('01', 'Onsite', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('02', 'ORS', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('03', 'ORS Mobile', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('04', 'VMS', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('05', 'VMS Mobile', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('06', 'Hotel Kiosks', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('07', 'Self Service Kiosk', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('08', 'DATES', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('09', 'Visitor Promotion', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('10', 'Overseas Office', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('11', 'Non-TDC Events', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('12', 'OCRS', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('13', 'SORS', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('14', 'e-Badge', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('15', 'EOA', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('16', 'Always-on', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('17', 'VEP', @CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO sourceType(sourceTypeCode, sourceTypeDesc, createdBy, lastUpdatedBy) VALUES ('18', 'VEP Admin Import', @CREATED_BY, @LAST_UPDATED_BY);

SELECT sourceTypeCode, sourceTypeDesc FROM sourceType;

CREATE TABLE visitorType(
    visitorTypeCode VARCHAR(20) NOT NULL UNIQUE,
    visitorTypeDesc VARCHAR(255),
    visitorTypeCategory VARCHAR(20),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (visitorTypeCode)
);

INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('00', 'Onsite Registered Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('01', 'Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('02', 'No Show Pre-reg Buyers',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('03', 'Past Visitor (Last year)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('04', 'Past Visitor (2 years ago)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('05', 'Past Visitor (3 years ago)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('06', 'Past Visitor (Frequent Company)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('07', 'Past Visitor (Frequent Buyer)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('08', 'Past Visitor (Alternate fair - last year)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('09', 'Past Buyer - Dormant (Alternate Edition)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('10', 'Past Buyer - Dormant (Past 4 yrs or up buyers)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('11', 'Potential Buyers? (Never register/ Event Code/ Product Code)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('12', 'Airport Buffer Hall Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('13', 'Octopus Cards (Premier Cards Programme) Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('14', 'Roadshow Enquiry',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('15', 'VP - Asia Miles',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('16', 'VP - Buying Mission',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('17', 'VP - Carpet Coverage',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('18', 'VP - Dragon Lounge',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('19', 'VP - Local TM',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('20', 'VP - Offsite',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('21', 'VP - Sponsored Buyer',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('22', 'Top Importer',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('23', 'Sponsorship',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('24', 'Sponsorship - Hosted Guest (3 Nights)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('25', 'Sponsorship - Hosted Guest (4 Nights)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('26', 'Sponsorship - Buying Mission (Hotel)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('27', 'Sponsorship - Buying Mission (Cash)',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('28', 'Sponsorship - Nominated Guest',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('29', 'Paid Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('30', 'Seminar Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('31', 'Conference - Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('32', 'Conference - Workshops Participants',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('33', 'Marcom - Google SEM',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('34', 'Marcom - Internal SMS',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('35', 'Marcom - Facebook/WeChat',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('36', 'Marcom - eDM',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('37', 'Special Events Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('38', 'Contingency Barcode Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('39', 'Marcom - LinkedIn',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('40', 'Marcom - Gmail',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('41', 'Marcom - Yahoo SEM',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('42', 'Marcom - Location based SMS',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('43', 'Marcom - WeChat',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('44', 'Marcom - Baidu SEM',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('45', 'Marcom - Print Ad',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('46', 'Marcom - Banner Ad',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('47', 'Marcom - Mobile Ad',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('48', 'Marcom - Event Listing Site',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('49', 'Marcom - Others',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('50', 'Online Media',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('51', 'KOL',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('58', 'Past Visitor - Inactive in DATES',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('59', 'Octopus Cards (Fair New Buyer Programme) Visitor',@VISITOR_TYPE_CAT_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('61', 'VIP',@VISITOR_TYPE_CAT_VIP,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('62', 'VIP - Dragon Lounge',@VISITOR_TYPE_CAT_VIP,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('63', 'VIP - Speaker',@VISITOR_TYPE_CAT_VIP,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('70', 'Deal Flow Visitors',@VISITOR_TYPE_CAT_OTHER_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('71', 'Workshop participants',@VISITOR_TYPE_CAT_OTHER_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('72', 'Fashion Show Attendee',@VISITOR_TYPE_CAT_OTHER_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('73', 'HK Asian Pop Music Festival Visitor',@VISITOR_TYPE_CAT_OTHER_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('74', 'Speaker',@VISITOR_TYPE_CAT_OTHER_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('75', 'Guest',@VISITOR_TYPE_CAT_OTHER_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('76', 'Oversea Delegation',@VISITOR_TYPE_CAT_OTHER_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('77', 'Mainland Delegation',@VISITOR_TYPE_CAT_OTHER_BUYER,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('80', 'Exhibitor',@VISITOR_TYPE_CAT_EXHIBITOR,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('81', 'Exhibitor (Storage)',@VISITOR_TYPE_CAT_EXHIBITOR,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('A2', 'Advisor',@VISITOR_TYPE_CAT_EXHIBITOR,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('A3', 'Co-Organiser/ JV Organiser/ Supporting Organiser',@VISITOR_TYPE_CAT_EXHIBITOR,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('A7', 'Transportation Forwarder',@VISITOR_TYPE_CAT_EXHIBITOR,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('A8', 'Freight Forwarder',@VISITOR_TYPE_CAT_EXHIBITOR,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('A1', 'Staff',@VISITOR_TYPE_CAT_MISCELLANEOUS,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('A5', 'Tempoary Staff',@VISITOR_TYPE_CAT_MISCELLANEOUS,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('A4', 'Partner',@VISITOR_TYPE_CAT_MISCELLANEOUS,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('A6', 'Security/Customs/Police',@VISITOR_TYPE_CAT_MISCELLANEOUS,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('60', 'Media/Press/Journalist',@VISITOR_TYPE_CAT_MISCELLANEOUS,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('78', 'Student/ Public Visitor',@VISITOR_TYPE_CAT_MISCELLANEOUS,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('F1', 'ORS Only Registratrion Form',@VISITOR_TYPE_CAT_ORS,@CREATED_BY, @LAST_UPDATED_BY);
INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy) VALUES ('F2', 'ORS Only Registratrion Form (non 21 Type)',@VISITOR_TYPE_CAT_ORS,@CREATED_BY, @LAST_UPDATED_BY);


SELECT visitorTypeCode, visitorTypeDesc, visitorTypeCategory FROM visitorType;

-- For euConsentStatus, badgeConsent, c2mConsent, registrationDetailConsent
-- Must be one of the following values: “Y” , “N”, ''U“

CREATE TABLE fairRegistration(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairParticipantId BIGINT UNSIGNED NOT NULL,
    fairCode VARCHAR(50),
    fiscalYear VARCHAR(9),
    serialNumber VARCHAR(20),
    projectYear VARCHAR(9),
    sourceTypeCode VARCHAR(20),
    visitorTypeCode VARCHAR(20),	  
    projectNumber VARCHAR(20), 
    registrationNoChecksum VARCHAR(255),
    fairRegistrationTypeId BIGINT UNSIGNED,
    fairRegistrationStatusId BIGINT UNSIGNED,
    fairParticipantTypeId BIGINT UNSIGNED,
    c2mParticipantStatusId BIGINT UNSIGNED,
    title VARCHAR(20),
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    displayName VARCHAR(255),
    position VARCHAR(255),
    companyName VARCHAR(255),
    addressLine1 VARCHAR(255),
    addressLine2 VARCHAR(255),
    addressLine3 VARCHAR(255),
    addressLine4 VARCHAR(255),
    addressCountryCode VARCHAR(20),
    postalCode VARCHAR(20),
    stateOrProvinceCode VARCHAR(20),
    cityCode VARCHAR(20),
    companyPhoneCountryCode VARCHAR(20),
    companyPhoneAreaCode VARCHAR(20),
    companyPhonePhoneNumber VARCHAR(50),
    companyPhoneExtension VARCHAR(20),
    mobilePhoneNumber VARCHAR(20),
    mobilePhoneCountryCode VARCHAR(20),
    companyWebsite VARCHAR(255),
    companyBackground VARCHAR(3000),
    overseasBranchOffice VARCHAR(255),
    overseasBranchOfficer VARCHAR(255),
    cbmRemark TEXT,
    vpRemark TEXT,
    generalBuyerRemark TEXT,
    companyCcdid VARCHAR(20),
    individualCcdid VARCHAR(20),
    euConsentStatus VARCHAR(2),
    badgeConsent VARCHAR(2),
    c2mConsent VARCHAR(2),
    c2mLogin VARCHAR(2),
    c2mMeetingLogin VARCHAR(2),
    tier VARCHAR(20),
    registrationDetailConsent VARCHAR(2),
    formTemplateId BIGINT UNSIGNED,
    formDataJson MEDIUMTEXT,
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(fairParticipantId) REFERENCES fairParticipant(id),
    FOREIGN KEY(fairRegistrationTypeId) REFERENCES fairRegistrationType(id),
    FOREIGN KEY(fairRegistrationStatusId) REFERENCES fairRegistrationStatus(id),
    FOREIGN KEY(fairParticipantTypeId) REFERENCES fairParticipantType(id),
    FOREIGN KEY(c2mParticipantStatusId) REFERENCES c2mParticipantStatus(id),
    FOREIGN KEY(formTemplateId) REFERENCES fairFormTemplate(id),
    FOREIGN KEY(sourceTypeCode) REFERENCES sourceType(sourceTypeCode),
    FOREIGN KEY(visitorTypeCode) REFERENCES visitorType(visitorTypeCode),
    CONSTRAINT registration_no_unique UNIQUE(serialNumber,projectYear,sourceTypeCode,visitorTypeCode,projectNumber),
    CONSTRAINT fair_participant_unique UNIQUE(fairParticipantId, fairCode, fiscalYear)
);

-- 1
INSERT INTO fairRegistration(id, tier, fairParticipantId,fairCode,fiscalYear,serialNumber,projectYear,sourceTypeCode,visitorTypeCode,projectNumber,registrationNoChecksum,fairRegistrationTypeId,fairRegistrationStatusId,fairParticipantTypeId,c2mParticipantStatusId,title,firstName,lastName,displayName,position,companyName,addressLine1,addressLine2,addressLine3,addressLine4,addressCountryCode,postalCode,stateOrProvinceCode,cityCode,companyPhoneCountryCode,companyPhoneAreaCode,companyPhonePhoneNumber,companyPhoneExtension,mobilePhoneNumber,mobilePhoneCountryCode,companyWebsite,companyBackground,overseasBranchOffice,companyCcdid,euConsentStatus,badgeConsent,c2mConsent,registrationDetailConsent,formTemplateId,formDataJson,createdBy,lastUpdatedBy)
VALUES (1, 'GENERAL', 1,'hkjewellery','2022','000001','2021','08','03','007','xxx',2,1,1,1,'Mr',"Peter","Anderson","Peter Anderson","General Manager","HKTDC","31F, Wu Chung House","213 Queen's Rd East","Wai Chai","Hong Kong Island","HKG","","","","HKG","","12345678","","12345676","HKG","http://aboutus.hktdc.com","Trade Development Council is a HK Council","HK","131XXXXXX811","Y","Y","Y","Y",1,"{}","SYSTEM","SYSTEM");


INSERT INTO fairRegistration(id, tier, fairParticipantId,fairCode,fiscalYear,serialNumber,projectYear,sourceTypeCode,visitorTypeCode,projectNumber,registrationNoChecksum,fairRegistrationTypeId,fairRegistrationStatusId,fairParticipantTypeId,c2mParticipantStatusId,title,firstName,lastName,displayName,position,companyName,addressLine1,addressLine2,addressLine3,addressLine4,addressCountryCode,postalCode,stateOrProvinceCode,cityCode,companyPhoneCountryCode,companyPhoneAreaCode,companyPhonePhoneNumber,companyPhoneExtension,mobilePhoneNumber,mobilePhoneCountryCode,companyWebsite,companyBackground,overseasBranchOffice,companyCcdid,euConsentStatus,badgeConsent,c2mConsent,registrationDetailConsent,formTemplateId,formDataJson,createdBy,lastUpdatedBy)
VALUES (2, 'GENERAL', 1,'hkjewellery','2021','000001','2020','08','03','007','xxx',2,1,1,1,'Mr',"Peter","Anderson","Peter Anderson","General Manager","HKTDC","31F, Wu Chung House","213 Queen's Rd East","Wai Chai","Hong Kong Island","HKG","","","","HKG","","12345678","","12345676","HKG","http://aboutus.hktdc.com","Trade Development Council is a HK Council","HK","131XXXXXX811","Y","Y","Y","Y",1,"{}","SYSTEM","SYSTEM");


INSERT INTO fairRegistration(id, tier, fairParticipantId,fairCode,fiscalYear,serialNumber,projectYear,sourceTypeCode,visitorTypeCode,projectNumber,registrationNoChecksum,fairRegistrationTypeId,fairRegistrationStatusId,fairParticipantTypeId,c2mParticipantStatusId,title,firstName,lastName,displayName,position,companyName,addressLine1,addressLine2,addressLine3,addressLine4,addressCountryCode,postalCode,stateOrProvinceCode,cityCode,companyPhoneCountryCode,companyPhoneAreaCode,companyPhonePhoneNumber,companyPhoneExtension,mobilePhoneNumber,mobilePhoneCountryCode,companyWebsite,companyBackground,overseasBranchOffice,companyCcdid,euConsentStatus,badgeConsent,c2mConsent,registrationDetailConsent,formTemplateId,formDataJson,createdBy,lastUpdatedBy)
VALUES (4, 'GENERAL', 1,'hklicensingshow','2223','000001','2222','08','03','007','xxx',2,1,1,1,'Mr',"Peter","Anderson","Peter Anderson","General Manager","HKTDC","31F, Wu Chung House","213 Queen's Rd East","Wai Chai","Hong Kong Island","HKG","","","","HKG","","12345678","","12345676","HKG","http://aboutus.hktdc.com","Trade Development Council is a HK Council","HK","131XXXXXX811","Y","Y","Y","Y",1,"{}","SYSTEM","SYSTEM");


INSERT INTO fairRegistration(id, tier, fairParticipantId,fairCode,fiscalYear,serialNumber,projectYear,sourceTypeCode,visitorTypeCode,projectNumber,registrationNoChecksum,fairRegistrationTypeId,fairRegistrationStatusId,fairParticipantTypeId,c2mParticipantStatusId,title,firstName,lastName,displayName,position,companyName,addressLine1,addressLine2,addressLine3,addressLine4,addressCountryCode,postalCode,stateOrProvinceCode,cityCode,companyPhoneCountryCode,companyPhoneAreaCode,companyPhonePhoneNumber,companyPhoneExtension,mobilePhoneNumber,mobilePhoneCountryCode,companyWebsite,companyBackground,overseasBranchOffice,companyCcdid,euConsentStatus,badgeConsent,c2mConsent,registrationDetailConsent,formTemplateId,formDataJson,createdBy,lastUpdatedBy)
VALUES (5, 'GENERAL', 1,'hklicensingshow','2021','000002','2020','08','03','007','xxx',2,1,1,1,'Mr',"Peter","Anderson","Peter Anderson","General Manager","HKTDC","31F, Wu Chung House","213 Queen's Rd East","Wai Chai","Hong Kong Island","HKG","","","","HKG","","12345678","","12345676","HKG","http://aboutus.hktdc.com","Trade Development Council is a HK Council","HK","131XXXXXX811","Y","Y","Y","Y",1,"{}","SYSTEM","SYSTEM");

INSERT INTO fairRegistration(id, tier, fairParticipantId,fairCode,fiscalYear,serialNumber,projectYear,sourceTypeCode,visitorTypeCode,projectNumber,registrationNoChecksum,fairRegistrationTypeId,fairRegistrationStatusId,fairParticipantTypeId,c2mParticipantStatusId,title,firstName,lastName,displayName,position,companyName,addressLine1,addressLine2,addressLine3,addressLine4,addressCountryCode,postalCode,stateOrProvinceCode,cityCode,companyPhoneCountryCode,companyPhoneAreaCode,companyPhonePhoneNumber,companyPhoneExtension,mobilePhoneNumber,mobilePhoneCountryCode,companyWebsite,companyBackground,overseasBranchOffice,companyCcdid,euConsentStatus,badgeConsent,c2mConsent,registrationDetailConsent,formTemplateId,formDataJson,createdBy,lastUpdatedBy)
VALUES (6, 'GENERAL', 1,'hklicensingshow','2022','000003','2020','08','03','007','xxx',2,1,1,1,'Mr',"Peter","Anderson","Peter Anderson","General Manager","HKTDC","31F, Wu Chung House","213 Queen's Rd East","Wai Chai","Hong Kong Island","HKG","","","","HKG","","12345678","","12345676","HKG","http://aboutus.hktdc.com","Trade Development Council is a HK Council","HK","131XXXXXX811","Y","Y","Y","Y",1,"{}","SYSTEM","SYSTEM");

SELECT id, fairParticipantId, fairCode, fiscalYear, serialNumber, projectYear, sourceTypeCode, visitorTypeCode, projectNumber FROM fairRegistration;

CREATE TABLE fairRegistrationNob(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairRegistrationId BIGINT UNSIGNED NOT NULL,
    fairRegistrationNobCode VARCHAR(20) NOT NULL,
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO fairRegistrationNob(id, fairRegistrationId, fairRegistrationNobCode, createdBy, lastUpdatedBy)
VALUES (1, 1, '1', "SYSTEM", "SYSTEM");

INSERT INTO fairRegistrationNob(id, fairRegistrationId, fairRegistrationNobCode, createdBy, lastUpdatedBy)
VALUES (2, 1, '2', "SYSTEM", "SYSTEM");

INSERT INTO fairRegistrationNob(id, fairRegistrationId, fairRegistrationNobCode, createdBy, lastUpdatedBy)
VALUES (3, 1, '3', "SYSTEM", "SYSTEM");

SELECT id, fairRegistrationId, fairRegistrationNobCode FROM fairRegistrationNob;


CREATE TABLE fairRegistrationProductInterest(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairRegistrationId BIGINT UNSIGNED NOT NULL,
    stId VARCHAR(40) NOT NULL,
    iaId VARCHAR(40) NOT NULL,
    teCode VARCHAR(40) NOT NULL,
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO fairRegistrationProductInterest(id, fairRegistrationId, stId, iaId, teCode, createdBy, lastUpdatedBy)
VALUES (1, 1, "d0c2c27fe39c11ea883f06c82c63b760", "16dd07ade3a111ea883f06c82c63b760", "P570306XA02", @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairRegistrationProductInterest(id, fairRegistrationId, stId, iaId, teCode, createdBy, lastUpdatedBy)
VALUES (2, 1, "e981674ce39c11ea883f06c82c63b760", "c507aac8e3a011ea883f06c82c63b760", "P580604XA07", @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairRegistrationProductInterest(id, fairRegistrationId, stId, iaId, teCode, createdBy, lastUpdatedBy)
VALUES (3, 1, "dd629b751857464dbaa5d96468929ea1", "bf1cc74ae3a011ea883f06c82c63b760", "P340601XA01", @CREATED_BY, @LAST_UPDATED_BY);

INSERT INTO fairRegistrationProductInterest(id, fairRegistrationId, stId, iaId, teCode, createdBy, lastUpdatedBy)
VALUES (4, 1, "2731a42fe39d11ea883f06c82c63b760", "b849e507e3a011ea883f06c82c63b760", "P160106XA06", @CREATED_BY, @LAST_UPDATED_BY);

SELECT id, fairRegistrationId, stId, iaId, teCode FROM fairRegistrationProductInterest;


CREATE TABLE fairRegistrationTypesOfTargetSuppliers(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairRegistrationId BIGINT UNSIGNED NOT NULL,
    fairRegistrationTypesOfTargetSuppliersCode VARCHAR(20) NOT NULL,
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO fairRegistrationTypesOfTargetSuppliers(id, fairRegistrationId, fairRegistrationTypesOfTargetSuppliersCode, createdBy, lastUpdatedBy)
VALUES (1, 1, 'OEM', "SYSTEM", "SYSTEM");

INSERT INTO fairRegistrationTypesOfTargetSuppliers(id, fairRegistrationId, fairRegistrationTypesOfTargetSuppliersCode, createdBy, lastUpdatedBy)
VALUES (2, 1, 'ODM', "SYSTEM", "SYSTEM");

INSERT INTO fairRegistrationTypesOfTargetSuppliers(id, fairRegistrationId, fairRegistrationTypesOfTargetSuppliersCode, createdBy, lastUpdatedBy)
VALUES (3, 1, 'OBM', "SYSTEM", "SYSTEM");


SELECT id, fairRegistrationId, fairRegistrationTypesOfTargetSuppliersCode FROM fairRegistrationTypesOfTargetSuppliers;



CREATE TABLE fairRegistrationProductStrategy(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairRegistrationId BIGINT UNSIGNED NOT NULL,
    fairRegistrationProductStrategyCode VARCHAR(20) NOT NULL,
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO fairRegistrationProductStrategy(id, fairRegistrationId, fairRegistrationProductStrategyCode, createdBy, lastUpdatedBy)
VALUES (1, 1, 'OEM', "SYSTEM", "SYSTEM");

INSERT INTO fairRegistrationProductStrategy(id, fairRegistrationId, fairRegistrationProductStrategyCode, createdBy, lastUpdatedBy)
VALUES (2, 1, 'ODM', "SYSTEM", "SYSTEM");

INSERT INTO fairRegistrationProductStrategy(id, fairRegistrationId, fairRegistrationProductStrategyCode, createdBy, lastUpdatedBy)
VALUES (3, 1, 'OBM', "SYSTEM", "SYSTEM");

SELECT id, fairRegistrationId, fairRegistrationProductStrategyCode FROM fairRegistrationProductStrategy;


CREATE TABLE fairRegistrationPreferredSuppCountryRegion(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairRegistrationId BIGINT UNSIGNED NOT NULL,
    fairRegistrationPreferredSuppCountryRegionCode VARCHAR(20) NOT NULL,
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO fairRegistrationPreferredSuppCountryRegion(id, fairRegistrationId, fairRegistrationPreferredSuppCountryRegionCode, createdBy, lastUpdatedBy)
VALUES (1, 1, 'AU', "SYSTEM", "SYSTEM");

INSERT INTO fairRegistrationPreferredSuppCountryRegion(id, fairRegistrationId, fairRegistrationPreferredSuppCountryRegionCode, createdBy, lastUpdatedBy)
VALUES (2, 1, 'EE', "SYSTEM", "SYSTEM");

INSERT INTO fairRegistrationPreferredSuppCountryRegion(id, fairRegistrationId, fairRegistrationPreferredSuppCountryRegionCode, createdBy, lastUpdatedBy)
VALUES (3, 1, 'JP', "SYSTEM", "SYSTEM");

INSERT INTO fairRegistrationPreferredSuppCountryRegion(id, fairRegistrationId, fairRegistrationPreferredSuppCountryRegionCode, createdBy, lastUpdatedBy)
VALUES (4, 1, 'HK', "SYSTEM", "SYSTEM");

SELECT id, fairRegistrationId, fairRegistrationPreferredSuppCountryRegionCode FROM fairRegistrationPreferredSuppCountryRegion;



CREATE TABLE registrationSerialNumberReservation(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    projectYear VARCHAR(255),
    sourceTypeCode VARCHAR(255),
    visitorTypeCode VARCHAR(255),
    projectNumber VARCHAR(255),
    serialNumberStart BIGINT UNSIGNED NOT NULL,
    serialNumberEnd BIGINT UNSIGNED NOT NULL,
    taskReferenceId VARCHAR(255),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);



CREATE TABLE fairRegistrationImportTask(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    taskId VARCHAR(36),
    originalFileName VARCHAR(150),
    uploadFileS3ObjectRefId VARCHAR(500),
    failureReportS3ObjectRefId VARCHAR(500),
    fairCode VARCHAR(50),
    fiscalYear VARCHAR(9),
    projectYear VARCHAR(9),
    actionType VARCHAR(50),
    sourceType VARCHAR(20),
    visitorType VARCHAR(20),
    participantTypeId BIGINT UNSIGNED,
    tier VARCHAR(20),
    serialNumberStart MEDIUMINT,
    numberOfRow MEDIUMINT,
    status VARCHAR(20),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(participantTypeId) REFERENCES fairParticipantType(id),
    unique(uploadFileS3ObjectRefId)
);


INSERT INTO fairRegistrationImportTask(taskId, originalFileName, uploadFileS3ObjectRefId, failureReportS3ObjectRefId, fairCode,  fiscalYear, projectYear, actionType, sourceType,  visitorType, participantTypeId, tier, serialNumberStart, numberOfRow, status, createdBy, lastUpdatedBy)
VALUES ('1', '023-02-01 Full Data Export_Visitor_Records_sample.xlsx', '2ce2e235-e316-4e1a-b9c7-b431d9f1a2bd', '76038231-6df3-4cea-afce-38f04edea459', 'hkjewellery', '2022', '2021', 'INSERT_PAST_BUYER', '8', '01', 1,  "GENERAL",  1, 200000,  'UPLOADING',"SYSTEM", "SYSTEM");


CREATE TABLE fairRegistrationImportTaskLog(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    taskId VARCHAR(36),
    rowNumber VARCHAR(10),
    status VARCHAR(20),
    message VARCHAR(150),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);



CREATE TABLE fairRegistrationImportTaskActivityLog(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    taskId VARCHAR(36),
    activityType VARCHAR(20),
    value VARCHAR(150),
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE fairRegistrationDynamicBM(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    fairRegistrationId BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    createdBy VARCHAR(20) NOT NULL,
    creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(20) NOT NULL,
    lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletionTime TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id)
);

-- CREATE TABLE history(
--     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
--     tableId VARCHAR(36),
--     recordId BIGINT UNSIGNED NOT NULL,
--     oldRowData JSON,
--     newRowData JSON,
--     dmlType ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
--     createdBy VARCHAR(20) NOT NULL,
--     creationTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     lastUpdatedBy VARCHAR(20) NOT NULL,
--     lastUpdatedTime TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     deletionTime TIMESTAMP(6) NOT NULL,
--     PRIMARY KEY (id, tableId)
-- );


-- CREATE TRIGGER LOG_HISTORY
-- AFTER UPDATE ON fairRegistration FOR EACH ROW
-- BEGIN
--     INSERT INTO history (
--         NEW.id,
--         JSON_OBJECT(

--         )
--     )
--     VALUES (

--     )
-- END