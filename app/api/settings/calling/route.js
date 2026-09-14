import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const keysToFetch = [
      'sync_cloudtelephony_member',
      'cloudtelephony_api_username',
      'cloudtelephony_api_password',
      'calling_asterisk_server',
      'calling_ws_port',
      'calling_sip_username',
      'calling_sip_password'
    ];
    
    // We fetch them dynamically from the config_setting table
    const [rows] = await pool.query(
      'SELECT name, value FROM config_setting WHERE name IN (?)',
      [keysToFetch]
    );

    // Convert rows into a clean key-value object
    const config = {};
    rows.forEach(row => {
      config[row.name] = row.value;
    });

    // Provide default fallbacks just in case the SQL script hasn't been run yet
    const finalConfig = {
      sync_cloudtelephony_member: config.sync_cloudtelephony_member || 'No',
      cloudtelephony_api_username: config.cloudtelephony_api_username || '',
      cloudtelephony_api_password: config.cloudtelephony_api_password || '',
      calling_asterisk_server: config.calling_asterisk_server || 'kenyavoice.rpdigitalphone.com',
      calling_ws_port: config.calling_ws_port || '5000',
      calling_sip_username: config.calling_sip_username || '08485835691',
      calling_sip_password: config.calling_sip_password || 'dpQLCZxL'
    };

    return NextResponse.json(finalConfig);
  } catch (error) {
    console.error('Error fetching calling config:', error);
    return NextResponse.json({ error: 'Failed to fetch calling config' }, { status: 500 });
  }
}
