#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json

BASE = 'http://127.0.0.1:43401/api'

def req(path, method='GET', data=None, token=None):
    url = f'{BASE}{path}'
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, method=method)
    r.add_header('Content-Type', 'application/json')
    if token:
        r.add_header('Authorization', f'Bearer {token}')
    try:
        resp = urllib.request.urlopen(r, timeout=10)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'HTTP Error {e.code}: {e.read().decode()}')
        raise

print('=== 1. Login (through Vite proxy) ===')
login_data = req('/auth/login', 'POST', {'username': 'admin', 'password': 'admin123'})
print(f'Login success: code={login_data["code"]}')
token = login_data['data']['token']
print(f'Token: {token[:30]}...')
user = login_data['data']['user']
print(f'User: {user["username"]} ({user["role"]})')

print('\n=== 2. List clusters ===')
clusters = req('/clusters', 'GET', token=token)
print(f'Found {len(clusters["data"])} clusters')
for c in clusters['data']:
    print(f'  - {c["name"]} ({c["id"][:8]}...) nodes={c["node_count"]} status={c["status"]}')
cluster_id = clusters['data'][0]['id']

print(f'\n=== 3. Dashboard for {clusters["data"][0]["name"]} ===')
dash = req(f'/clusters/{cluster_id}/dashboard', 'GET', token=token)
print(f'Keys: {list(dash["data"].keys())}')
d = dash['data']
print(f'Nodes: {len(d["nodes"])}, Namespaces: {len(d["namespaces"])}, Workloads: {len(d["workloads"])}')
print(f'Events: {len(d["events"])}, Certificates: {len(d["certificates"])}')
ov = d['overview']
print(f'Overview: {ov["runningWorkloads"]}/{ov["totalWorkloads"]} workloads running, {ov["readyPods"]}/{ov["totalPods"]} pods ready')

print('\n=== 4. List workloads ===')
wls = req(f'/clusters/{cluster_id}/workloads', 'GET', token=token)
print(f'Found {len(wls["data"])} workloads')
wl = wls['data'][0]
print(f'First: {wl["namespace"]}/{wl["name"]} ({wl["type"]}) image={wl["image"]} {wl["ready_replicas"]}/{wl["replicas"]}')
wl_id = wl['id']

print(f'\n=== 5. Workload detail for {wl["name"]} ===')
wl_detail = req(f'/workloads/{wl_id}', 'GET', token=token)
print(f'Detail: {wl_detail["data"]["name"]} status={wl_detail["data"]["status"]}')

pods = req(f'/workloads/{wl_id}/pods', 'GET', token=token)
print(f'Pods: {len(pods["data"])}')
svcs = req(f'/workloads/{wl_id}/services', 'GET', token=token)
print(f'Services: {len(svcs["data"])}')
ing = req(f'/workloads/{wl_id}/ingresses', 'GET', token=token)
print(f'Ingresses: {len(ing["data"])}')
cm = req(f'/workloads/{wl_id}/configmaps', 'GET', token=token)
print(f'ConfigMaps: {len(cm["data"])}')
sec = req(f'/workloads/{wl_id}/secrets', 'GET', token=token)
print(f'Secrets: {len(sec["data"])}')
evts = req(f'/workloads/{wl_id}/events', 'GET', token=token)
print(f'Events: {len(evts["data"])}')
rolls = req(f'/workloads/{wl_id}/rollouts', 'GET', token=token)
print(f'Rollouts: {len(rolls["data"])}')

print('\n=== 6. Create release ===')
release = req('/publish', 'POST', {
    'cluster_id': cluster_id,
    'namespace': wl['namespace'],
    'workload_name': wl['name'],
    'old_image': wl['image'],
    'new_image': f'{wl["image"].split(":")[0]}:2.0.0',
    'cpu_limit': '500m',
    'memory_limit': '256Mi',
    'health_check': 1,
    'gray_ratio': 30,
    'rollback_point': 'v1-stable',
    'change_reason': '版本升级修复安全漏洞',
    'on_duty': 'sre-test',
}, token=token)
print(f'Release created: {release["data"]["id"]}')
release_id = release['data']['id']

print('\n=== 7. List releases ===')
releases = req(f'/publish?cluster_id={cluster_id}', 'GET', token=token)
print(f'Found {len(releases["data"])} releases')
for r in releases['data'][:3]:
    print(f'  - {r["workload_name"]}: {r["old_image"]} -> {r["new_image"]} status={r["status"]}')

print('\n=== 8. Approve release ===')
appr = req(f'/publish/{release_id}/approve', 'POST', {}, token=token)
print(f'Approve: {appr["message"]}')

print('\n=== 9. Execute release ===')
execr = req(f'/publish/{release_id}/execute', 'POST', token=token)
print(f'Execute: {execr["message"]} rollback_point={execr["data"]["rollback_point"]}')

print('\n=== 10. Operation logs ===')
logs = req('/operations/logs', 'GET', token=token)
print(f'Found {len(logs["data"])} operation logs')
for l in logs['data'][:5]:
    print(f'  - {l["created_at"][:19]} {l["username"]} {l["action"]} {l["resource_name"]} risk={l["risk_level"]}')

print('\n=== 11. Generate inspection report ===')
rep = req(f'/clusters/{cluster_id}/inspection-reports', 'POST', token=token)
print(f'Report generated: score={rep["data"]["total_score"]} issues={rep["data"]["issues"][:60]}...')

print('\n=== 12. List inspection reports ===')
reports = req(f'/clusters/{cluster_id}/inspection-reports', 'GET', token=token)
print(f'Found {len(reports["data"])} reports')
for r in reports['data']:
    print(f'  - {r["report_date"]} score={r["total_score"]} restarts={r["restart_count"]} pending={r["pending_pods"]}')

print('\n=== All tests passed! ===')