with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

print('=== 模板字符串（反引号）分析 ===')
in_backtick = False
backtick_start = None
count = 0

for i, line in enumerate(lines):
    line_num = i + 1
    j = 0
    in_string_dq = False
    in_string_sq = False
    while j < len(line):
        ch = line[j]
        
        if ch == '\\' and j + 1 < len(line):
            j += 2
            continue
        
        if ch == '"' and not in_string_sq and not in_backtick:
            in_string_dq = not in_string_dq
            j += 1
            continue
        
        if ch == "'" and not in_string_dq and not in_backtick:
            in_string_sq = not in_string_sq
            j += 1
            continue
        
        if ch == '`' and not in_string_dq and not in_string_sq:
            count += 1
            if in_backtick:
                in_backtick = False
                backtick_start = None
            else:
                in_backtick = True
                backtick_start = (line_num, j + 1)
            j += 1
            continue
        
        j += 1

if in_backtick:
    print(f'WARNING: Unclosed template string starting at line {backtick_start[0]}, col {backtick_start[1]}')
else:
    print(f'Total backticks found: {count}, pairs: {count // 2}, balanced: {count % 2 == 0}')

print()
print('=== 检查花括号/方括号/圆括号平衡（整体） ===')
def check_balance(text, name, open_ch, close_ch):
    depth = 0
    max_depth = 0
    in_string_dq = False
    in_string_sq = False
    in_backtick = False
    issues = []
    for i, line in enumerate(lines):
        line_num = i + 1
        j = 0
        while j < len(line):
            ch = line[j]
            if ch == '\\' and j + 1 < len(line):
                j += 2
                continue
            if ch == '"' and not in_string_sq and not in_backtick:
                in_string_dq = not in_string_dq
            elif ch == "'" and not in_string_dq and not in_backtick:
                in_string_sq = not in_string_sq
            elif ch == '`' and not in_string_dq and not in_string_sq:
                in_backtick = not in_backtick
            elif not in_string_dq and not in_string_sq and not in_backtick:
                if ch == open_ch:
                    depth += 1
                    max_depth = max(max_depth, depth)
                elif ch == close_ch:
                    depth -= 1
                    if depth < 0:
                        issues.append((line_num, f'Unexpected {close_ch}'))
            j += 1
    status = 'OK' if depth == 0 and not issues else f'ISSUES (depth={depth}, {len(issues)} problems)'
    print(f'{name}: max_depth={max_depth}, final_depth={depth}, status={status}')
    if issues:
        for ln, msg in issues[:5]:
            print(f'  Line {ln}: {msg}')

check_balance(content, 'Curly braces {}', '{', '}')
check_balance(content, 'Square brackets []', '[', ']')
check_balance(content, 'Parentheses ()', '(', ')')
