#!/usr/bin/env python3
"""虚拟商品聚合分发平台 - 端到端验收测试脚本"""
import urllib.request
import urllib.error
import json
import sys

BASE_USER = "http://127.0.0.1:49212/api"
BASE_ADMIN = "http://127.0.0.1:49213/api"

passed = 0
failed = 0

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

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✓ {name}")
        if detail:
            print(f"    → {detail}")
    else:
        failed += 1
        print(f"  ✗ {name}")
        if detail:
            print(f"    → {detail}")

# ============================================
# 0. 三端服务连通性
# ============================================
section("0. 三端服务连通性检查")

try:
    r = api(BASE_USER, "GET", "/health")
    check("后端API(用户端代理)", r.get("success") and r["data"]["status"] == "ok",
          f"版本: {r['data'].get('version', 'N/A')}")
except Exception as e:
    check("后端API(用户端代理)", False, str(e))

try:
    r = api(BASE_ADMIN, "GET", "/health")
    check("后端API(管理端代理)", r.get("success") and r["data"]["status"] == "ok")
except Exception as e:
    check("后端API(管理端代理)", False, str(e))

# ============================================
# 1. 用户端 - 登录 & 基础数据
# ============================================
section("1. 用户端 - 认证 & 基础数据")

r = api(BASE_USER, "POST", "/auth/login", {"phone": "13800138001", "password": "123456"})
user_token = r.get("data", {}).get("token", "")
user = r.get("data", {}).get("user", {})
check("用户登录成功", r.get("success") and user_token,
      f"用户: {user.get('nickname')} 余额:¥{user.get('balance', 0)}")

check("用户佣金字段存在",
      "totalCommission" in user and "availableCommission" in user,
      f"累计佣金:¥{user.get('totalCommission', 0)} 可提:¥{user.get('availableCommission', 0)}")

# ============================================
# 2. 分类 & 商品
# ============================================
section("2. 商品分类 & SKU分布")

r = api(BASE_USER, "GET", "/categories")
cats = r.get("data", [])
check("分类列表获取", r.get("success") and len(cats) > 0,
      f"共{len(cats)}个分类")

if cats:
    cat_names = [c['name'] for c in cats]
    check("核心分类覆盖",
          all(any(n in c for c in cat_names) for n in ['话费', '流量', '会员', '外卖', '电商']),
          f"分类: {', '.join(cat_names[:6])}")

    has_product_count = all('product_count' in c for c in cats)
    check("分类带SKU数量", has_product_count,
          f"第1分类SKU数: {cats[0].get('product_count', 'N/A')}")

# ============================================
# 3. 热门商品 - 业务字段完整性
# ============================================
section("3. 热门商品 - 业务字段完整性")

r = api(BASE_USER, "GET", "/products/hot")
hot_products = r.get("data", [])
check("热门商品获取", r.get("success") and len(hot_products) > 0,
      f"共{len(hot_products)}个热门商品")

if hot_products:
    p = hot_products[0]
    check("商品-供应商名称", "supplier_name" in p and p['supplier_name'],
          f"供应商: {p['supplier_name']}")
    check("商品-供应商编码", "supplier_code" in p and p['supplier_code'],
          f"编码: {p['supplier_code']}")
    check("商品-分类名称", "category_name" in p and p['category_name'])
    check("商品-库存字段", "stock" in p and isinstance(p['stock'], int),
          f"库存: {p['stock']}")
    check("商品-库存预警线", "stock_warning" in p,
          f"预警线: {p.get('stock_warning', 'N/A')}")
    check("商品-通道数量", "channelCount" in p,
          f"通道数: {p.get('channelCount', 'N/A')}")
    check("商品-通道明细", "channels" in p and isinstance(p['channels'], list),
          f"明细通道数: {len(p.get('channels', []))}")
    check("商品-最后同步时间", "lastSync" in p and p['lastSync'] > 0,
          f"同步时间戳: {p['lastSync']}")
    check("商品-佣金比例", "commission_rate" in p and p['commission_rate'] > 0,
          f"佣金率: {p['commission_rate']*100}%")
    check("商品-面值", "face_value" in p and p['face_value'] > 0,
          f"面值: ¥{p['face_value']} 售价: ¥{p['price']}")
    check("商品-充值类型", "recharge_type" in p,
          f"类型: {p['recharge_type']}")
    check("商品-SKU类型", "sku_type" in p,
          f"SKU: {p['sku_type']}")
    check("商品-热销标记", "is_hot" in p)

