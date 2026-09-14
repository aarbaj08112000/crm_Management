-- SQL Script to add is_synced tracking to user_master

ALTER TABLE user_master 
ADD COLUMN is_synced BOOLEAN DEFAULT FALSE;
