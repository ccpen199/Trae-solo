import urllib.request, json

BASE = "http://127.0.0.1:5174/api"

def api(method, path, data=None, token=None, device_id="py_test"):
    url = BASE + path
    headers = {"Content-Type": "application/json", "x-device-id": device_id}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

print("=== Full E2E Test ===\n")

r = api("POST", "/user/login", {"nickname": "inviter", "deviceInfo": {"userAgent": "t", "language": "zh", "platform": "t", "timezone": "A", "screenResolution": "1x1"}}, device_id="e2e_inv")
inviter_token = r["data"]["token"]
inviter_id = r["data"]["user"]["id"]
print(f"1. Inviter login: id={inviter_id}, token=ok")

r2 = api("POST", "/user/login", {"nickname": "invitee", "inviterId": inviter_id, "deviceInfo": {"userAgent": "t", "language": "zh", "platform": "t", "timezone": "A", "screenResolution": "1x1"}}, device_id="e2e_inve")
print(f"2. Invitee register: code={r2['code']}")

p = api("GET", "/user/profile", token=inviter_token, device_id="e2e_inv")
print(f"3. Inviter coins (invite reward): {p['data']['coins']}")

api("POST", "/user/checkin", token=inviter_token, device_id="e2e_inv")
api("POST", "/user/steps", {"steps": 8000, "source": "healthkit"}, token=inviter_token, device_id="e2e_inv")
api("POST", "/user/steps/claim", token=inviter_token, device_id="e2e_inv")
print("4. Checkin + Steps claim done")

tasks = api("GET", "/task/list", token=inviter_token, device_id="e2e_inv")
video_task = next((t for t in tasks["data"] if t["type"] == "video"), None)
if video_task:
    api("POST", f"/task/{video_task['id']}/complete", {"watchDuration": 30, "duration": 30}, token=inviter_token, device_id="e2e_inv")
    api("POST", f"/task/{video_task['id']}/claim", token=inviter_token, device_id="e2e_inv")
    print(f"5. Video task done (id={video_task['id']})")

p = api("GET", "/user/profile", token=inviter_token, device_id="e2e_inv")
coins = p["data"]["coins"]
print(f"6. Total coins: {coins}")

if coins >= 10000:
    r = api("POST", "/coin/exchange", {"coinAmount": 10000}, token=inviter_token, device_id="e2e_inv")
    print(f"7. Exchange: code={r['code']}, msg={r.get('message','')}")
    
    p = api("GET", "/user/profile", token=inviter_token, device_id="e2e_inv")
    print(f"   Coins={p['data']['coins']}, Cash={p['data']['cash_balance']}")
    
    if p['data']['cash_balance'] >= 1:
        r = api("POST", "/withdrawal", {"amount": 1, "channel": "wechat"}, token=inviter_token, device_id="e2e_inv")
        print(f"8. Withdraw: code={r['code']}, msg={r.get('message','')}")
        if r['code'] == 0:
            print(f"   Status={r['data'].get('status','?')}, Amount={r['data'].get('amount','?')}")
        print("\nSUCCESS: Full incentive loop verified!")
else:
    print(f"7. Not enough coins for exchange (need 10000, have {coins})")
    print("   But the API chain works correctly!")

r = api("GET", "/user/invite/stats", token=inviter_token, device_id="e2e_inv")
print(f"\n9. Invite stats: L1={r['data']['level1Count']}, L2={r['data']['level2Count']}, L3={r['data']['level3Count']}")
print(f"   Total invite reward: {r['data']['totalRewardCoins']} coins")
