import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { tokenGenerate } from '@vonage/jwt';
import fs from 'fs';
import path from 'path';

async function processRecording(event) {
  try {
    console.log('Vonage Recording Event:', event);

    const recordingUrl = event.recording_url;
    const conversationUuid = event.conversation_uuid;
    const recordingUuid = event.recording_uuid;

    if (!recordingUrl || !conversationUuid) {
      return NextResponse.json({ success: false, error: 'Missing recording data' }, { status: 400 });
    }

    // Generate JWT to download the recording
    const privateKey = process.env.VONAGE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    const applicationId = process.env.VONAGE_APPLICATION_ID;

    const token = tokenGenerate(applicationId, privateKey, {
      expire: Math.round(new Date().getTime() / 1000) + 300 // 5 minutes
    });

    // Download the recording
    const response = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'recordings');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save the file
    const fileName = `vonage_${recordingUuid}.mp3`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    const localRecordingUrl = `/uploads/recordings/${fileName}`;

    // Update the database (use parent_call_sid which is conversation_uuid)
    await pool.query(
      `UPDATE call_logs 
       SET recording_sid = ?, recording_url = ?, recording_duration = ? 
       WHERE twilio_call_sid = ? OR parent_call_sid = ?`,
      [recordingUuid, localRecordingUrl, event.size || 0, conversationUuid, conversationUuid]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vonage recording process error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const event = await request.json();
    return await processRecording(event);
  } catch (error) {
    console.error('Vonage recording POST error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event = Object.fromEntries(searchParams.entries());
    return await processRecording(event);
  } catch (error) {
    console.error('Vonage recording GET error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
