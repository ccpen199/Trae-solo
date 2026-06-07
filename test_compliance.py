import requests
BASE_URL = 'http://127.0.0.1:59043'

def login(u, p):
    r = requests.post(f'{BASE_URL}/api/auth/login', json={'username':u,'password':p})
    return r.json()['data']['token']

def test_compliance():
    tok = login('huawei_co', 'password123')
    headers = {'Authorization': f'Bearer {tok}'}
    
    print('=== 合规审计模块测试 ===\n')
    
    # 1. 电价核查
    print('1. 电价核查接口:')
    r = requests.get(f'{BASE_URL}/api/compliance/price-audit', headers=headers)
    data = r.json()
    if data.get('success'):
        audit_data = data['data']
        print(f'   核查账单数: {len(audit_data.get("auditResults", []))}')
        print(f'   异常账单数: {audit_data.get("anomalyCount", 0)}')
        print(f'   总偏差金额: {audit_data.get("totalDeviation", 0)}')
        if audit_data.get('summary'):
            s = audit_data['summary']
            print(f'   统计: {s.get("totalBills",0)}单, {s.get("totalKwh",0)}kWh, {s.get("totalAmount",0)}元')
        if audit_data.get('auditResults') and len(audit_data['auditResults']) > 0:
            ar = audit_data['auditResults'][0]
            print(f'   首个核查结果: 账单期={ar.get("billingPeriod")}, 偏差={ar.get("deviation")}元')
    else:
        print(f'   失败: {data.get("error")}')
    
    # 2. 补贴管理
    print('\n2. 补贴管理接口:')
    r = requests.get(f'{BASE_URL}/api/compliance/subsidies', headers=headers)
    data = r.json()
    if data.get('success'):
        subsidies = data['data']
        print(f'   补贴记录数: {len(subsidies)}')
        if len(subsidies) > 0:
            s = subsidies[0]
            print(f'   首个补贴: 类型={s.get("type") or s.get("subsidy_type")}, 金额: {s.get("amount")}, 状态: {s.get("status")}')
            
            # 3. 补贴时间线追踪
            sub_id = s.get('id')
            print(f'\n3. 补贴时间线追踪 (ID={sub_id}):')
            r = requests.get(f'{BASE_URL}/api/compliance/subsidies/{sub_id}/timeline', headers=headers)
            tl_data = r.json()
            if tl_data.get('success'):
                tl = tl_data['data'].get('timeline', [])
                print(f'   时间线事件数: {len(tl)}')
                for item in tl[:3]:
                    if isinstance(item, dict):
                        for k, v in item.items():
                            print(f'   - {k}: {v}')
                    elif isinstance(item, tuple):
                        print(f'   - {item[0]}: {item[1]}')
            else:
                print(f'   失败: {tl_data.get("error")}')
    
    # 4. 绿色权益管理
    print('\n4. 绿色权益接口:')
    r = requests.get(f'{BASE_URL}/api/compliance/green-rights', headers=headers)
    data = r.json()
    if data.get('success'):
        rights = data['data']
        print(f'   绿色权益记录数: {len(rights)}')
        if len(rights) > 0:
            gr = rights[0]
            print(f'   首个权益: 类型={gr.get("type") or gr.get("right_type")}, 额度: {gr.get("value") or gr.get("amount")}, 状态: {gr.get("status")}')
            
            # 5. 绿色权益追踪
            gr_id = gr.get('id')
            print(f'\n5. 绿色权益全生命周期追踪 (ID={gr_id}):')
            r = requests.get(f'{BASE_URL}/api/compliance/green-rights/{gr_id}/trace', headers=headers)
            tr_data = r.json()
            if tr_data.get('success'):
                trace = tr_data['data']
                trace_list = trace.get('trace', []) if isinstance(trace, dict) else []
                print(f'   追踪记录数: {len(trace_list)}')
                for t in trace_list[:3]:
                    print(f'   - {t.get("action")}: {t.get("details")}')
            else:
                print(f'   失败: {tr_data.get("error")}')
    
    print('\n=== 合规审计模块测试完成 ===')

test_compliance()
