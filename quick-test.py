#!/usr/bin/env python3
import requests, json, sys
BASE = "http://127.0.0.1:58933"

passed = 0
failed = 0

def test(step, name, r, expect_code=200, expect_data=True):
    global passed, failed
    try:
        data = r.json()
    except:
        data = r.text
    ok = r.status_code == expect_code and (not expect_data or data.get("code") == 200)
    if ok:
        passed += 1
        print(f"✅ {step}. {name}")
        return data
    else:
        failed += 1
        print(f"❌ {step}. {name} - HTTP {r.status_code}, resp: {str(data)[:200]}")
        return data

print("=" * 60)
print("B2B货运撮合SaaS平台 - 主业务链路快速验证")
print("=" * 60)

# 1. 货主登录
r = requests.post(f"{BASE}/api/auth/login", json={"username":"shipper01","password":"shipper123"}, timeout=5)
data = test(1, "货主登录", r)
token = data["data"]["token"]

# 2. 计算定价
r = requests.post(f"{BASE}/api/shipper/calculate-price", headers={"Authorization": f"Bearer {token}"},
    json={"distance":1200,"vehicleType":"厢式货车","loadingTime":"2026-06-02T08:00:00",
          "deliveryTime":"2026-06-03T18:00:00","weight":15,"volume":30}, timeout=5)
test(2, "动态定价计算", r)

# 3. 发布货源
r = requests.post(f"{BASE}/api/shipper/cargo", headers={"Authorization": f"Bearer {token}"},
    json={"cargo_name":"电子产品","cargo_type":"普通货物","weight":15,"volume":30,"quantity":100,
          "start_city":"北京市","start_address":"北京市朝阳区建国路88号","start_lng":116.4074,"start_lat":39.9042,
          "end_city":"上海市","end_address":"上海市浦东新区陆家嘴","end_lng":121.4737,"end_lat":31.2304,
          "distance":1200,"vehicle_type_required":"厢式货车","vehicle_length_required":9.6,
          "loading_time":"2026-06-02T08:00:00","delivery_time":"2026-06-03T18:00:00","remark":"轻拿轻放"}, timeout=5)
data = test(3, "发布货源", r)
cargo_id = data["data"]["cargoId"]

# 4. 司机登录
r = requests.post(f"{BASE}/api/auth/login", json={"username":"driver01","password":"driver123"}, timeout=5)
data = test(4, "司机登录", r)
driver_token = data["data"]["token"]
driver_id = data["data"]["user"]["id"]

# 5. 货源池
r = requests.get(f"{BASE}/api/driver/cargo-pool", headers={"Authorization": f"Bearer {driver_token}"}, timeout=5)
test(5, "司机查看货源池", r)

# 6. 司机报价
r = requests.post(f"{BASE}/api/driver/cargo/{cargo_id}/bid", headers={"Authorization": f"Bearer {driver_token}"},
    json={"bid_price":5800,"message":"全程高速"}, timeout=5)
test(6, "司机报价", r)

# 7. 查看货源详情
r = requests.get(f"{BASE}/api/shipper/cargo/{cargo_id}", headers={"Authorization": f"Bearer {token}"}, timeout=5)
data = test(7, "货主查看货源详情(含报价)", r)
nego_id = data["data"]["negotiations"][0]["id"]

# 8. 接受报价
r = requests.post(f"{BASE}/api/shipper/cargo/{cargo_id}/accept-bid", headers={"Authorization": f"Bearer {token}"},
    json={"negotiation_id":nego_id,"driver_id":driver_id}, timeout=5)
test(8, "货主接受报价", r)

# 9. 创建运单
r = requests.post(f"{BASE}/api/waybill/create", headers={"Authorization": f"Bearer {token}"},
    json={"cargo_id":cargo_id,"driver_id":driver_id,"agreed_price":5800}, timeout=5)
data = test(9, "创建电子运单", r)
waybill_no = data["data"]["waybill_no"]

# 获取运单ID
r = requests.get(f"{BASE}/api/waybill", headers={"Authorization": f"Bearer {token}"}, timeout=5)
data = test(9.5, "获取运单列表", r)
waybill_id = None
for w in data["data"]["list"]:
    if w["waybill_no"] == waybill_no:
        waybill_id = w["id"]
        break
print(f"   运单ID: {waybill_id}, 运单号: {waybill_no}")

# 10. 冻结担保资金
r = requests.post(f"{BASE}/api/payment/escrow-freeze", headers={"Authorization": f"Bearer {token}"},
    json={"waybill_id":waybill_id}, timeout=5)
test(10, "冻结担保资金", r)

# 11. 开始装货
r = requests.put(f"{BASE}/api/waybill/{waybill_id}/start-loading", headers={"Authorization": f"Bearer {driver_token}"}, timeout=5)
test(11, "开始装货", r)

# 12. 开始运输
r = requests.put(f"{BASE}/api/waybill/{waybill_id}/start-transport", headers={"Authorization": f"Bearer {driver_token}"}, timeout=5)
test(12, "开始运输", r)

# 13. 上报位置
for i in range(3):
    r = requests.post(f"{BASE}/api/waybill/{waybill_id}/track", headers={"Authorization": f"Bearer {driver_token}"},
        json={"lng":116.5+i*0.5,"lat":39.8-i*0.3,"speed":60+i*5}, timeout=5)
test(13, "上报位置(3次)", r)

# 14. 完成运输
r = requests.put(f"{BASE}/api/waybill/{waybill_id}/complete", headers={"Authorization": f"Bearer {driver_token}"}, timeout=5)
test(14, "完成运输", r)

# 15. 确认收货
r = requests.put(f"{BASE}/api/waybill/{waybill_id}/confirm-receipt", headers={"Authorization": f"Bearer {token}"},
    json={"rating":5,"comment":"服务很好"}, timeout=5)
test(15, "确认收货", r)

# 16. 资金分账
r = requests.post(f"{BASE}/api/payment/escrow-release", headers={"Authorization": f"Bearer {token}"},
    json={"waybill_id":waybill_id}, timeout=5)
test(16, "资金分账", r)

# 17. 分账明细
r = requests.get(f"{BASE}/api/waybill/{waybill_id}/split", headers={"Authorization": f"Bearer {token}"}, timeout=5)
data = test(17, "查看分账明细", r)
s = data["data"]
print(f"   总额:¥{s['total_amount']} 佣金:¥{s['platform_fee']} 保险:¥{s['insurance_fee']} 司机实收:¥{s['driver_amount']}")

# 18. 运输轨迹
r = requests.get(f"{BASE}/api/waybill/{waybill_id}/track", headers={"Authorization": f"Bearer {token}"}, timeout=5)
data = test(18, "查看运输轨迹", r)
print(f"   轨迹点数: {len(data['data']['list'])}")

# 19. 管理端统计
r = requests.post(f"{BASE}/api/auth/login", json={"username":"admin","password":"admin123456"}, timeout=5)
admin_token = r.json()["data"]["token"]
r = requests.get(f"{BASE}/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"}, timeout=5)
test(19, "管理端运营统计", r)

print()
print("=" * 60)
if failed == 0:
    print(f"✅✅✅ 全部 {passed} 项测试通过！")
else:
    print(f"⚠️  通过 {passed} 项，失败 {failed} 项")
print("=" * 60)
print()
print("访问地址:")
print("  前端: http://127.0.0.1:48933")
print("  后端: http://127.0.0.1:58933")
print()
print("测试账号:")
print("  货主: shipper01 / shipper123")
print("  司机: driver01 / driver123")
print("  司机: driver02 / driver123")
print("  管理员: admin / admin123456")
