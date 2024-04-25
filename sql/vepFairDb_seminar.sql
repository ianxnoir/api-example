CREATE TABLE `vep_fair_service_db`.`vepFairSeminar` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sbeSeminarId` varchar(63) CHARACTER SET utf8 NOT NULL,
  `streamingType` varchar(63) CHARACTER SET utf8 DEFAULT NULL,
  `surveyLink` text COLLATE utf8mb4_unicode_ci,
  `beforeStartTime` int(10) unsigned DEFAULT 0,
  `feedbackFormId` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL
  `registrationFormId` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL
  `pigeonholeSessionId` int(10) unsigned DEFAULT NULL,
  `pigeonholePasscode` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creationTime` timestamp(6) NULL,
  `lastUpdatedAt` timestamp(6) NULL,
  `lastUpdatedBy` varchar(127) CHARACTER SET utf8 DEFAULT NULL,
  `endAt` timestamp(6) NULL,
  PRIMARY KEY (`id`, `sbeSeminarId`),
  UNIQUE KEY `seminarId_UNIQUE` (`sbeSeminarId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `vep_fair_service_db`.`vepFairSeminarKol` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `seminarId` int(10) unsigned NOT NULL,
  `platformType` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `platformId` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `platformUrl` text COLLATE utf8mb4_unicode_ci,
  `playbackVideoId` int(10) unsigned DEFAULT NULL,
  `creationTime` timestamp(6) NULL,
  `lastUpdatedAt` timestamp(6) NULL,
  `lastUpdatedBy` varchar(127) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `vep_fair_service_db`.`vepFairSeminarRating` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sbeSeminarId` varchar(127) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` int(11) NOT NULL DEFAULT '0',
  `lastUpdatedBy` varchar(127) COLLATE utf8mb4_unicode_ci NOT NULL,
  `creationTime` timestamp(6) NULL,
  `lastUpdatedAt` timestamp(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `vep_fair_service_db`.`vepFairSeminarRtmp` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `seminarId` int(10) unsigned NOT NULL,
  `language` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `defaultLanguage` tinyint(4) NOT NULL DEFAULT '0',
  `link` text COLLATE utf8mb4_unicode_ci,
  `key` text COLLATE utf8mb4_unicode_ci,
  `liveUrl` text COLLATE utf8mb4_unicode_ci,
  `playbackVideoId` int(10) unsigned DEFAULT NULL,
  `expiredAt` timestamp(6) NULL DEFAULT NULL,
  `creationTime` timestamp(6) NULL,
  `lastUpdatedBy` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastUpdatedAt` timestamp(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `vep_fair_service_db`.`vepFairSeminarVideo` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `taskId` varchar(127) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transcodeStatus` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `videoStatus` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileName` text COLLATE utf8mb4_unicode_ci,
  `fileUrl` text COLLATE utf8mb4_unicode_ci,
  `creationTime` timestamp(6) NULL,
  `lastUpdatedAt` timestamp(6) NULL,
  `lastUpdatedBy` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `taskId_UNIQUE` (`taskId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `vep_fair_service_db`.`vepFairSeminarVod` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `seminarId` int(10) unsigned NOT NULL,
  `liveVideoId` int(10) unsigned DEFAULT NULL,
  `playbackVideoId` int(10) unsigned DEFAULT NULL,
  `language` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `defaultLanguage` tinyint(4) NOT NULL DEFAULT '0',
  `lastUpdatedBy` varchar(63) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastUpdatedAt` timestamp(6) NULL,
  `creationTime` timestamp(6) NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `vep_fair_service_db`.`vepFairSeminarConnection` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `connectionId` varchar(255) NOT NULL,
  `seminarId` int(10) unsigned DEFAULT NULL,
  `ssoUid` varchar(255) DEFAULT NULL,
  `creationTime` timestamp NULL,
  `disconnectedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;