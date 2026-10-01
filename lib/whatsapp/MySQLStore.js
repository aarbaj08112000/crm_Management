const fs = require('fs');
const archiver = require('archiver');
const unzipper = require('unzipper');
const path = require('path');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Root@123',
  database: process.env.MYSQL_DATABASE || 'enquiry_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

class MySQLStore {
    constructor({ session }) {
        this.session = session || 'default';
    }

    async sessionExists({ session }) {
        const sessionId = session || this.session;
        const [rows] = await pool.execute('SELECT session_name FROM whatsapp_sessions WHERE session_name = ?', [sessionId]);
        return rows.length > 0;
    }

    async save({ session }) {
        const sessionId = session || this.session;
        // RemoteAuth creates a zip file at .wwebjs_auth/<session>.zip
        const zipFile = path.join(process.cwd(), '.wwebjs_auth', `${sessionId}.zip`);
        
        try {
            const sessionData = fs.readFileSync(zipFile);
            await pool.execute(
                'INSERT INTO whatsapp_sessions (session_name, session_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE session_data = ?',
                [sessionId, sessionData, sessionData]
            );
        } catch (error) {
            console.error('MySQLStore save error:', error);
            throw error;
        }
    }

    async extract({ session, path: extractPath }) {
        const sessionId = session || this.session;
        const [rows] = await pool.execute('SELECT session_data FROM whatsapp_sessions WHERE session_name = ?', [sessionId]);
        if (rows.length === 0) throw new Error('Session not found in DB');

        const sessionData = rows[0].session_data;
        // RemoteAuth expects the store to write the zip file to `extractPath`
        const dir = path.dirname(extractPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(extractPath, sessionData);
    }

    async delete({ session }) {
        const sessionId = session || this.session;
        await pool.execute('DELETE FROM whatsapp_sessions WHERE session_name = ?', [sessionId]);
    }
}

module.exports = MySQLStore;
