-- Remove incoming emails that are not associated with any CRM enquiry or sent email response
DELETE FROM email_logs WHERE direction = 'received' AND enquiry_id IS NULL;
