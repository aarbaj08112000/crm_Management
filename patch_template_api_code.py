import sys

def patch_backend():
    # Update route.js
    with open('app/api/local-templates/route.js', 'r') as f:
        content = f.read()
    
    if "const code = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');" not in content:
        content = content.replace("const name = formData.get('name');",
                                  "const name = formData.get('name');\n    const code = name.toLowerCase().replace(/\\s+/g, '_').replace(/[^a-z0-9_]/g, '');")
        
        content = content.replace("INSERT INTO whatsapp_templates \n      (name, category, language, header_type, header_content, body_content, footer_content, buttons) \n      VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                                  "INSERT INTO whatsapp_templates \n      (name, code, category, language, header_type, header_content, body_content, footer_content, buttons) \n      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        
        content = content.replace("name, \n      category,", "name, \n      code,\n      category,")
        
        with open('app/api/local-templates/route.js', 'w') as f:
            f.write(content)

    # Update [id]/route.js
    with open('app/api/local-templates/[id]/route.js', 'r') as f:
        content = f.read()

    if "const code = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');" not in content:
        content = content.replace("const name = formData.get('name');",
                                  "const name = formData.get('name');\n    const code = name.toLowerCase().replace(/\\s+/g, '_').replace(/[^a-z0-9_]/g, '');")
        
        content = content.replace("SET name = ?, category = ?, language = ?, header_type = ?, header_content = ?, body_content = ?, footer_content = ?, buttons = ?",
                                  "SET name = ?, code = ?, category = ?, language = ?, header_type = ?, header_content = ?, body_content = ?, footer_content = ?, buttons = ?")
        
        content = content.replace("name, \n      category,", "name, \n      code,\n      category,")
        
        with open('app/api/local-templates/[id]/route.js', 'w') as f:
            f.write(content)

patch_backend()