# ============================================
# 4. 优惠计算 - 组合优惠拆分
# ============================================
section("4. 优惠计算引擎 - 组合优惠拆分")

if hot_products:
    pid = hot_products[0]['id']
    r = api(BASE_USER, "POST", "/calculate-price",
            {"items": [{"productId": pid, "quantity": 5}]},
            token=user_token)
    check("价格计算接口", r.get("success"),
          f"状态: {r.get('success')}" if not r.get('success') else "")

    if r.get("success"):
        d = r['data']
        check("优惠计算-原价", "originalAmount" in d and d['originalAmount'] > 0,
              f"原价: ¥{d['originalAmount']}")
        check("优惠计算-实付价", "finalAmount" in d and d['finalAmount'] > 0,
              f"实付: ¥{d['finalAmount']}")
        check("优惠计算-总减免", "totalDiscount" in d,
              f"总减: ¥{d.get('totalDiscount', 0)}")
        check("优惠计算-返现金额", "cashbackAmount" in d,
              f"返现: ¥{d.get('cashbackAmount', 0)}")
        check("优惠计算-明细列表", "discountDetails" in d and isinstance(d['discountDetails'], list),
              f"明细数: {len(d.get('discountDetails', []))}")

        if d.get('discountDetails'):
            types = [x['type'] for x in d['discountDetails']]
            check("优惠-多种类型叠加", len(set(types)) >= 1,
                  f"优惠类型: {', '.join(types)}")
            check("优惠-每笔有描述",
                  all('description' in x and 'promotionName' in x for x in d['discountDetails']),
                  f"示例: {d['discountDetails'][0].get('description', '')}")

        check("优惠-商品信息", "products" in d and len(d['products']) > 0,
              f"商品数: {len(d.get('products', []))}")
        if d.get('products'):
            check("优惠-商品含供应商", "supplierName" in d['products'][0],
                  f"供应商: {d['products'][0].get('supplierName', 'N/A')}")
            check("优惠-商品含佣金率", "commissionRate" in d['products'][0])

# ============================================
# 5. 商品详情 - 完整信息
# ============================================
section("5. 商品详情页 - 完整信息")

if hot_products:
    pid = hot_products[0]['id']
    r = api(BASE_USER, "GET", f"/products/{pid}")
    check("商品详情接口", r.get("success"))
    if r.get("success"):
        d = r['data']
        check("详情-供应商名称", "supplier_name" in d and d['supplier_name'])
        check("详情-通道数量", "channelCount" in d and d['channelCount'] >= 0,
              f"通道数: {d['channelCount']}")
        check("详情-通道明细列表", "channels" in d and isinstance(d['channels'], list))
        check("详情-适用促销", "applicablePromotions" in d and isinstance(d['applicablePromotions'], list),
              f"促销数: {len(d.get('applicablePromotions', []))}")
        check("详情-最后同步时间", "lastSync" in d and d['lastSync'] > 0)
        check("详情-库存预警线", "stock_warning" in d)

# ============================================
# 6. 订单列表 & 详情
# ============================================
section("6. 订单 - 状态流转 & 诊断")

r = api(BASE_USER, "GET", "/orders?limit=5", token=user_token)
check("订单列表获取", r.get("success"))

