import urllib.request, json

def test_face_verify():
    print('=== 测试人脸核验 API ===')
    data = json.dumps({'person_id': 3}).encode()
    req = urllib.request.Request('http://127.0.0.1:58783/api/face-verify', data=data, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    
    print('顶级键:', list(d.keys()))
    print()
    
    checks = [
        ('verified', d.get('verified')),
        ('confidence', d.get('confidence')),
        ('method', d.get('method')),
        ('record_updated', d.get('record_updated')),
    ]
    for k, v in checks:
        print(f'  {k}: {v}')
    
    print()
    nested_checks = [
        ('live_face_details', d.get('live_face_details')),
        ('police_match_details', d.get('police_match_details')),
        ('silent_verify_records', d.get('silent_verify_records')),
        ('person_update', d.get('person_update')),
        ('failure_reasons', d.get('failure_reasons')),
        ('review_suggestion', d.get('review_suggestion')),
        ('review_record', d.get('review_record')),
    ]
    
    for k, v in nested_checks:
        if v is not None:
            if isinstance(v, list):
                print(f'✅ {k}: 存在，{len(v)} 项')
            elif isinstance(v, dict):
                print(f'✅ {k}: 存在，字段: {list(v.keys())}')
            else:
                print(f'✅ {k}: {v}')
        else:
            print(f'❌ {k}: 不存在或为 None')

def test_material_check():
    print('\n=== 测试材料预检 API ===')
    data = json.dumps({
        'business_item_id': 4,
        'materials': [],
        'person_id': 3
    }).encode()
    req = urllib.request.Request('http://127.0.0.1:58783/api/material-check', data=data, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    
    print('顶级键:', list(d.keys()))
    print()
    
    checks = [
        ('passed', d.get('passed')),
        ('check_time', d.get('check_time')),
        ('record_updated', d.get('record_updated')),
        ('current_context', d.get('current_context')),
        ('pass_reason', d.get('pass_reason')),
        ('reject_reasons', d.get('reject_reasons')),
        ('time_required', d.get('time_required')),
        ('missing', d.get('missing')),
        ('need_correction', d.get('need_correction')),
        ('submitted_status', d.get('submitted_status')),
    ]
    
    for k, v in checks:
        if v is not None:
            if isinstance(v, list):
                print(f'✅ {k}: 存在，{len(v)} 项')
            elif isinstance(v, dict):
                print(f'✅ {k}: 存在，字段: {list(v.keys())}')
            else:
                print(f'✅ {k}: {v}')
        else:
            print(f'❌ {k}: 不存在或为 None')
    
    if d.get('submitted_status'):
        print('  材料来源示例:')
        for s in d['submitted_status'][:3]:
            print(f'    - {s["material"]}: {s.get("source", "无")}')

def test_cross_dept():
    print('\n=== 测试跨部门比对 API ===')
    data = json.dumps({
        'person_id': 3,
        'verify_types': ['medical', 'tax', 'civil'],
        'business_item_id': 4
    }).encode()
    req = urllib.request.Request('http://127.0.0.1:58783/api/cross-dept-verify', data=data, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    
    print('顶级键:', list(d.keys()))
    print()
    
    checks = [
        ('verified', d.get('verified')),
        ('record_updated', d.get('record_updated')),
        ('service_record_id', d.get('service_record_id')),
        ('auto_approve', d.get('auto_approve')),
        ('review_basis', d.get('review_basis')),
        ('exception_items', d.get('exception_items')),
        ('results', d.get('results')),
    ]
    
    for k, v in checks:
        if v is not None:
            if isinstance(v, list):
                print(f'✅ {k}: 存在，{len(v)} 项')
            elif isinstance(v, dict):
                print(f'✅ {k}: 存在，字段: {list(v.keys())}')
                if k == 'results':
                    for dept, res in v.items():
                        print(f'    - {dept}: {res.get("status")}, {res.get("source_dept")}')
            else:
                print(f'✅ {k}: {v}')
        else:
            print(f'❌ {k}: 不存在或为 None')

def test_credential_api():
    print('\n=== 测试电子凭证 API ===')
    
    # 先获取凭证列表
    req = urllib.request.Request('http://127.0.0.1:58783/api/electronic-credentials')
    resp = urllib.request.urlopen(req)
    creds = json.loads(resp.read())
    print(f'凭证总数: {len(creds)}')
    
    if creds:
        cred_id = creds[0]['id']
        print(f'测试凭证 ID: {cred_id}')
        
        # 测试校验
        print('\n--- 校验接口 ---')
        req = urllib.request.Request(f'http://127.0.0.1:58783/api/verify-credential/{cred_id}')
        resp = urllib.request.urlopen(req)
        d = json.loads(resp.read())
        print(f'  valid: {d.get("valid")}')
        print(f'  verify_time: {d.get("verify_time")}')
        print(f'  message: {d.get("message")}')
        
        # 测试追溯
        print('\n--- 追溯接口 ---')
        req = urllib.request.Request(f'http://127.0.0.1:58783/api/credential-trace/{cred_id}')
        resp = urllib.request.urlopen(req)
        d = json.loads(resp.read())
        checks = [
            ('service_record', d.get('service_record')),
            ('steps', d.get('steps')),
            ('audit_logs', d.get('audit_logs')),
            ('chain_info', d.get('chain_info')),
        ]
        for k, v in checks:
            if v:
                if isinstance(v, list):
                    print(f'  ✅ {k}: {len(v)} 项')
                elif isinstance(v, dict):
                    print(f'  ✅ {k}: {list(v.keys())}')
                else:
                    print(f'  ✅ {k}: {v}')
            else:
                print(f'  ❌ {k}: 不存在')

if __name__ == '__main__':
    test_face_verify()
    test_material_check()
    test_cross_dept()
    test_credential_api()
    print('\n✅ 所有 API 测试完成')
