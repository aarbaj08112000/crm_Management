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