orders = []
if r.get("success"):
    orders = r['data']['list']
    check("订单-数量正确", len(orders) > 0, f"共{r['data']['total']}单")

    if orders:
        o = orders[0]
        check("订单-商品名称", "product_name" in o)
        check("订单-最终金额", "final_amount" in o)
        check("订单-原始金额", "original_amount" in o)
        check("订单-折扣金额", "discount_amount" in o)
        check("订单-充值账号", "recharge_account" in o)
        check("订单-状态字段", "status" in o, f"状态: {o['status']}")
        check("订单-SKU类型", "sku_type" in o)
        check("订单-订单号", "order_no" in o)

# ============================================
# 7. 订单诊断 - 失败订单
# ============================================
section("7. 充值失败智能诊断")

failed_orders = [o for o in orders if o.get('status') == 'failed']
if failed_orders:
    fid = failed_orders[0]['id']
    r = api(BASE_USER, "GET", f"/orders/{fid}/diagnostic", token=user_token)
    check("诊断接口存在", r.get("success"))
    if r.get("success"):
        d = r['data']
        check("诊断-订单ID", "orderId" in d)
        check("诊断-错误码", "errorCode" in d and d['errorCode'],
              f"错误码: {d['errorCode']}")
        check("诊断-问题分类", "category" in d and d['category'],
              f"分类: {d['category']}")
        check("诊断-严重程度", "severity" in d)
        check("诊断-用户提示", "userMessage" in d and d['userMessage'])
        check("诊断-根本原因", "rootCause" in d)
        check("诊断-建议方案", "suggestions" in d and isinstance(d['suggestions'], list),
              f"方案数: {len(d.get('suggestions', []))}")
        check("诊断-自动动作", "autoAction" in d)
        check("诊断-通道切换可用", "switchChannelAvailable" in d)
else:
    print("  ⚠ 暂无失败订单，跳过诊断测试")

# ============================================
# 8. 佣金 - 三级裂变
# ============================================
section("8. 佣金系统 - 三级裂变追踪")

r = api(BASE_USER, "GET", "/commission/team?days=30", token=user_token)
check("佣金团队数据", r.get("success"))
if r.get("success"):
    d = r['data']
    check("佣金-总销售", "totalSales" in d, f"总销售: ¥{d.get('totalSales', 0)}")
    check("佣金-总佣金", "totalCommission" in d, f"总佣金: ¥{d.get('totalCommission', 0)}")
    check("佣金-团队人数", "memberCount" in d, f"团队: {d.get('memberCount', 0)}人")
    check("佣金-三级结构", "levels" in d and isinstance(d['levels'], dict))
    if 'levels' in d:
        lvls = d['levels']
        check("佣金-L1数据", '1' in lvls,
              f"L1: {lvls.get('1',{}).get('count',0)}人 ¥{lvls.get('1',{}).get('commission',0):.2f}")
        check("佣金-L2数据", '2' in lvls,
              f"L2: {lvls.get('2',{}).get('count',0)}人 ¥{lvls.get('2',{}).get('commission',0):.2f}")
        check("佣金-L3数据", '3' in lvls,
              f"L3: {lvls.get('3',{}).get('count',0)}人 ¥{lvls.get('3',{}).get('commission',0):.2f}")

r = api(BASE_USER, "GET", "/commission/records?limit=20", token=user_token)
check("佣金明细列表", r.get("success"))
if r.get("success"):
    records = r['data']
    if records:
        rec = records[0]
        check("佣金-明细金额", "amount" in rec)
        check("佣金-明细节级", "level" in rec, f"级别: L{rec.get('level', '?')}")
        check("佣金-明细状态", "status" in rec, f"状态: {rec.get('status', '')}")
        check("佣金-来源用户", "from_nickname" in rec or "from_user_id" in rec)
        check("佣金-关联商品", "product_name" in rec or "order_id" in rec)
        check("佣金-创建时间", "created_at" in rec)

