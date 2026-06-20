import requests, json
BASE = "http://localhost:3000/api"

r = requests.post(BASE + "/auth/login", json={"username":"courier1","password":"courier123"})
d = r.json()
print("Courier1 login:", d["code"], d["data"]["user"]["name"], d["data"]["user"]["role"])
ct = d["data"]["token"]

r = requests.get(BASE + "/auth/me", headers={"Authorization": "Bearer " + ct})
d = r.json()
print("auth/me:", d["data"]["name"], d["data"]["role"])

r = requests.post(BASE + "/auth/login", json={"username":"admin1","password":"admin123"})
d = r.json()
print("Admin1 login:", d["code"], d["data"]["user"]["name"], d["data"]["user"]["role"])

r = requests.post(BASE + "/auth/login", json={"username":"operator1","password":"operator123"})
d = r.json()
print("Operator1 login:", d["code"], d["data"]["user"]["name"], d["data"]["user"]["role"])

r = requests.post(BASE + "/auth/login", json={"username":"courier1","password":"wrong"})
d = r.json()
print("Wrong password:", d["code"], d["message"])
