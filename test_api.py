import urllib.request
import json

def api(path):
    with urllib.request.urlopen('http://127.0.0.1:59059' + path, timeout=10) as r:
        d = json.loads(r.read())
        return d

print("=== 1. Properties API Tests")
print("ALL:", api('/api/properties?pageSize=100')['data']['total'])
print("rooms=3:", api('/api/properties?rooms=3&pageSize=100')['data']['total'])
print("type=sale:", api('/api/properties?type=sale&pageSize=100')['data']['total'])
print("300-600万:", api('/api/properties?min_price=300&max_price=600&pageSize=100')['data']['total'])
print("keyword=星洲:", api('/api/properties?keyword=星洲&pageSize=100')['data']['total'])

print("\n=== 2. AI Cards API Tests")
# Create a card
req = urllib.request.Request(
    'http://127.0.0.1:59059/api/ai-cards',
    method='POST',
    headers={'Content-Type': 'application/json'},
    data=json.dumps({'user_id': 5, 'name': '西湖区3房测试', 'filters_json': {'type': 'sale', 'min_price': 300, 'max_price': 600, 'rooms': 3}}).encode()
)
with urllib.request.urlopen(req) as r:
    card_id = json.loads(r.read())['data']['id']
print("Created card ID:", card_id)

# List cards
cards = api('/api/ai-cards?user_id=5')['data']
card = [c for c in cards if c['id'] == card_id][0]
print("Card:", card['name'], "push_count:", card['push_count'])

# Match
req = urllib.request.Request(
    'http://127.0.0.1:59059/api/ai-cards/' + str(card_id) + '/match',
    method='POST',
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as r:
    matched = json.loads(r.read())
    print("Matched:", len(matched['data']), "properties")

# Check push count again
cards = api('/api/ai-cards?user_id=5')['data']
card = [c for c in cards if c['id'] == card_id][0]
print("After match push_count:", card['push_count'])

print("\n=== 3. Agent Contact Records API Tests")
# Create contact record
req = urllib.request.Request(
    'http://127.0.0.1:59059/api/agents/1/contact',
    method='POST',
    headers={'Content-Type': 'application/json'},
    data=json.dumps({'customer_id': 5, 'contact_type': 'phone', 'content': '测试客户咨询房源，需求3室2厅', 'status': 'following', 'next_follow_up': '2026-06-06'}).encode()
)
with urllib.request.urlopen(req) as r:
    print("Contact created:", json.loads(r.read())['success'])

# List contacts
contacts = api('/api/agents/1/contacts')['data']
print("Contact records:", len(contacts), "total")
if contacts:
    print("Last:", contacts[0]['contact_type'], "-", contacts[0]['status'])
