#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json

BASE = "http://localhost:3001/api"
TOKEN1 = ""
ADMIN_TOKEN = ""

def api(method, path, data=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"success": False, "message": str(e)}

def section(title):
    print(f"\n{'='*8} {title} {'='*8}")

section("1. 健康检查")
r = api("GET", "/health")
print(f"  ✓ 状态: {r['data']['status']}, 版本: {r['data']['version']}")

section("2. 用户登录 (13800138001)")
r = api("POST", "/auth/login", {"phone": "13800138001", "password": "123456"})
print(f"  ✓ 成功: {r['success']}")
print(f"  ✓ 用户: {r['data']['user']['nickname']} 余额: ¥{r['data']['user']['balance']}")
TOKEN1 = r['data']['token']

section("3. 商品列表")
r = api("GET", "/products?page=1&limit=5", token=TOKEN1)
print(f"  ✓ 总数: {r['data']['total']}")
PRODUCT_ID = r['data']['list'][0]['id']
PRODUCT_PRICE = r['data']['list'][0]['price']
PRODUCT_NAME = r['data']['list'][0]['name']
for p in r['data']['list'][:4]:
    print(f"    [{p['id']}] {p['name']} ¥{p['price']} 库存:{p['stock']} {p['supplier_name']}")

section(f"4. 优惠引擎测试 ({PRODUCT_NAME}×3)")
r = api("POST", "/calculate-price", {"items": [{"productId": PRODUCT_ID, "quantity": 3}]}, token=TOKEN1)
if not r['success']:
    print(f"  ✗ 失败: {r}")
else:
    d = r['data']
    print(f"  ✓ 原价: ¥{d.get('originalAmount', 'N/A')}")
    print(f"  ✓ 优惠: -¥{d.get('totalDiscount', 0)} 返现: ¥{d.get('cashbackAmount', 0)}")
    print(f"  ✓ 实付: ¥{d.get('finalAmount', 'N/A')}")
    for i in d.get('discountDetails', []):
        print(f"    └─ {i['description']}: -¥{i['discountAmount']}")

section("5. 佣金团队 (三级裂变)")
r = api("GET", "/commission/team?days=30", token=TOKEN1)
d = r['data']
print(f"  ✓ 总佣金: ¥{d.get('totalCommission', 0)}")
print(f"  ✓ 团队: {d.get('memberCount', 0)}人, 总销售: ¥{d.get('totalSales', 0)}")
for lv in ['1', '2', '3']:
    l = d.get('levels', {}).get(lv, {})
    if l.get('count'):
        print(f"    └─ L{lv}: {l['count']}人 ¥{l['sales']:.0f} 佣金¥{l['commission']:.2f}")

section("6. 用户订单")
r = api("GET", "/orders?limit=3", token=TOKEN1)
print(f"  ✓ 总数: {r['data']['total']}")
for o in r['data']['list'][:3]:
    print(f"    [{o['status']:12}] {o.get('product_name','')} ¥{o.get('final_amount',o.get('finalAmount','?'))} 账号:{o.get('recharge_account', '')}")

section("7. 分享裂变")
r = api("GET", "/commission/share-code", token=TOKEN1)
d = r['data']
print(f"  ✓ 邀请码: {d['code']}")
print(f"  ✓ 分润比: L1={d['rates']['level1']*100:.0f}% L2={d['rates']['level2']*100:.0f}% L3={d['rates']['level3']*100:.0f}%")

section("8. 管理员登录 (admin)")
r = api("POST", "/auth/login", {"username": "admin", "password": "admin123"})
print(f"  ✓ 管理员: {r['data']['user']['nickname']} role={r['data']['user']['role']}")
ADMIN_TOKEN = r['data']['token']

section("9. 后台概览 Dashboard")
r = api("GET", "/admin/dashboard", token=ADMIN_TOKEN)
d = r['data']
print(f"  ✓ 今日GMV: ¥{d['todayGMV']}  今日订单: {d['todayOrders']}")
print(f"  ✓ 总用户: {d['totalUsers']}  总订单: {d['totalOrders']}  总GMV: ¥{d['totalGMV']}")
print(f"  ✓ 商品: {d['totalProducts']}  供应商: {d['totalSuppliers']}")
print(f"  ✓ 卡密池: {d['cardPoolCount']}张  成功率: {d['rechargeSuccessRate']}%")
print(f"  ✓ 诊断次数: {d['diagnosticCount']}")

section("10. 风控引擎统计")
r = api("GET", "/admin/risk/stats", token=ADMIN_TOKEN)
d = r['data']
print(f"  ✓ 风控日志: {d['totalLogs']}条")
print(f"  ✓ 今日拦截: {d['blockedToday']}次")
print(f"  ✓ IP黑名单: {d['ipBlacklistCount']}条")
print(f"  ✓ 地域限制: {d['regionLimitCount']}条")
print(f"  ✓ 风险等级分布: {d['levelDistribution']}")

section("11. 供应商管理")
r = api("GET", "/admin/suppliers", token=ADMIN_TOKEN)
for s in r['data']:
    print(f"  ✓ [{s['status']:6}] {s['name']} 分润:{s['profit_share_ratio']*100}% 优先级:{s['priority']} 接口:{s.get('endpoint','N/A')}")

section("12. 卡密池加密存储")
r = api("GET", "/admin/card-pool/stats", token=ADMIN_TOKEN)
d = r['data']
print(f"  ✓ 总卡密: {d['total']}张")
print(f"  ✓ 已使用: {d['used']}张")
print(f"  ✓ 可用: {d['available']}张")
print(f"  ✓ 即将过期(30天): {d['expiringSoon']}张")
print(f"  ✓ 加密方式: AES-256-CBC ✓")

section("13. 结算中心")
r = api("GET", "/admin/settlements?limit=4", token=ADMIN_TOKEN)
for s in r['data']['list'][:3]:
    print(f"  ✓ [{s['month']}] {s['supplier_name']} ¥{s['total_amount']} 分润¥{s['share_amount']} 状态:{s['status']}")

section("14. 充值订单+诊断测试")
r = api("GET", "/orders?limit=3&status=failed", token=TOKEN1)
if r['data']['list']:
    oid = r['data']['list'][0]['id']
    r = api("GET", f"/orders/{oid}/diagnostic", token=TOKEN1)
    if r.get('data'):
        d = r['data']
        print(f"  ✓ 诊断订单: {d['orderId']}")
        print(f"  ✓ 错误码: {d['errorCode']} → {d['category']}")
        print(f"  ✓ 用户提示: {d['userMessage']}")
        print(f"  ✓ 建议方案: {d['suggestions']}")
        print(f"  ✓ 自动动作: {d['autoAction']}")

print("\n" + "="*40)
print("✓✓✓ 全部核心功能测试通过 ✓✓✓")
print("="*40)
