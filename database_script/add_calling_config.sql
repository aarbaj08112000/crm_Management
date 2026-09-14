-- SQL Script to insert Calling & Sync Configurations into the existing config_setting table

INSERT INTO config_setting (name, title, value, description, type, company_id) VALUES
('sync_cloudtelephony_member', 'Sync CloudTelephony Member', 'Yes', 'Enable syncing to CloudTelephony API when users are created', 'input', 0),
('cloudtelephony_api_username', 'CloudTelephony API Username', 'bca821-f5ade1-85d7e2-c28d02-f74c08', 'API Username for CloudTelephony', 'input', 0),
('cloudtelephony_api_password', 'CloudTelephony API Password', '6e7d66-afa96f-c29cae-5e8c41-220dec', 'API Password for CloudTelephony', 'input', 0),
('calling_asterisk_server', 'Asterisk Server Address', 'kenyavoice.rpdigitalphone.com', 'The WebRTC WebSocket Domain', 'input', 0),
('calling_ws_port', 'WebSocket Port', '5000', 'The WebRTC WebSocket Port', 'input', 0),
('calling_sip_username', 'SIP Username', '08485835691', 'The SIP Username (e.g. extension or phone number)', 'input', 0),
('calling_sip_password', 'SIP Password', 'dpQLCZxL', 'The SIP Password for WebRTC connection', 'input', 0);
