import urllib.request
import json

apis = [
    ("楼盘列表", "http://127.0.0.1:59187/api/properties?page=1&pageSize=2"),
    ("楼盘统计", "http://127.0.0.1:59187/api/properties/stats/summary"),
    ("热力图", "http://127.0.0.1:59187/api/map/heatmap?type=price"),
    ("地铁站点", "http://127.0.0.1:59187/api/map/subway"),
    ("学区", "http://127.0.0.1:59187/api/map/schools"),
    ("管家-需求", "http://127.0.0.1:59187/api/butler/requirements"),
    ("管家-顾问", "http://127.0.0.1:59187/api/butler/consultants"),
    ("市场概览", "http://127.0.0.1:59187/api/operation/data/market-overview"),
    ("前端代理-健康", "http://127.0.0.1:49187/api/health"),
    ("前端代理-统计", "http://127.0.0.1:49187/api/properties/stats/summary"),
]

print("=" * 60)
print("API 验收报告")
print("=" * 60)

all_ok = True
for name, url in apis:
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read())
            ok = data.get("success", False)
            d = data.get("data", None)
            info = ""
            if isinstance(d, dict):
                keys = list(d.keys())
                info = f"dict(keys={keys[:6]})"
            elif isinstance(d, list):
                info = f"list(count={len(d)})"
            else:
                info = str(type(d).__name__)
            status = "✓" if ok else "✗"
            print(f"[{status}] {name:12s} success={ok}  {info}")
            if not ok:
                all_ok = False
    except Exception as e:
        print(f"[✗] {name:12s} 错误: {e}")
        all_ok = False

print("=" * 60)
result_text = "全部通过 ✓" if all_ok else "存在异常 ✗"
print(f"结果: {result_text}")
print("=" * 60)
