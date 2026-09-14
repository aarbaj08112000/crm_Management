import fs from 'fs';
import path from 'path';

const files = [
  'app/page.jsx',
  'app/add/page.jsx',
  'app/test-calling/page.jsx',
  'app/admin/crm/lead-management/view/[id]/page.jsx',
  'app/list/page.jsx',
  'app/test-calling-smartoperator/page.jsx',
  'components/EmailLogDetail.jsx',
  'components/EmailThreadModal.jsx',
  'components/lead-details/EmailsTab.jsx',
  'components/lead-details/ActivitiesTab.jsx',
  'components/lead-details/ScheduledEmailsTab.jsx',
  'components/AddEnquiryForm.jsx',
  'components/EmailModal.jsx',
  'components/UserDetailsDrawer.jsx'
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace all occurrences of 'purple-' with 'blue-'
    const newContent = content.replace(/purple-/g, 'blue-');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
}
