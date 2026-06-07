import requests
BASE_URL = 'http://127.0.0.1:59043'

# 登录企业用户
r = requests.post(f'{BASE_URL}/api/auth/login', json={'username': 'nansha_co', 'password': 'password123'})
print('登录响应:', r.status_code, r.json())
token = r.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

# 检查报告接口
r = requests.get(f'{BASE_URL}/api/energy/reports', headers=headers)
print('\n报告接口:', r.status_code, r.json())

# 检查光伏方案接口
r = requests.get(f'{BASE_URL}/api/energy/pv-plans', headers=headers)
print('\n光伏方案接口:', r.status_code, r.json())

# 检查碳足迹接口
r = requests.get(f'{BASE_URL}/api/energy/carbon-records', headers=headers)
print('\n碳足迹接口:', r.status_code, r.json())

# 检查设备预警接口
r = requests.get(f'{BASE_URL}/api/energy/device-alerts', headers=headers)
print('\n设备预警接口:', r.status_code, r.json())
