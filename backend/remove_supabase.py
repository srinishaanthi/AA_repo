import os
import glob
import re
import json

base_dir = r"d:\a&a Logistics\logistics"
src_dir = os.path.join(base_dir, "src")

# 1. Update package.json
package_json_path = os.path.join(base_dir, "package.json")
if os.path.exists(package_json_path):
    with open(package_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if 'dependencies' in data and '@supabase/supabase-js' in data['dependencies']:
        del data['dependencies']['@supabase/supabase-js']
    with open(package_json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

# 2. Rename supabase.ts to api.ts
old_lib = os.path.join(src_dir, "lib", "supabase.ts")
new_lib = os.path.join(src_dir, "lib", "api.ts")

if os.path.exists(old_lib):
    with open(old_lib, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Change export from supabase to api
    content = content.replace("export const supabase = {", "export const api = {")
    
    with open(new_lib, 'w', encoding='utf-8') as f:
        f.write(content)
    
    os.remove(old_lib)

# 3. Process all TS and TSX files
for filepath in glob.glob(os.path.join(src_dir, "**", "*.*"), recursive=True):
    if filepath.endswith(".ts") or filepath.endswith(".tsx"):
        if filepath == new_lib:
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replacements
        new_content = content
        
        # Imports handling (could be relative like ../../lib/supabase or ../lib/supabase)
        new_content = re.sub(r"import\s+\{\s*supabase\s*\}\s+from\s+['\"](.*)lib/supabase['\"];?", r"import { api } from '\1lib/api';", new_content)
        
        # Usage handling
        new_content = new_content.replace("supabase.from", "api.from")
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

print("Supabase completely removed and replaced with 'api'!")
