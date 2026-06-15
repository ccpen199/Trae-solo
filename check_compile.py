#!/usr/bin/env python3
import urllib.request

pages = [
    "src/main.tsx", "src/App.tsx",
    "src/pages/Home.tsx", "src/pages/Login.tsx", "src/pages/Register.tsx",
    "src/pages/PublishLabor.tsx", "src/pages/PublishDelivery.tsx", "src/pages/PublishMoving.tsx",
    "src/pages/LaborOrders.tsx", "src/pages/DeliveryOrders.tsx", "src/pages/MovingOrders.tsx",
    "src/pages/LaborOrderDetail.tsx", "src/pages/DeliveryOrderDetail.tsx", "src/pages/MovingOrderDetail.tsx",
    "src/pages/MyOrders.tsx", "src/pages/Profile.tsx",
    "src/pages/Notifications.tsx", "src/pages/Disputes.tsx", "src/pages/InsuranceClaims.tsx",
    "src/pages/admin/Dashboard.tsx", "src/pages/admin/Capacity.tsx", "src/pages/admin/Prices.tsx",
    "src/pages/admin/Disputes.tsx", "src/pages/admin/QualityRules.tsx",
    "src/pages/admin/Orders.tsx", "src/pages/admin/Users.tsx",
    "src/api/index.ts", "src/types/index.ts",
    "src/context/AuthContext.tsx", "src/components/Layout/MainLayout.tsx",
]

ok = fail = 0
for p in pages:
    try:
        url = f"http://127.0.0.1:49218/{p}"
        with urllib.request.urlopen(url, timeout=10) as resp:
            code = resp.getcode()
        if code == 200:
            ok += 1
            print(f"[OK ] 200 {p}")
        else:
            fail += 1
            print(f"[ERR] {code} {p}")
    except Exception as e:
        fail += 1
        print(f"[ERR] ??? {p} ({str(e)[:40]})")

print(f"\n✅ 通过: {ok}/{len(pages)}   ❌ 失败: {fail}")
if fail == 0:
    print("🎉 所有前端模块编译通过！")
