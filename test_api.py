import sys
import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:59046/api'

def post(path, data):
    req = urllib.request.Request(
        f'{BASE}{path}',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(path):
    with urllib.request.urlopen(f'{BASE}{path}', timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("=== Test 4: Create cinema with halls and new fields ===")
cinema_data = {
  "name": "Test Cinema Shenzhen",
  "city": "Shenzhen",
  "district": "Nanshan",
  "address": "123 Test Road, Nanshan",
  "equipment_level": "imax",
  "equipment_verify_date": "2026-01-15",
  "equipment_verify_by": "Inspector Wang",
  "equipment_verify_status": "verified",
  "scheduling_protocol": "auto",
  "protocol_start_date": "2026-01-01",
  "protocol_end_date": "2026-12-31",
  "min_schedule_ratio": 0.6,
  "max_daily_showtimes": 20,
  "last_review_date": "2026-05-01",
  "next_review_date": "2026-07-01",
  "review_notes": "运营正常，设备良好",
  "review_status": "normal",
  "reviewed_by": "Manager Li",
  "status": "active",
  "halls": [
    {"hall_name": "Hall A IMAX", "seat_count": 200, "equipment_level": "imax", "status": "active"},
    {"hall_name": "Hall B Standard", "seat_count": 120, "equipment_level": "standard", "status": "active"}
  ]
}
result = post('/cinemas', cinema_data)
print(f"Created cinema id: {result['id']}")
new_cinema = get(f'/cinemas/{result["id"]}')
print(f"  equipment_verify_status: {new_cinema['equipment_verify_status']}")
print(f"  review_status: {new_cinema['review_status']}")
print(f"  halls count: {len(new_cinema['halls'])}")
for h in new_cinema['halls']:
    print(f"    {h['name']}: {h['seat_count']} seats, {h['equipment_level']}")

print("\n=== Test 5: Create movie with new fields ===")
movie_data = {
  "title": "Test New Movie",
  "genre": "Sci-Fi",
  "duration": 135,
  "director": "Test Director",
  "release_date": "2026-06-10",
  "copyright_expiry": "2028-06-10",
  "revenue_share_ratio": 0.55,
  "pre_show_package": "premium",
  "status": "upcoming",
  "synopsis": "A test movie synopsis",
  "cast": "Actor A, Actor B, Actress C",
  "copyright_holder": "Test Film Studio",
  "copyright_reg_no": "CR-2026-00123",
  "copyright_region": ["mainland_china", "hong_kong"],
  "copyright_terms": "Standard distribution terms",
  "pre_show_ad_duration": 300,
  "pre_show_trailer_count": 3,
  "pre_show_material_version": "v2.1",
  "pre_show_languages": ["mandarin", "english"],
  "pre_show_subtitles": ["simplified_chinese", "english"],
  "share_effective_date": "2026-06-10",
  "share_expiry_date": "2026-07-10",
  "share_tiered": True,
  "share_tier1_ratio": 0.55,
  "share_tier2_ratio": 0.50,
  "share_tier3_ratio": 0.45,
  "lifecycle_notes": "Target release: summer season"
}
result = post('/movies', movie_data)
print(f"Created movie id: {result['id']}")
new_movie = get(f'/movies/{result["id"]}')
print(f"  cast: {new_movie['cast']}")
print(f"  share_tiered: {new_movie['share_tiered']}")
print(f"  copyright_region: {new_movie['copyright_region']}")
print(f"  pre_show_languages: {new_movie['pre_show_languages']}")

print("\n=== Test 6: Create order with channel ===")
order_data = {
  "audience_id": 1,
  "showtime_id": 3,
  "seats": [{"row": 1, "col": 5}, {"row": 1, "col": 6}],
  "payment_method": "cash",
  "channel": "mini_program"
}
result = post('/orders', order_data)
print(f"Created order id: {result['id']}, no: {result['order_no']}")
order_list = get('/orders')
new_order = next(o for o in order_list if o['id'] == result['id'])
print(f"  channel: {new_order['channel']}")
print(f"  verification_status: {new_order['verification_status']}")
print(f"  cinema_name: {new_order['cinema_name']}")
print(f"  seats: {new_order['seats']}")

print("\n=== ALL TESTS PASSED ===")