r = api(BASE_USER, "GET", "/commission/referrals", token=user_token)
check("邀请关系列表", r.get("success"))
if r.get("success"):
    d = r['data']
    check("邀请-总数", "count" in d, f"共{d.get('count', 0)}人")
    check("邀请-三级分组", "grouped" in d and isinstance(d['grouped'], dict),
          f"L1:{len(d.get('grouped',{}).get('1',[]))} L2:{len(d.get('grouped',{}).get('2',[]))} L3:{len(d.get('grouped',{}).get('3',[]))}")
    if 'grouped' in d:
        g = d['grouped']
        if g.get('1'):
            u = g['1'][0]
            check("邀请-用户昵称", "nickname" in u)
            check("邀请-用户手机", "phone" in u)
            check("邀请-层级深度", "depth" in u, f"深度: {u.get('depth', '?')}")
            check("邀请-消费金额", "total_spent" in u)

r = api(BASE_USER, "GET", "/commission/share-code", token=user_token)
check("分享码获取", r.get("success"))
if r.get("success"):
    d = r['data']
    check("分享-邀请码", "code" in d and d['code'])
    check("分享-分享链接", "shareUrl" in d and d['shareUrl'])
    check("分享-三级比例", "rates" in d and isinstance(d['rates'], dict))
    if 'rates' in d:
        check("分享-L1比例", "level1" in d['rates'], f"L1: {d['rates']['level1']*100}%")
        check("分享-L2比例", "level2" in d['rates'], f"L2: {d['rates']['level2']*100}%")
        check("分享-L3比例", "level3" in d['rates'], f"L3: {d['rates']['level3']*100}%")

# ============================================
# 9. 管理后台 - 登录 & Dashboard
# ============================================
section("9. 管理后台 - 运营概览 Dashboard")

r = api(BASE_ADMIN, "POST", "/auth/admin-login", {"username": "admin", "password": "admin123"})
admin_token = r.get("data", {}).get("token", "")
admin_user = r.get("data", {}).get("user", {})
check("管理员登录", r.get("success") and admin_token,
      f"用户: {admin_user.get('username', 'N/A')} 角色: {admin_user.get('role', 'N/A')}")

if admin_token:
    r = api(BASE_ADMIN, "GET", "/admin/dashboard", token=admin_token)
    check("Dashboard接口", r.get("success"))
    if r.get("success"):
        d = r['data']
        check("看板-今日GMV", "todayGMV" in d, f"¥{d.get('todayGMV', 0)}")
        check("看板-今日订单", "todayOrders" in d, f"{d.get('todayOrders', 0)}单")
        check("看板-总GMV", "totalGMV" in d, f"¥{d.get('totalGMV', 0)}")
        check("看板-总订单", "totalOrders" in d, f"{d.get('totalOrders', 0)}单")
        check("看板-总用户", "totalUsers" in d, f"{d.get('totalUsers', 0)}人")
        check("看板-总商品", "totalProducts" in d, f"{d.get('totalProducts', 0)}个")
        check("看板-供应商数", "totalSuppliers" in d, f"{d.get('totalSuppliers', 0)}家")
        check("看板-今日失败", "todayFailures" in d)
        check("看板-本月佣金", "monthCommission" in d, f"¥{d.get('monthCommission', 0)}")
        check("看板-待结算佣金", "pendingCommission" in d)
        check("看板-充值成功率", "rechargeSuccessRate" in d, f"{d.get('rechargeSuccessRate', 0)}%")
        check("看板-卡密池总量", "cardPoolCount" in d, f"{d.get('cardPoolCount', 0)}张")
        check("看板-卡密已使用", "cardUsed" in d)
        check("看板-卡密已过期", "cardExpired" in d)
        check("看板-风控日志数", "riskLogCount" in d)
        check("看板-今日拦截", "blockedToday" in d, f"{d.get('blockedToday', 0)}次")
        check("看板-IP黑名单数", "ipBlacklistCount" in d)
        check("看板-地域限制数", "regionLimitCount" in d)
        check("看板-诊断规则数", "diagnosticCount" in d)
        check("看板-订单状态分布", "statusBreakdown" in d and isinstance(d['statusBreakdown'], list))
        check("看板-风险等级分布", "levelDistribution" in d and isinstance(d['levelDistribution'], list))
        check("看板-供应商统计", "supplierStats" in d and isinstance(d['supplierStats'], list),
              f"{len(d.get('supplierStats', []))}家")

