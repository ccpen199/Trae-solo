#!/usr/bin/env python3
"""全验收测试汇总运行"""
import subprocess, sys

tests = [
    ("acceptance_test.py", "第一轮"),
    ("acceptance_test_round2.py", "第二轮"),
    ("acceptance_test_round3.py", "第三轮"),
    ("acceptance_test_round4.py", "第四轮"),
    ("acceptance_test_round6.py", "第六轮"),
    ("acceptance_test_round7.py", "第七轮"),
]

total_pass = 0
total_total = 0
results = []

for script, name in tests:
    r = subprocess.run([sys.executable, script], capture_output=True, text=True)
    out = r.stdout + r.stderr
    for line in out.split("\n"):
        if "通过: " in line and "/" in line:
            parts = line.split("通过: ")[1].split(" (")[0].split("/")
            p, t = int(parts[0]), int(parts[1])
            total_pass += p
            total_total += t
            ok = "✅" if p == t else "⚠️"
            results.append(f"{ok} {name}: {p}/{t} ({round(p/t*100)}%)")
            break

print("=" * 70)
print("  全轮次验收汇总")
print("=" * 70)
for r in results:
    print(r)
print("-" * 70)
print(f"📊 累计: {total_pass}/{total_total} ({round(total_pass/total_total*100)}%)")
if total_pass == total_total:
    print("🎉 全部验收100%通过！")
else:
    print(f"⚠️  有 {total_total - total_pass} 项未通过")
