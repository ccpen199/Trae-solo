import urllib.request, urllib.parse, json

def test(name, params):
    url = f"http://127.0.0.1:3002/api/posts?{urllib.parse.quote(params, safe='=&')}"
    with urllib.request.urlopen(url) as r:
        d = json.loads(r.read())
    posts = d['data']['posts']
    print(f"\n=== {name} ===")
    print(f"total: {d['data']['total']}, count: {len(posts)}")
    provinces = sorted(set(p['province'] for p in posts))
    cities = sorted(set(p['city'] for p in posts))
    districts = sorted(set(p['district'] for p in posts))
    print(f"provinces: {provinces}")
    print(f"cities: {cities}")
    print(f"districts: {districts}")
    merchants = [p for p in posts if p.get('authorType') == 'merchant']
    if merchants:
        m = merchants[0]
        print(f"--- merchant sample: {m['title']} ---")
        print(f"  merchantName: {m.get('merchantName')}")
        print(f"  merchantLicenseNo: {m.get('merchantLicenseNo')}")
        print(f"  merchantDepositStatus: {m.get('merchantDepositStatus')}")
        print(f"  merchantDepositAmount: {m.get('merchantDepositAmount')}")
        print(f"  authorPhone: {m.get('authorPhone')}")

test("北京朝阳筛选", "province=北京市&city=北京市&district=朝阳区&limit=5")
test("上海黄浦筛选", "province=上海市&city=上海市&district=黄浦区&limit=5")
test("广东广州天河筛选", "province=广东省&city=广州市&district=天河区&limit=5")
test("商家类型数据", "authorType=merchant&limit=3")
