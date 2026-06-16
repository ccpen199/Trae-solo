import re

with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到所有 return ( 开始的 JSX 区域
print("=== 寻找 JSX return 区域 ===")
jsx_regions = []
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped.startswith('return ('):
        print(f"Line {i+1}: {stripped[:80]}")
        jsx_regions.append(i)

# 简单检查：在非表达式区域寻找独立的 > 或 <
print("\n=== 检查可能在 JSX 文本中的比较运算符 ===")
# 在第800行之后（可能的JSX区域）检查
for i, line in enumerate(lines[800:], start=801):
    # 检查是否在花括号外有 > 或 < 
    # 简化检查：去掉 {..} 内的内容，看剩余部分是否有 < 或 >
    line_copy = line
    # 移除字符串字面量
    line_copy = re.sub(r'"[^"]*"', '""', line_copy)
    line_copy = re.sub(r"'[^']*'", "''", line_copy)
    line_copy = re.sub(r"`[^`]*`", "``", line_copy)
    
    # 移除 {} 块（简化处理，不处理嵌套）
    line_no_expr = re.sub(r'\{[^{}]*\}', '{}', line_copy)
    
    # 现在在 {} 外查找 < 或 > 且不是标签的一部分
    # 检查形如 "x > y" 或 "x < y" 的模式在 {} 之外
    # 移除 <...> 标签
    line_no_tags = re.sub(r'</?[A-Za-z][^>]*>', '', line_no_expr)
    
    # 剩余内容中的 < 或 > 可能是问题
    chars = set(line_no_tags)
    if '<' in chars or '>' in chars:
        if '{' in line_no_expr or '}' in line_no_expr:
            print(f"Potential issue at line {i}:")
            print(f"  Original: {line.rstrip()}")
            print(f"  No tags:  {line_no_tags.rstrip()}")
            print()

# 检查所有 JSX 中的 return 语句，寻找 > 0, > 9 等可能直接写在文本中的内容
print("\n=== 检查 JSX 文本区域的比较运算符（详细） ===")
# 从第862行（renderProductCard 的 return）开始检查
in_jsx = False
jsx_depth = 0
expr_depth = 0  # {} 嵌套深度

for i, line in enumerate(lines):
    line_num = i + 1
    stripped = line.strip()
    
    # 检测 return ( 或 return <div 开始的 JSX
    if 'return (' in stripped or stripped.startswith('return <'):
        in_jsx = True
        jsx_depth = 0
        # print(f"Enter JSX at line {line_num}")
        continue
    
    if not in_jsx:
        continue
    
    # 分析每一行
    # 处理表达式块 {} 和 JSX 标签 <>
    j = 0
    line_len = len(line)
    in_string = False
    string_char = None
    in_template = False
    
    while j < line_len:
        ch = line[j]
        
        # 字符串处理
        if not in_template and (ch == '"' or ch == "'"):
            if not in_string:
                in_string = True
                string_char = ch
            elif ch == string_char:
                in_string = False
            j += 1
            continue
        
        # 模板字符串处理
        if ch == '`':
            in_template = not in_template
            j += 1
            continue
        
        if in_string or in_template:
            j += 1
            continue
        
        # 处理花括号
        if ch == '{':
            expr_depth += 1
            j += 1
            continue
        if ch == '}':
            if expr_depth > 0:
                expr_depth -= 1
            j += 1
            continue
        
        # 处理尖括号（仅当不在表达式内时检查）
        if expr_depth == 0:
            # 检查 < 是否是 JSX 标签开始
            if ch == '<':
                # 看看后面的字符是否是合法标签名或 /
                next_ch = line[j+1] if j+1 < line_len else ''
                if next_ch.isalpha() or next_ch == '/' or next_ch == '!':
                    jsx_depth += 1
                else:
                    print(f"WARNING line {line_num} col {j+1}: Potentially unescaped '<' in JSX text!")
                    print(f"  Line: {line.rstrip()}")
                j += 1
                continue
            
            if ch == '>':
                if jsx_depth > 0:
                    jsx_depth -= 1
                else:
                    print(f"WARNING line {line_num} col {j+1}: Potentially unescaped '>' in JSX text!")
                    print(f"  Line: {line.rstrip()}")
                j += 1
                continue
        
        j += 1
    
    # 如果检测到独立的 ); 可能是 JSX 结束
    if stripped == ');' and jsx_depth == 0 and expr_depth == 0:
        # print(f"Exit JSX at line {line_num}")
        in_jsx = False

print("\n=== JSX 检查完成 ===")
