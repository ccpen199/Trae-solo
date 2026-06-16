with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('=== UTF-16码元 vs Unicode码点 差异分析（前500行） ===')
print()

total_code_units = 0  # UTF-16 码元数（TypeScript 编译器使用的）
total_code_points = 0  # Unicode 码点数（某些 IDE 可能使用的）
total_offset = 0
emoji_locations = []

for i, line in enumerate(lines[:500]):
    line_num = i + 1
    line_code_units = 0
    line_code_points = 0
    line_emojis = []
    for j, ch in enumerate(line):
        code_point = ord(ch)
        line_code_points += 1
        if code_point > 0xFFFF:
            line_code_units += 2  # UTF-16 代理对
            line_emojis.append((j, ch, hex(code_point)))
        else:
            line_code_units += 1
    
    line_offset = line_code_units - line_code_points
    total_code_units += line_code_units + 2  # +2 for \r\n or \n?
    total_code_points += line_code_points + 1
    total_offset += line_offset
    
    if line_emojis:
        emoji_locations.append((line_num, len(line_emojis), line_offset, line_emojis[:10]))
        print(f'Line {line_num:3d}: {len(line_emojis)} emoji(s), line_offset={line_offset}, total_offset={total_offset}')
        for pos, ch, cp in line_emojis[:5]:
            print(f'  col {pos:3d}: {ch} ({cp})')

print()
print(f'=== Summary (first 500 lines) ===')
print(f'Total UTF-16 code units offset: {total_offset}')
print(f'Total emojis found: {sum(x[1] for x in emoji_locations)}')
print()

# 检查：如果 IDE 使用 code points 计数，而 TypeScript 使用 code units，
# 那么 IDE 的列号会比实际小 total_offset。
# 但我们观察到的是 IDE 报告的列号 > 实际行长度，这可能意味着...
# 实际上 LSP 协议使用 UTF-16 码元作为偏移量。

# 让我们反过来检查：从第1行到第423行，总共累积了多少偏移
print('=== 第1行到第423行的累积偏移 ===')
cum_offset = 0
target_line = 423
for i, line in enumerate(lines[:target_line]):
    line_num = i + 1
    for ch in line:
        cp = ord(ch)
        if cp > 0xFFFF:
            cum_offset += 1  # 每个非BMP字符多一个UTF-16码元
    cum_offset += 1  # 换行符

print(f'累积偏移（UTF-16码元超出码点的数量）到第{target_line}行开头: {cum_offset}')
print()
print(f'这意味着：如果第423行实际有30个字符，IDE报告 character 74，')
print(f'那么 74 - 30 = 44 的差值需要由累积偏移来解释？')
print(f'但累积偏移只有 {cum_offset}，这还不够...')
print()

# 让我们检查模板字符串是否导致了问题
print('=== 检查多行模板字符串（前500行） ===')
in_template = False
template_start = None
for i, line in enumerate(lines[:500]):
    line_num = i + 1
    for ch in line:
        if ch == '`':
            if not in_template:
                in_template = True
                template_start = (line_num, line.rfind('`'))
            else:
                in_template = False
                if template_start and template_start[0] != line_num:
                    print(f'Multi-line template: lines {template_start[0]}-{line_num}')
                template_start = None

print()
print('=== 检查第170-200行的特殊字符（DEFAULT_CATEGORIES附近） ===')
for i, line in enumerate(lines[169:200]):
    line_num = 170 + i
    escaped = line.encode('unicode_escape').decode('ascii')
    print(f'{line_num:3d}: len={len(line):3d} | {escaped.rstrip()[:100]}')
