import sys

def patch_frontend():
    with open('app/whatsapp-templates/page.jsx', 'r') as f:
        content = f.read()

    # Find the input onChange for template name and replace it to remove the regex
    old_input_logic = "onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value.replace(/\\s+/g, '_').toLowerCase()})}"
    new_input_logic = "onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})}"

    if old_input_logic in content:
        content = content.replace(old_input_logic, new_input_logic)
        with open('app/whatsapp-templates/page.jsx', 'w') as f:
            f.write(content)
        print("Patched app/whatsapp-templates/page.jsx successfully")
    else:
        print("Could not find the onChange for template name.")

patch_frontend()
