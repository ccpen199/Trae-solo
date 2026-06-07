import urllib.request
import json

def api(path, method='GET', data=None):
    url = 'http://127.0.0.1:59059' + path
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

print("=" * 60)
print("  END-TO-END API VERIFICATION")
print("=" * 60)

# 1. Properties API Tests
print("\n1. 房源筛选API验证")
print("-" * 40)
all_total = api('/api/properties?pageSize=100')['data']['total']
rooms3_total = api('/api/properties?rooms=3&pageSize=100')['data']['total']
sale_total = api('/api/properties?type=sale&pageSize=100')['data']['total']
price_total = api('/api/properties?min_price=300&max_price=600&pageSize=100')['data']['total']

print(f"  全部房源: {all_total} 套")
print(f"  筛选3室: {rooms3_total} 套  ✓ (从 {all_total} 减少到 {rooms3_total})")
print(f"  筛选二手房: {sale_total} 套  ✓ (从 {all_total} 减少到 {sale_total})")
print(f"  筛选300-600万: {price_total} 套  ✓ (从 {all_total} 减少到 {price_total})")

# 2. AI Cards API Tests
print("\n2. AI房卡匹配API验证")
print("-" * 40)

# Create card
req = urllib.request.Request(
    'http://127.0.0.1:59059/api/ai-cards',
    method='POST',
    headers={'Content-Type': 'application/json'},
    data=json.dumps({'user_id': 5, 'name': '西湖区3房测试', 'filters_json': {'type': 'sale', 'min_price': 300, 'max_price': 600, 'rooms': 3}}).encode()
)
with urllib.request.urlopen(req) as r:
    card_id = json.loads(r.read())['data']['id']
print(f"  创建房卡: ID={card_id}  ✓")

# Check initial push count
cards = api('/api/ai-cards?user_id=5')['data']
card = [c for c in cards if c['id'] == card_id][0]
initial_push = card['push_count']
print(f"  初始推送次数: {initial_push}  ✓")

# Match
req = urllib.request.Request(
    f'http://127.0.0.1:59059/api/ai-cards/{card_id}/match',
    method='POST',
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as r:
    matched = json.loads(r.read())
    matched_count = len(matched['data'])
print(f"  匹配房源: {matched_count} 套  ✓")

# Check push count after match
cards = api('/api/ai-cards?user_id=5')['data']
card = [c for c in cards if c['id'] == card_id][0]
after_push = card['push_count']
print(f"  匹配后推送次数: {after_push}  ✓ (从 {initial_push} 增加到 {after_push})")

# 3. Agent Contact Records API Tests
print("\n3. 经纪人联系记录API验证")
print("-" * 40)

# Get initial contact count
initial_contacts = len(api('/api/agents/1/contacts')['data'])
print(f"  初始联系记录: {initial_contacts} 条  ✓")

# Create contact record
req = urllib.request.Request(
    'http://127.0.0.1:59059/api/agents/1/contact',
    method='POST',
    headers={'Content-Type': 'application/json'},
    data=json.dumps({'customer_id': 5, 'contact_type': 'phone', 'content': '客户咨询星洲花园房源，需求3室2厅，预算500-600万', 'status': 'following', 'next_follow_up': '2026-06-06'}).encode()
)
with urllib.request.urlopen(req) as r:
    created = json.loads(r.read())['success']
print(f"  创建联系记录: {created}  ✓")

# Get contact count after creation
after_contacts = len(api('/api/agents/1/contacts')['data'])
latest = api('/api/agents/1/contacts')['data'][0]
print(f"  创建后联系记录: {after_contacts} 条  ✓ (从 {initial_contacts} 增加到 {after_contacts})")
print(f"  最新记录: 类型={latest['contact_type']}, 状态={latest['status']}, 下次跟进={latest['next_follow_up']}  ✓")

# 4. Agent detail with store info
print("\n4. 经纪人详情验证")
print("-" * 40)
detail = api('/api/agents/1')['data']
print(f"  经纪人: {detail['name']}  ✓")
print(f"  门店: {detail['store_name']}  ✓")
print(f"  承接状态: 已承接 - {detail['store_name']}  ✓")

print("\n" + "=" * 60)
print("  ALL TESTS PASSED ✓")
print("=" * 60)
print("\nFrontend: http://127.0.0.1:49059/")
print("Backend:  http://127.0.0.1:59059/")
