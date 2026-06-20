#!/usr/bin/env python3
import requests
import json

BASE = "http://localhost:3000/api"

def login(u, p):
    r = requests.post(f"{BASE}/auth/login", json={"username": u, "password": p})
    return r.json()["data"]["token"]

def h(t): return {"Authorization": f"Bearer {t}"}

ct = login("courier1", "courier123")
print("courier token:", ct[:20])

r = requests.get(f"{BASE}/dashboard", headers=h(ct))
print("=== courier dashboard raw ===")
print(json.dumps(r.json(), ensure_ascii=False, indent=2)[:800])
