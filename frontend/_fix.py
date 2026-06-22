import os
import re

base = '/Users/chen/Documents/trae_projects/local_projects/may-89306/frontend/src'
f = os.path.join(base, 'pages/worker/Dashboard.tsx')
print('File exists:', os.path.exists(f))

with open(f) as fp:
    c = fp.read()
print('Has bodyStyle:', 'bodyStyle=' in c)
print('Has styles={{ body:', 'styles={{ body:' in c)

if 'bodyStyle=' in c:
    print('Found bodyStyle, fixing...')
    def replace_bodyStyle(match):
        inner = match.group(1)
        return 'styles={{ body: ' + inner + ' }}'
    pattern = r'bodyStyle=(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})'
    new_c = re.sub(pattern, replace_bodyStyle, c)
    with open(f, 'w') as fp:
        fp.write(new_c)
    print('Fixed.')
