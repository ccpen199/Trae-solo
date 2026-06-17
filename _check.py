import urllib.request, json
d = json.loads(urllib.request.urlopen("http://127.0.0.1:59219/api/dashboard/realtime-map").read())
orders = d.get("orders", [])
print("realtime.orders count:", len(orders))
if orders:
    status_map = {}
    for o in orders:
        s = o.get("status", "unknown")
        status_map[s] = status_map.get(s, 0) + 1
    print("  by status:", status_map)
    abn = [o for o in orders if o.get("is_address_abnormal") == 1 or o.get("status") == "exception"]
    print("  abnormal/exception:", len(abn))
    print("  fields:", sorted(list(orders[0].keys())))
    for o in orders[:3]:
        print(f"  - {o.get('tracking_no')} {o.get('status')} addr_abn={o.get('is_address_abnormal')} brand={o.get('brand_name')}")
ab = d.get("abnormal_addresses", [])
print("\nabnormal_addresses:", len(ab))
if ab:
    print("  fields:", sorted(list(ab[0].keys())))
    for a in ab[:3]:
        print(f"  - {a.get('tracking_no')} status={a.get('status')} review_status={a.get('review_status')} abnormal_type={a.get('abnormal_type')}")
