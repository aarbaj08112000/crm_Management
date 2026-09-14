import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT user_id, user_name as name, email, mobile, role, status, image, is_synced, sip_username, sip_password, calling_enabled FROM user_master');
    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, mobile, password, role, image, status, sip_username, sip_password, calling_enabled } = body;
    let roleId = null;
    if (role) {
      const [roles] = await pool.query('SELECT id FROM roles WHERE LOWER(name) = LOWER(?)', [role]);
      if (roles.length > 0) {
        roleId = roles[0].id;
      }
    }

    const [result] = await pool.query(
      'INSERT INTO user_master (user_name, email, mobile, password, role, role_id, status, image, sip_username, sip_password, calling_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, mobile, password, role || 'user', roleId, status !== undefined ? status : 1, image || null, sip_username || null, sip_password || null, calling_enabled ? 1 : 0]
    );

    await logActivity({
      req,
      action: 'Create User',
      module: 'User Management',
      recordId: result.insertId,
      description: `Created new user ${name || email}`
    });

    // Sync to CloudTelephony API if enabled
    const [configRows] = await pool.query(
      "SELECT name, value FROM config_setting WHERE name IN ('sync_cloudtelephony_member', 'cloudtelephony_api_username', 'cloudtelephony_api_password')"
    );
    const sysConfig = {};
    configRows.forEach(r => sysConfig[r.name] = r.value);

    if (sysConfig.sync_cloudtelephony_member === 'Yes') {
      try {
        const apiUser = sysConfig.cloudtelephony_api_username;
        const apiPass = sysConfig.cloudtelephony_api_password;
        
        if (apiUser && apiPass) {
          // Construct the payload as per the screenshot
          const formData = new URLSearchParams();
          formData.append('member_name', name || email);
          formData.append('member_num', mobile);
          formData.append('access', role === 'admin' ? '1' : '2'); // 1 = Admin, 2 = Regular
          formData.append('active', status !== undefined ? status.toString() : '1');

          // Basic Auth header encoding
          const basicAuth = Buffer.from(`${apiUser}:${apiPass}`).toString('base64');

          const syncRes = await fetch('https://indiavoice.rpdigitalphone.com/api_v3/addmember_v2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${basicAuth}`
            },
            body: formData.toString()
          });
          
          if (!syncRes.ok) {
            console.error('CloudTelephony Sync failed with status:', syncRes.status);
          } else {
            const syncData = await syncRes.text();
            console.log('CloudTelephony Sync Response:', syncData);
            
            // Mark user as synced in the database
            await pool.query('UPDATE user_master SET is_synced = 1 WHERE user_id = ?', [result.insertId]);
          }
        } else {
          console.error('CloudTelephony Sync is enabled but API credentials are missing from config_setting');
        }
      } catch (e) {
        console.error('Failed to sync to CloudTelephony API:', e);
      }
    }

    return NextResponse.json({ id: result.insertId, message: 'User created successfully' });
  } catch (err) {
    console.error('Create user error:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
