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
        print(f'SKIP (not found): {fpath}')
        continue
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'bodyStyle=' not in content:
        print(f'NO CHANGE: {fpath}')
        continue
    
    original = content
    
    def replace_bodyStyle(match):
        inner = match.group(1)
        return f'styles={{ body: {inner} }}'
    
    pattern = r'bodyStyle=(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})'
    content = re.sub(pattern, replace_bodyStyle, content)
    
    if content != original:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'FIXED: {fpath}')
    else:
        print(f'NO MATCH: {fpath}')
