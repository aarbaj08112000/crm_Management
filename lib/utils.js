import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatLeadCode(enquiry_id, added_date, settings = {}) {
  const companyCode = settings?.company_code || 'HB';
  const leadCode = settings?.lead_code || 'LD';
  
  let year = new Date().getFullYear().toString();
  let month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  if (added_date) {
    const d = new Date(added_date);
    if (!isNaN(d.getTime())) {
      year = d.getFullYear().toString();
      month = (d.getMonth() + 1).toString().padStart(2, '0');
    }
  }
  
  const paddedId = String(enquiry_id || 0).padStart(5, '0');
  
  return `${companyCode}/${leadCode}/${year}/${month}/${paddedId}`;
}

export function formatDate(isoString, includeTime = true) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  
  const pad = (n) => n.toString().padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  
  if (!includeTime) return `${d}/${m}/${y}`;
  
  let h = date.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  const min = pad(date.getMinutes());
  
  return `${d}/${m}/${y} ${pad(h)}:${min} ${ampm}`;
}
