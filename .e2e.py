import requests, json
B = "http://localhost:3000/api"

r = requests.post(B+"/auth/login", json={"username":"courier1","password":"courier123"})
d = r.json()
print("Courier1:", d["code"], d["data"]["user"]["name"], d["data"]["user"]["role"])
ct = d["data"]["token"]

r = requests.get(B+"/dashboard", headers={"Authorization":"Bearer "+ct})
d = r.json()
print("Courier Dashboard: pending="+str(d["data"]["stats"]["pending"])+" alerts="+str(len(d["data"]["alerts"])))

r = requests.post(B+"/auth/login", json={"username":"admin1","password":"admin123"})
at = r.json()["data"]["token"]

r = requests.get(B+"/finance/overview", headers={"Authorization":"Bearer "+at})
d = r.json()
print("Admin Finance: available="+str(d["data"]["availableBalance"]))

r = requests.post(B+"/auth/login", json={"username":"operator1","password":"operator123"})
ot = r.json()["data"]["token"]

r = requests.get(B+"/dashboard/global", headers={"Authorization":"Bearer "+ot})
d = r.json()
print("Operator Global: total="+str(d["data"]["totalTasks"])+" pending="+str(d["data"]["pending"])+" exception="+str(d["data"]["exception"]))

r = requests.post(B+"/auth/login", json={"username":"courier1","password":"wrong"})
print("Wrong pwd:", r.json()["code"], r.json()["message"])

print("ALL OK")
