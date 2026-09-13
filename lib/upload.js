import path from 'path';

/**
 * Returns the base directory for storing uploads.
 * If UPLOAD_STORAGE_PATH is defined in the environment, it uses that (e.g. /var/www/uploads)
 * Otherwise, it falls back to the default Next.js public directory (e.g. process.cwd()/public)
 */
export function getBaseUploadDir() {
  if (process.env.UPLOAD_STORAGE_PATH) {
    return process.env.UPLOAD_STORAGE_PATH;
  }
  return path.join(process.cwd(), 'public');
}


