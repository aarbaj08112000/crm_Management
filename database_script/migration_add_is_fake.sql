-- =====================================================================
-- Migration Script: Add is_fake column to ai_contacts
-- =====================================================================

ALTER TABLE ai_contacts ADD COLUMN is_fake TINYINT DEFAULT 0;
