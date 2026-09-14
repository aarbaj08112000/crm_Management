-- SQL Script to add SIP credentials to user_master

ALTER TABLE user_master 
ADD COLUMN sip_username VARCHAR(100) DEFAULT NULL,
ADD COLUMN sip_password VARCHAR(255) DEFAULT NULL;
