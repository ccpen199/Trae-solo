#!/usr/bin/env python3
import requests

BASE = "http://127.0.0.1:59220/api"
LAT, LNG = 39.9042, 116.4074

def test(name, url, params=None):
    try:
        r = requests.get(f"{BASE}{url}", params=params, timeout=5)
        print(f"\n{'='*60}")
        print(f"【{name}】 {url}")
        print(f"  Status: {r.status_code}")
        if r.status_code == 200:
            d = r.json()
            # 检查数据长度
            for k in ['posts', 'topics', 'updates', 'merchants', 'helpRequests', 'stations', 'sites']:
                if k in d and isinstance(d[k], list):
                    print(f"  {k}: {len(d[k])} 条")
            # 打印前2条样本
            for k in ['posts', 'topics', 'updates', 'merchants']:
                if k in d and isinstance(d[k], list) and len(d[k]) > 0:
                    print(f"  样例(前2):")
                    for item in d[k][:2]:
                        if k == 'posts':
                            print(f"    - [{item.get('type')}] {item.get('title','')[:30]} | status={item.get('status')} | source={item.get('sourceLevel')}")
                        elif k == 'topics':
                            print(f"    - {item.get('name')} | isHot={item.get('isHot')} | postCount={item.get('postCount')}")
                        elif k == 'updates':
                            print(f"    - [{item.get('severity')}] {item.get('title','')[:30]} | service={item.get('service',{}).get('type') if item.get('service') else 'N/A'}")
                        elif k == 'merchants':
                            print(f"    - {item.get('businessName')[:20]} | {item.get('category')} | 券={len(item.get('coupons',[]))}")
        else:
            print(f"  Error: {r.text[:200]}")
    except Exception as e:
        print(f"\n【{name}】请求失败: {e}")

test("帖子Feed(默认坐标)", "/posts/feed", {"latitude": LAT, "longitude": LNG, "limit": 8})
test("帖子Feed(无坐标)", "/posts/feed", {"limit": 8})
test("热门话题", "/topics/hot")
test("话题列表", "/topics", {"limit": 20})
test("便民公告(severity=2)", "/utilities/updates", {"severity": 2, "limit": 5})
test("便民公告(全部)", "/utilities/updates", {"limit": 10})
test("商户附近(radius=5000)", "/merchants/nearby", {"latitude": LAT, "longitude": LNG, "radius": 5000})
test("公交站点", "/utilities/bus/stations", {"latitude": LAT, "longitude": LNG})
test("核酸检测点", "/utilities/test-sites", {"latitude": LAT, "longitude": LNG})
test("互助列表", "/help/requests", {"latitude": LAT, "longitude": LNG})

print(f"\n{'='*60}")
print("测试完成")
