const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'app/admin/crm/lead-management/view/[id]/page.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Import useApp
if (!content.includes("import { useApp } from '@/context/AppContext';")) {
  content = content.replace("import { cn, formatLeadCode, formatDate } from '@/lib/utils';", "import { cn, formatLeadCode, formatDate } from '@/lib/utils';\nimport { useApp } from '@/context/AppContext';");
}

// 2. Add useApp to LeadDetailsPage
if (!content.includes("const { companySettings } = useApp();")) {
  content = content.replace("const router = useRouter();", "const router = useRouter();\n  const { companySettings } = useApp();");
}

// 3. Fix formatted_id in displayLead
content = content.replace(
  "formatted_id: formatLeadCode(lead.enquiry_id, lead.added_date),",
  "formatted_id: formatLeadCode(lead.enquiry_id, lead.added_date, companySettings),"
);

// 4. Fix breadcrumbs
content = content.replace(
  "Leads <span className=\"mx-2\">›</span> Lead Management <span className=\"mx-2\">›</span> {params.id}",
  "Enquiries <span className=\"mx-2\">›</span> Enquiry Management <span className=\"mx-2\">›</span> {displayLead?.formatted_id || params.id}"
);

fs.writeFileSync(file, content, 'utf8');
console.log('patched');
