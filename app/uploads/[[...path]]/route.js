import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getBaseUploadDir } from '@/lib/upload';

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export async function GET(req, { params }) {
  try {
    const pathArray = params.path || [];
    if (pathArray.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Security check: prevent directory traversal
    const safePath = path.normalize(pathArray.join('/')).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // Construct the absolute path
    const filePath = path.join(getBaseUploadDir(), 'uploads', safePath);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine the content type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving upload file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
