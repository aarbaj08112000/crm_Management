import { pool } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function logActivity({ userId, req, action, module, recordId = null, description }) {
  try {
    let uid = userId;
    
    // Try to extract userId from request token if not explicitly provided
    if (!uid && req) {
      const token = req.cookies.get('token')?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(token, JWT_SECRET);
          uid = payload.userId;
        } catch(e) {}
      }
    }

    const sql = `
      INSERT INTO activity_logs (user_id, action, module, record_id, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(sql, [
      uid || null, 
      action, 
      module, 
      recordId || null, 
      description || ''
    ]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