# ============================================
# 10. 管理后台 - 供应商管理
# ============================================
section("10. 管理后台 - 供应商管理 & 库存同步")

if admin_token:
    r = api(BASE_ADMIN, "GET", "/admin/suppliers", token=admin_token)
    check("供应商列表", r.get("success"))
    if r.get("success"):
        suppliers = r['data']
        check("供应商-数量", len(suppliers) >= 2, f"共{len(suppliers)}家")
        if suppliers:
            s = suppliers[0]
            check("供应商-名称", "name" in s and s['name'])
            check("供应商-编码", "code" in s and s['code'])
            check("供应商-状态", "status" in s)
            check("供应商-分润比例", "settlement_ratio" in s or "profit_share_ratio" in s,
                  f"分润: {s.get('settlement_ratio', s.get('profit_share_ratio', 'N/A'))}")
            check("供应商-商品数", "productCount" in s,
                  f"商品: {s.get('productCount', 0)}个")
            check("供应商-订单数", "totalOrders" in s)
            check("供应商-总金额", "totalAmount" in s)
            check("供应商-失败数", "failCount" in s)
            check("供应商-失败率", "failRate" in s, f"失败率: {s.get('failRate', 0)}%")
            check("供应商-通道数", "channelCount" in s,
                  f"通道: {s.get('channelCount', 0)}个")
            check("供应商-卡密数", "cardCount" in s)
            check("供应商-可用卡密", "availableCards" in s)
            check("供应商-加密状态", "encryptionStatus" in s,
                  f"加密: {s.get('encryptionStatus', 'N/A')}")

# ============================================
# 11. 管理后台 - 商品管理
# ============================================
section("11. 管理后台 - 商品管理")

if admin_token:
    r = api(BASE_ADMIN, "GET", "/admin/products?page=1&pageSize=5", token=admin_token)
    check("商品列表(管理端)", r.get("success"))
    if r.get("success"):
        d = r['data']
        check("商品-总数", "total" in d, f"共{d.get('total', 0)}个SKU")
        check("商品-列表", "list" in d and len(d['list']) > 0)
        if d.get('list'):
            p = d['list'][0]
            check("商品-供应商名", "supplier_name" in p)
            check("商品-分类名", "category_name" in p)

# ============================================
# 12. 管理后台 - 订单管理
# ============================================
section("12. 管理后台 - 订单管理")

if admin_token:
    r = api(BASE_ADMIN, "GET", "/admin/orders?page=1&pageSize=5", token=admin_token)
    check("订单列表(管理端)", r.get("success"))
    if r.get("success"):
        d = r['data']
        check("订单-总数", "total" in d, f"共{d.get('total', 0)}单")
        if d.get('list'):
            o = d['list'][0]
            check("订单-用户手机", "user_phone" in o)
            check("订单-用户昵称", "user_name" in o)
            check("订单-供应商", "supplier_name" in o)
            check("订单-商品名", "product_name" in o)

# ============================================
# 13. 管理后台 - 结算中心
# ============================================
section("13. 管理后台 - 结算中心 & 发票")

if admin_token:
    r = api(BASE_ADMIN, "GET", "/admin/settlements?page=1&pageSize=5", token=admin_token)
    check("结算列表", r.get("success"))
    if r.get("success"):
        d = r['data']
        check("结算-总数", "total" in d, f"共{d.get('total', 0)}单")
        if d.get('list'):
            s = d['list'][0]
            check("结算-供应商名", "supplier_name" in s)
            check("结算-账期月份", "month" in s, f"账期: {s.get('month', '')}")
            check("结算-订单总额", "total_amount" in s, f"总额: ¥{s.get('total_amount', 0)}")
            check("结算-分润金额", "share_amount" in s, f"分润: ¥{s.get('share_amount', 0)}")
            check("结算-状态", "status" in s, f"状态: {s.get('status', '')}")

