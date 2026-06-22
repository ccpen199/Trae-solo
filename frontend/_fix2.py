import re
import os

files = [
    'pages/worker/Wages.tsx',
    'pages/worker/Attendance.tsx',
    'pages/worker/Services.tsx',
    'pages/worker/Settings.tsx',
    'pages/worker/JobList.tsx',
    'pages/worker/Dashboard.tsx',
    'pages/worker/Craftsman.tsx',
    'pages/worker/Certificates.tsx',
    'pages/worker/Applications.tsx',
    'pages/enterprise/WorkerManagement.tsx',
    'pages/enterprise/WagePayment.tsx',
    'pages/enterprise/Settings.tsx',
    'pages/enterprise/JobManagement.tsx',
    'pages/enterprise/Guarantee.tsx',
    'pages/enterprise/ContractManagement.tsx',
]

base_dir = '/Users/chen/Documents/trae_projects/local_projects/may-89306/frontend/src'

for fpath in files:
    full_path = os.path.join(base_dir, fpath)
    if not os.path.exists(full_path):
        print(f'SKIP: {fpath}')
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix pattern: styles={ body: {{ xxx }} } or styles={ body: { xxx }}
    # Should be: styles={{ body: { xxx } }}
    
    # First, let's find all occurrences and print them
    occurrences = re.findall(r'styles=\{[^}]*body:', content)
    if occurrences:
        print(f'\n=== {fpath} ===')
        for o in occurrences[:3]:
            print(f'  Found: {o[:80]}')
    
    # Fix 1: styles={ body: {{ xxx }} } -> styles={{ body: { xxx } }}
    # This handles the case where we have double braces inside
    content = re.sub(
        r'styles=\{\s*body:\s*\{\{(.*?)\}\}\s*\}',
        r'styles={{ body: {\1} }}',
        content,
        flags=re.DOTALL
    )
    
    # Fix 2: styles={ body: { xxx } } -> styles={{ body: { xxx } }}
    # Handles single braces inside
    content = re.sub(
        r'styles=\{\s*body:\s*(\{.*?\})\s*\}',
        r'styles={{ body: \1 }}',
        content,
        flags=re.DOTALL
    )
    
    # Fix 3: styles={{ body: {{ xxx }} }} -> styles={{ body: { xxx } }}
    # In case the outer braces were already correct but inner are doubled
    content = re.sub(
        r'styles=\{\{\s*body:\s*\{\{(.*?)\}\}\s*\}\}',
        r'styles={{ body: {\1} }}',
        content,
        flags=re.DOTALL
    )
    
    if content != original:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  -> FIXED')
    else:
        print(f'  -> NO CHANGE')
