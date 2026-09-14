import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req, { params }) {
  try {
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user details
    const [userRows] = await pool.query('SELECT user_name, email, mobile, role, status, is_synced FROM user_master WHERE user_id = ?', [userId]);
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userRows[0];

    if (user.is_synced) {
      return NextResponse.json({ error: 'User is already synced' }, { status: 400 });
    }

    // Fetch CloudTelephony credentials
    const [configRows] = await pool.query(
      "SELECT name, value FROM config_setting WHERE name IN ('cloudtelephony_api_username', 'cloudtelephony_api_password')"
    );
    const sysConfig = {};
    configRows.forEach(r => sysConfig[r.name] = r.value);

    const apiUser = sysConfig.cloudtelephony_api_username;
    const apiPass = sysConfig.cloudtelephony_api_password;
    
    if (!apiUser || !apiPass) {
      return NextResponse.json({ error: 'CloudTelephony API credentials missing from configuration' }, { status: 500 });
    }

    // Trigger API
    const formData = new URLSearchParams();
    formData.append('member_name', user.user_name || user.email);
    formData.append('member_num', user.mobile);
    formData.append('access', user.role === 'admin' ? '1' : '2'); // 1 = Admin, 2 = Regular
    formData.append('active', user.status !== undefined ? user.status.toString() : '1');

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
      return NextResponse.json({ error: `Sync failed with status ${syncRes.status}` }, { status: syncRes.status });
    }

    // Mark as synced
    await pool.query('UPDATE user_master SET is_synced = 1 WHERE user_id = ?', [userId]);

    return NextResponse.json({ success: true, message: 'User synced successfully' });

  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}
