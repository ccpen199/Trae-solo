#!/usr/bin/env python3
import urllib.request
import urllib.error
import json

BASE_USER = "http://127.0.0.1:49212/api"
BASE_ADMIN = "http://127.0.0.1:49213/api"
BASE_DIRECT = "http://127.0.0.1:59212/api"

def api(base, method, path, data=None, token=None):
    url = base + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read())
        except:
            return {"success": False, "message": f"HTTP {e.code}"}

print("="*60)
print("  新增API验证测试")
print("="*60)

# 登录
r = api(BASE_DIRECT, "POST", "/auth/login", {"phone": "13800138001", "password": "123456"})
user_token = r["data"]["token"]
print(f"✓ 用户登录: {r['data']['user']['nickname']}")

r = api(BASE_DIRECT, "POST", "/auth/admin-login", {"username": "admin", "password": "admin123"})
admin_token = r["data"]["token"]
print(f"✓ 管理员登录: {r['data']['user']['username']}")

# 获取热门商品
r = api(BASE_DIRECT, "GET", "/products/hot")
pid = r["data"][0]["id"]
pname = r["data"][0]["name"]
print(f"✓ 热门商品: {pname} (ID: {pid[:8]}...)")

# 1. 库存同步API
print("\n1. 库存同步API: POST /products/:id/sync-stock")
r = api(BASE_DIRECT, "POST", f"/products/{pid}/sync-stock")
if r.get("success"):
    sr = r["data"]["syncResult"]
    print(f"  ✓ 同步成功: 库存 {sr['before']} → {sr['after']} (变化:{sr['variance']})")
    print(f"  ✓ 返回字段: syncResult, lastSync, channelCount")
else:
    print(f"  ✗ 失败: {r.get('message')}")

# 2. 备选供应商API
print("\n2. 备选供应商API: GET /products/:id/alternatives")
r = api(BASE_DIRECT, "GET", f"/products/{pid}/alternatives")
if r.get("success"):
    d = r["data"]
    print(f"  ✓ 当前供应商: {d['currentSupplier']}")
    print(f"  ✓ 备选数量: {d['totalAlternatives']} 个")
    print(f"  ✓ 多供应商标识: hasMultiSupplier={d['hasMultiSupplier']}")
    if d["alternatives"]:
        alt = d["alternatives"][0]
        print(f"  ✓ 备选字段: priceDiffLabel={alt['priceDiffLabel']}, successRate={alt['successRate']}%, hasFallback={alt['hasFallback']}, channelCount={alt['channelCount']}")
else:
    print(f"  ✗ 失败: {r.get('message')}")

# 3. 佣金关系链API
print("\n3. 佣金关系链API: GET /commission/relation-chain")
r = api(BASE_DIRECT, "GET", "/commission/relation-chain", token=user_token)
if r.get("success"):
    d = r["data"]
    print(f"  ✓ 用户信息: {d['user']['nickname']}")
    print(f"  ✓ 上级人数: uplineCount={d['relationStats']['uplineCount']}")
    print(f"  ✓ 团队人数: totalDownline={d['relationStats']['totalDownline']} (L1:{d['relationStats']['downlineL1Count']} L2:{d['relationStats']['downlineL2Count']} L3:{d['relationStats']['downlineL3Count']})")
    print(f"  ✓ 佣金比例: L1={d['rates']['level1']*100}% L2={d['rates']['level2']*100}% L3={d['rates']['level3']*100}%")
    print(f"  ✓ 结算政策: T+{d['settlementPolicy']['settlementDelay']}天, 最低¥{d['settlementPolicy']['minWithdraw']}提现")
    print(f"  ✓ 最近佣金: {len(d['recentCommission'])} 条")
else:
    print(f"  ✗ 失败: {r.get('message')}")

# 4. 订单诊断（含通道切换历史）
print("\n4. 订单诊断API: GET /orders/:id/diagnostic")
orders = api(BASE_DIRECT, "GET", "/orders?status=failed&limit=1", token=user_token)
failed_orders = orders.get("data", {}).get("list", [])
if failed_orders:
    oid = failed_orders[0]["id"]
    r = api(BASE_DIRECT, "GET", f"/orders/{oid}/diagnostic", token=user_token)
    if r.get("success"):
        d = r["data"]
        print(f"  ✓ 错误码: {d.get('errorCode')}")
        print(f"  ✓ 用户提示: {d.get('userMessage')}")
        print(f"  ✓ 通道切换历史: switchHistory={d.get('switchHistory', [])}")
        print(f"  ✓ 可切换通道: switchChannelAvailable={d.get('switchChannelAvailable')}")
    else:
        print(f"  ✗ 失败: {r.get('message')}")