# ============================================
# 14. 管理后台 - 风控引擎
# ============================================
section("14. 管理后台 - 风控引擎")

if admin_token:
    r = api(BASE_ADMIN, "GET", "/admin/risk/logs?limit=10", token=admin_token)
    check("风控日志", r.get("success"))
    if r.get("success"):
        logs = r['data']
        check("风控-日志存在", isinstance(logs, list), f"共{len(logs)}条")
        if logs:
            l = logs[0]
            check("风控-IP字段", "ip" in l)
            check("风控-地区字段", "region" in l)
            check("风控-风险等级", "risk_level" in l)
            check("风控-是否拦截", "blocked" in l)
            check("风控-原因", "reason" in l)

    r = api(BASE_ADMIN, "GET", "/admin/risk/blacklist", token=admin_token)
    check("IP黑名单列表", r.get("success"))
    if r.get("success"):
        bl = r['data']
        check("黑名单-数组", isinstance(bl, list), f"共{len(bl)}条")
        if bl:
            b = bl[0]
            check("黑名单-IP", "ip" in b)
            check("黑名单-原因", "reason" in b)
            check("黑名单-过期时间", "expires_at" in b)

# ============================================
# 15. 管理后台 - 卡密池
# ============================================
section("15. 管理后台 - 卡密池加密存储")

if admin_token:
    r = api(BASE_ADMIN, "GET", "/admin/card-pool/stats", token=admin_token)
    check("卡密池统计", r.get("success"))
    if r.get("success"):
        d = r['data']
        check("卡密-总数", "total" in d, f"{d.get('total', 0)}张")
        check("卡密-已使用", "used" in d)
        check("卡密-可用", "available" in d)
        check("卡密-已过期", "expired" in d)
        check("卡密-即将过期", "expiringSoon" in d, f"{d.get('expiringSoon', 0)}张")
        check("卡密-加密方式", "encryptionMethod" in d,
              f"加密: {d.get('encryptionMethod', 'N/A')}")
        check("卡密-按商品分布", "byProduct" in d and isinstance(d['byProduct'], list),
              f"{len(d.get('byProduct', []))}个商品")

# ============================================
# 16. 管理后台 - 用户管理
# ============================================
section("16. 管理后台 - 用户管理")

if admin_token:
    r = api(BASE_ADMIN, "GET", "/admin/users?page=1&pageSize=5", token=admin_token)
    check("用户列表(管理端)", r.get("success"))
    if r.get("success"):
        d = r['data']
        check("用户-总数", "total" in d, f"共{d.get('total', 0)}人")
        if d.get('list'):
            u = d['list'][0]
            check("用户-手机号", "phone" in u)
            check("用户-昵称", "nickname" in u)
            check("用户-余额", "balance" in u)
            check("用户-等级", "level" in u)
            check("用户-累计佣金", "total_commission" in u)
            check("用户-可用佣金", "available_commission" in u)
            check("用户-邀请人ID", "referrer_id" in u)
            check("用户-虚拟号标记", "is_virtual" in u)

# ============================================
# 结果汇总
# ============================================
section("验收测试结果汇总")
total = passed + failed
print(f"  ✅ 通过: {passed} / {total}")
print(f"  ❌ 失败: {failed} / {total}")
print(f"  📊 通过率: {passed/total*100:.1f}%" if total > 0 else "  ⚠ 无测试用例")

if failed > 0:
    print("\n  ⚠ 存在失败项，请检查具体输出")
    sys.exit(1)
else:
    print("\n  🎉 全部验收通过！")
