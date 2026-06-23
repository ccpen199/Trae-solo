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

results = []

r = post('/auth/admin/login', {'username':'admin','password':'admin123'})
tk_a = r['data']['token']
results.append(('1.管理员登录→获取token', r['code']==0 and bool(tk_a)))

r = post('/auth/ganfutong/login', {'gft_user_id':'fix_test_1','name':'修复验证用户','id_card':'360102199901011234'})
tk_u = r['data']['token']
results.append(('2.个人赣服通登录→获取token', r['code']==0 and bool(tk_u)))

r = get('/admin/dashboard/stats', tk_a)
d = r['data']
results.append(('3.后台统计→用户数>0', d.get('total_users',0)>0))
results.append(('4.后台统计→四大域汇总(社保/就业/人才/监察)', all(k in d for k in ['social_insurance','employment','talent','labor_supervision'])))
results.append(('5.后台统计→舆情汇总含分级', 'opinion_summary' in d and 'high' in d.get('opinion_summary',{})))
results.append(('6.后台统计→平台分布数据', 'platform_distribution' in d and isinstance(d['platform_distribution'], list)))

r = post('/admin/cross-system/sync', {}, tk_a)
results.append(('7.跨系统数据同步→条数>0', r['data']['synced']>0))

r = get('/admin/cross-system/data?source=medical_insurance', tk_a)
results.append(('8.医保局数据→列表非空', len(r['data'])>0))

r = get('/admin/cross-system/query-person?id_card=360102199901011234', tk_a)
qd = r['data']
results.append(('9.个人档案查询→profile存在', qd.get('profile') is not None))
results.append(('10.个人档案→医保/税务/教育字段', all(k in qd for k in ['medical','tax','education'])))

r = post('/personal/policy-calc/social-insurance?base_salary=8000&months=6', None, tk_u) if False else get('/personal/policy-calc/social-insurance?base_salary=8000&months=6', tk_u)
results.append(('11.社保补缴试算→总金额>0', r['data']['total']>0))

r = get('/personal/policy-calc/venture-loan?project_type=small&annual_revenue=100&employee_count=20', tk_u)
results.append(('12.创业贷款试算→额度>0', r['data']['estimated_limit']>0))

r = get('/admin/policy-calculations?type=social', tk_a)
results.append(('13.政策计算器记录→列表非空', len(r['data'])>0))

r = post('/admin/public-opinions/crawl', {}, tk_a)
results.append(('14.舆情抓取→条数>0', r['data']['crawled']>0))

r = get('/admin/public-opinions/summary', tk_a)
results.append(('15.舆情汇总→高/中/一般分级', all(k in r['data'] for k in ['high','medium','normal'])))

r = get('/admin/public-opinions', tk_a)
olist = r['data']
results.append(('16.舆情列表→含sentiment_label字段', len(olist)>0 and 'sentiment_label' in olist[0]))
results.append(('17.舆情列表→含handled布尔字段', len(olist)>0 and isinstance(olist[0].get('handled'), bool)))

print('\n===== 全链路验证报告 =====')
for name, ok in results:
    print(f"{'✅' if ok else '❌'} {name}")

passed = sum(1 for _,ok in results if ok)
total = len(results)
print(f"\n通过: {passed}/{total}")
if passed == total:
    print('🎉 全部通过！所有业务闭环已修复。')
else:
    print('⚠️ 存在未通过项，需进一步排查。')