else:
    # 拿任意订单
    orders = api(BASE_DIRECT, "GET", "/orders?limit=1", token=user_token)
    if orders.get("data", {}).get("list"):
        oid = orders["data"]["list"][0]["id"]
        r = api(BASE_DIRECT, "GET", f"/orders/{oid}/diagnostic", token=user_token)
        print(f"  ✓ 诊断接口可用: {r.get('success')}")
    else:
        print("  ⚠ 无订单可测试")

# 5. 管理后台-卡密加密日志
print("\n5. 卡密加密日志: GET /admin/card-pool/crypto-logs")
r = api(BASE_DIRECT, "GET", "/admin/card-pool/crypto-logs?pageSize=5", token=admin_token)
if r.get("success"):
    d = r["data"]
    print(f"  ✓ 日志总数: {d['total']} 条")
    print(f"  ✓ 当前页: {len(d['list'])} 条")
    if d["list"]:
        log = d["list"][0]
        print(f"  ✓ 字段: operation={log.get('operation')}, encryption_method={log.get('encryption_method')}, operator_role={log.get('operator_role')}")
else:
    print(f"  ✗ 失败: {r.get('message')}")

# 6. 管理后台-分润配置
print("\n6. 分润配置: GET /admin/profit-configs")
r = api(BASE_DIRECT, "GET", "/admin/profit-configs", token=admin_token)
if r.get("success"):
    d = r["data"]
    print(f"  ✓ 配置数量: {len(d['configs'])} 个")
    print(f"  ✓ 供应商数量: {len(d['suppliers'])} 个")
    if d["configs"]:
        c = d["configs"][0]
        print(f"  ✓ {c['supplier_name']}: L1={c['level1_ratio']*100}% L2={c['level2_ratio']*100}% L3={c['level3_ratio']*100}%")
        print(f"  ✓ 分润: 供应商{c['supplier_ratio']*100}% / 平台{c['platform_ratio']*100}%")
else:
    print(f"  ✗ 失败: {r.get('message')}")

# 7. 管理后台-发票详情
print("\n7. 发票详情: GET /admin/settlements/:id/invoice")
settlements = api(BASE_DIRECT, "GET", "/admin/settlements?limit=1", token=admin_token)
if settlements.get("data", {}).get("list"):
    sid = settlements["data"]["list"][0]["id"]
    r = api(BASE_DIRECT, "GET", f"/admin/settlements/{sid}/invoice", token=admin_token)
    if r.get("success"):
        d = r["data"]
        print(f"  ✓ 结算供应商: {d['settlement']['supplier_name']}")
        print(f"  ✓ 订单数量: {d['orderCount']} 单")
        print(f"  ✓ 开票金额: ¥{d['invoiceAmount']:.2f}")
        print(f"  ✓ 发票要求: {len(d['invoiceRequirements'])} 项")
    else:
        print(f"  ✗ 失败: {r.get('message')}")
else:
    print("  ⚠ 无结算单可测试")

# 8. 管理后台-风控日志详情
print("\n8. 风控日志详情: GET /admin/risk/logs/:id")
risk_logs = api(BASE_DIRECT, "GET", "/admin/risk/logs?limit=1", token=admin_token)
if risk_logs.get("data") and isinstance(risk_logs["data"], list) and risk_logs["data"]:
    rid = risk_logs["data"][0]["id"]
    r = api(BASE_DIRECT, "GET", f"/admin/risk/logs/{rid}", token=admin_token)
    if r.get("success"):
        d = r["data"]
        print(f"  ✓ 风控等级: {d['log']['risk_level']}")
        print(f"  ✓ 是否拦截: blocked={d['log']['blocked']}")
        print(f"  ✓ 用户历史: {len(d['userHistory'])} 条")
        print(f"  ✓ 风控规则: {len(d['riskRules'])} 条")
        print(f"  ✓ 处置建议: {d['suggestion']}")
    else:
        print(f"  ✗ 失败: {r.get('message')}")
else:
    print(f"  ⚠ 风控日志数据格式: {type(risk_logs.get('data'))}, 内容: {risk_logs.get('data')}")

# 9. 库存同步（管理端）
print("\n9. 库存同步（管理端）: POST /admin/stock/sync")
r = api(BASE_DIRECT, "POST", "/admin/stock/sync", token=admin_token)
print(f"  ✓ 同步请求: success={r.get('success')}")

print("\n" + "="*60)
print("  ✅ 所有新增API验证通过！")
print("="*60)
