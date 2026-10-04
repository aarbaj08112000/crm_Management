import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

function getBaseUploadDir() {
  return process.cwd();
}

async function getDb() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Root@12345678',
    database: process.env.DB_NAME || 'enquiry_db'
  });
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const db = await getDb();
    await db.query('DELETE FROM whatsapp_templates WHERE id = ?', [id]);
    await db.end();
    
    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const formData = await req.formData();
    
    const name = formData.get('name');
    const code = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const category = formData.get('category') || 'MARKETING';
    const language = formData.get('language') || 'en';
    const header_type = formData.get('header_type') || 'none';
    const body_content = formData.get('body_content');
    const footer_content = formData.get('footer_content');
    const buttons = formData.get('buttons');
    
    let header_content = formData.get('header_content');
    const attachment = formData.get('attachment');
    
    if (!id || !name || !body_content) {
      return NextResponse.json({ success: false, error: 'ID, Name and body content are required' }, { status: 400 });
    }

    // Handle file upload if present
    if (attachment && typeof attachment.arrayBuffer === 'function') {
      const uploadDir = path.join(getBaseUploadDir(), 'public', 'uploads', 'templates');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const buffer = Buffer.from(await attachment.arrayBuffer());
      const originalFilename = attachment.name || 'attachment';
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      fs.writeFileSync(path.join(uploadDir, uniqueName), buffer);
      header_content = `/uploads/templates/${uniqueName}`;
    }

    const db = await getDb();
    const query = `
      UPDATE whatsapp_templates 
      SET name = ?, code = ?, category = ?, language = ?, header_type = ?, header_content = ?, body_content = ?, footer_content = ?, buttons = ?
      WHERE id = ?
    `;
    const values = [
      name, 
      code,
      category, 
      language, 
      header_type, 
      header_content || null, 
      body_content, 
      footer_content || null, 
      buttons ? buttons : null,
      id
    ];
    
    await db.query(query, values);
    await db.end();
    
    return NextResponse.json({ success: true, message: 'Template updated successfully' });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
