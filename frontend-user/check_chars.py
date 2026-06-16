import re

with open('src/pages/Home.tsx', 'rb') as f:
    data = f.read()

# 检查常见的零宽字符
suspicious = {
    b'\xe2\x80\x8b': 'U+200B ZERO WIDTH SPACE',
    b'\xe2\x80\x8c': 'U+200C ZERO WIDTH NON-JOINER',
    b'\xe2\x80\x8d': 'U+200D ZERO WIDTH JOINER',
    b'\xef\xbb\xbf': 'U+FEFF BOM/ZERO WIDTH NO-BREAK SPACE',
    b'\xc2\xa0': 'U+00A0 NON-BREAKING SPACE',
}

found = False
for pattern, name in suspicious.items():
    positions = []
    start = 0
    while True:
        idx = data.find(pattern, start)
        if idx == -1:
            break
        line_num = data[:idx].count(b'\n') + 1
        positions.append(line_num)
        start = idx + 1
    if positions:
        print(f'Found {name} at lines: {positions[:30]}')
        found = True

if not found:
    print('No zero-width or suspicious Unicode characters found.')

# 统计总行数
print(f'Total lines: {data.count(b"\n") + 1}')

# 检查第425行 (1-based) 的长度和内容
lines = data.split(b'\n')
if len(lines) >= 425:
    line_425 = lines[424]  # 0-based
    print(f'Line 425 (1-based) length: {len(line_425)} bytes')
    print(f'Line 425 content repr: {repr(line_425[:150])}')

if len(lines) >= 683:
    line_683 = lines[682]
    print(f'Line 683 (1-based) length: {len(line_683)} bytes')
    print(f'Line 683 content repr: {repr(line_683[:150])}')

# 检查第734行和第781行
if len(lines) >= 734:
    line_734 = lines[733]
    print(f'Line 734 (1-based) length: {len(line_734)} bytes')
    print(f'Line 734 content repr: {repr(line_734[:150])}')

if len(lines) >= 781:
    line_781 = lines[780]
    print(f'Line 781 (1-based) length: {len(line_781)} bytes')
    print(f'Line 781 content repr: {repr(line_781[:150])}')
