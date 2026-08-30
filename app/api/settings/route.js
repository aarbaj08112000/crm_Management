import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM company_settings ORDER BY id ASC LIMIT 1');
    if (rows.length === 0) {
      return NextResponse.json({
        company_code: 'HB',
        lead_code: 'LD',
        project_name: 'EnquiryPro',
        company_name: 'My Company'
      });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { company_code, lead_code, project_name, company_name } = data;

    const [existing] = await pool.query('SELECT id FROM company_settings LIMIT 1');
    
    if (existing.length > 0) {
      await pool.query(
        'UPDATE company_settings SET company_code = ?, lead_code = ?, project_name = ?, company_name = ? WHERE id = ?',
        [company_code, lead_code, project_name, company_name, existing[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO company_settings (company_code, lead_code, project_name, company_name) VALUES (?, ?, ?, ?)',
        [company_code, lead_code, project_name, company_name]
      );
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
