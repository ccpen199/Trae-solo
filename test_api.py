import urllib.request, json

BASE = 'http://127.0.0.1:59152/api'

def post(path, data, token=None):
    req = urllib.request.Request(BASE+path, data=json.dumps(data).encode(), headers={'Content-Type':'application/json'})
    if token: req.add_header('Authorization', 'Bearer ' + token)
    return json.loads(urllib.request.urlopen(req, timeout=5).read())

def get(path, token=None):
    req = urllib.request.Request(BASE+path)
    if token: req.add_header('Authorization', 'Bearer ' + token)
    return json.loads(urllib.request.urlopen(req, timeout=5).read())

r = post('/auth/admin/login', {'username':'admin','password':'admin123'})
print('1.管理员登录:', 'OK' if r['code']==0 else 'FAIL')
tk_a = r['data']['token']

r = post('/auth/ganfutong/login', {'gft_user_id':'test_py_1','name':'测试用户','id_card':'360102199001019999'})
print('2.个人赣服通登录:', 'OK' if r['code']==0 else 'FAIL')
tk_u = r['data']['token']

r = post('/auth/enterprise/login', {'enterprise_name':'江西测试企业','unified_credit_code':'91360000MA00000099'})
print('3.企业登录:', 'OK' if r['code']==0 else 'FAIL')

r = post('/personal/unemployment/apply', {'education':'本科','previous_work':'工程师'}, tk_u)
print('4.失业登记办结:', r.get('message',''))

r = get('/personal/policy-calc/social-insurance?base_salary=6000&months=3', tk_u)
print('5.社保补缴试算total:', r['data']['total'])

r = get('/personal/policy-calc/venture-loan?project_type=small&annual_revenue=100', tk_u)
print('6.创业贷款预估额度(万):', r['data']['estimated_limit'])

r = post('/personal/contracts/create', {'contract_type':'固定期限','start_date':'2024-01-01','end_date':'2027-01-01','position':'工程师','salary':12000}, tk_u)
print('7.创建合同:', r.get('message',''))

r = post('/personal/title-applications/submit', {'apply_title':'中级工程师','apply_category':'工程技术','education':'本科','work_years':8}, tk_u)
print('8.职称申报:', r.get('message',''))

r = post('/personal/labor-disputes/submit', {'respondent_name':'某公司','dispute_type':'工资拖欠','dispute_amount':50000}, tk_u)
print('9.劳动争议申请:', r.get('message',''))

r = get('/admin/dashboard/stats', tk_a)
print('10.后台统计-用户数:', r['data']['total_users'])

r = post('/admin/public-opinions/crawl', {}, tk_a)
print('11.舆情抓取条数:', r['data']['crawled'])

r = post('/admin/cross-system/sync', {}, tk_a)
print('12.跨系统同步条数:', r['data']['synced'])

r = get('/admin/public-opinions/summary', tk_a)
print('13.舆情汇总-总数:', r['data']['total'])

print('\n==== 所有核心业务API测试完成 ====')
