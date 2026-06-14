import json
import urllib.request

def test_api(name, url):
    try:
        with urllib.request.urlopen(url) as r:
            data = json.loads(r.read().decode('utf-8'))
            return name, data, True
    except Exception as e:
        return name, str(e), False

print("=" * 60)
print("后台数据链路测试")
print("=" * 60)

# 5.1 数据概览
name, data, ok = test_api("数据概览", "http://127.0.0.1:59056/api/admin/dashboard")
if ok:
    s = data['data']['stats']
    print(f"\n✓ 数据概览:")
    print(f"  楼盘: {s['total_estates']}, 房源: {s['total_properties']}, 经纪人: {s['total_brokers']}")
    print(f"  门店: {s['total_stores']}, 用户: {s['total_users']}, 课程: {s['total_courses']}")
else:
    print(f"\n✗ 数据概览失败: {data}")

# 5.2 虚假房源
name, data, ok = test_api("虚假房源", "http://127.0.0.1:59056/api/admin/fake-properties?pageSize=5")
if ok:
    print(f"\n✓ 虚假房源: 总数 {data['total']} 套")
else:
    print(f"\n✗ 虚假房源失败: {data}")

# 5.3 门店记录
name, data, ok = test_api("门店记录", "http://127.0.0.1:59056/api/admin/stores")
if ok:
    print(f"\n✓ 门店记录: {len(data['data'])} 个")
else:
    print(f"\n✗ 门店记录失败: {data}")

# 5.4 相似房源
name, data, ok = test_api("相似房源", "http://127.0.0.1:59056/api/properties/1/similar?limit=5")
if ok:
    print(f"\n✓ 相似房源推荐: {len(data['data'])} 套")
else:
    print(f"\n✗ 相似房源失败: {data}")

# 5.5 AI推荐
name, data, ok = test_api("AI推荐", "http://127.0.0.1:59056/api/properties/recommendations?limit=6")
if ok:
    print(f"\n✓ AI推荐房源: {len(data['data'])} 套 - {data['message']}")
else:
    print(f"\n✗ AI推荐失败: {data}")

print("\n" + "=" * 60)
print("地图点位测试")
print("=" * 60)

# 6.1 地铁线
name, data, ok = test_api("地铁线", "http://127.0.0.1:59056/api/map/metro-lines")
if ok:
    lines = data['data']
    print(f"\n✓ 地铁线: {len(lines)} 条")
    for line in lines[:3]:
        stations = len(line['stations']) if isinstance(line['stations'], list) else len(json.loads(line['stations']))
        print(f"  - {line['line_name']}: {stations} 个站点, 覆盖 {line['estate_count']} 个楼盘")
else:
    print(f"\n✗ 地铁线失败: {data}")

# 6.2 学区边界
name, data, ok = test_api("学区边界", "http://127.0.0.1:59056/api/map/school-districts")
if ok:
    schools = data['data']
    print(f"\n✓ 学区边界: {len(schools)} 个")
    for s in schools[:3]:
        boundary = len(s['boundary']) if isinstance(s['boundary'], list) else len(json.loads(s['boundary']))
        print(f"  - {s['name']} ({s['level']}): {boundary} 个边界点")
else:
    print(f"\n✗ 学区边界失败: {data}")

# 6.3 VR房源点位
name, data, ok = test_api("VR房源", "http://127.0.0.1:59056/api/properties?hasVR=true&pageSize=50")
if ok:
    vr_list = data['data']
    print(f"\n✓ VR房源点位: {data['total']} 套")
    for p in vr_list[:3]:
        print(f"  - {p['title']}: 坐标 ({p['lat']:.4f}, {p['lng']:.4f})")
else:
    print(f"\n✗ VR房源失败: {data}")

# 6.4 搜索半径筛选
name, data, ok = test_api("搜索半径5km", "http://127.0.0.1:59056/api/properties?lat=39.9042&lng=116.4074&radius=5&pageSize=50")
if ok:
    print(f"\n✓ 搜索半径5km内: {data['total']} 套房源")
else:
    print(f"\n✗ 搜索半径失败: {data}")

# 6.5 周边配套
name, data, ok = test_api("周边配套", "http://127.0.0.1:59056/api/map/nearby?lat=39.9042&lng=116.4074&radius=2")
if ok:
    d = data['data']
    print(f"\n✓ 周边配套2km内:")
    print(f"  - 楼盘: {len(d['estates'])} 个")
    print(f"  - POI: {len(d['pois'])} 个")
    print(f"  - 地铁站: {len(d['metroStations'])} 个")
    print(f"  - 学校: {len(d['schools'])} 个")
    print(f"  - 经纪人: {len(d['brokers'])} 位")
else:
    print(f"\n✗ 周边配套失败: {data}")

print("\n" + "=" * 60)
print("全部测试完成!")
print("=" * 60)
