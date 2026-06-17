const fs = require('fs');

let content = fs.readFileSync('app/whatsapp/page.jsx', 'utf8');

// Add Suspense wrap if we useSearchParams?
// Actually we can just do window.location.search in useEffect
const effectContent = `
  useEffect(() => {
    fetchContacts().then(() => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const phoneParam = params.get('phone');
        const nameParam = params.get('name') || 'New Contact';

        if (phoneParam) {
          // Check if contact already exists
          fetch('/api/whatsapp/contacts').then(r => r.json()).then(data => {
            const contacts = data.contacts || [];
            const existing = contacts.find(c => c.phone === phoneParam || c.phone === phoneParam.replace(/^\\+/, ''));
            if (existing) {
              setActiveChatId(existing.id);
            } else {
              // Create new contact
              fetch('/api/whatsapp/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameParam, phone: phoneParam })
              }).then(r => r.json()).then(res => {
                if (res.success) {
                  fetchContacts().then(() => {
                    setActiveChatId(res.contactId);
                  });
                }
              });
            }
            // Remove params from URL so it doesn't run again on refresh
            window.history.replaceState({}, '', '/whatsapp');
          });
        }
      }
    });
  }, []);
`;
content = content.replace('  useEffect(() => {\n    fetchContacts();\n  }, []);', effectContent);

fs.writeFileSync('app/whatsapp/page.jsx', content);
