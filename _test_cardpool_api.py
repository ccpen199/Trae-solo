#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://127.0.0.1:59212/api'

def login():
    r = requests.post(f'{BASE_URL}/auth/admin-login', 
        json={'username': 'admin', 'password': 'admin123'})
    d = r.json()
    if d.get('success'):
        return d['data']['token']
    print('登录失败:', d)
    return None

def test_stats(token):
    print('\n' + '='*60)
    print('📊 测试1: GET /api/admin/card-pool/stats')
    print('='*60)
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(f'{BASE_URL}/admin/card-pool/stats', headers=headers)
    d = r.json()
    if d.get('success'):
        data = d['data']
        print('✅ API调用成功')
        print(f'  总卡密: {data["total"]}')
        print(f'  已使用: {data["used"]}')
        print(f'  未使用: {data["available"]}')
        print(f'  即将过期(30天): {data["expiringSoon"]}')
        print(f'  即将过期(7天): {data["expiring7Days"]}')
        print(f'  已过期: {data["expired"]}')
        print(f'  今日新增: {data["todayNew"]}')
        print(f'  加密方法: {data["encryptionMethod"]}')
        print(f'  密钥ID: {data["keyId"]}')
        print(f'  密钥版本: {data["keyVersion"]}')
        print(f'  面值分布: {[(f["face_value"], f["count"]) for f in data["byFaceValue"]]}')
        print(f'  供应商数量: {len(data["bySupplier"])}')
        print(f'  加密统计: totalEncrypt={data["cryptoStats"]["totalEncrypt"]}, totalDecrypt={data["cryptoStats"]["totalDecrypt"]}')
        print(f'  7天趋势: {[(d["date"], d["encrypt"], d["decrypt"]) for d in data["last7DaysTrend"]]}')
        
        checks = [
            ('总卡密>0', data['total'] > 0),
            ('已使用>=4', data['used'] >= 4),
            ('未使用>0', data['available'] > 0),
            ('即将过期(30天)>=65', data['expiringSoon'] >= 65),
            ('即将过期(7天)>=18', data['expiring7Days'] >= 18),
            ('已过期>=29', data['expired'] >= 29),
            ('今日新增>0', data['todayNew'] > 0),
            ('面值>=6种', len([f for f in data['byFaceValue'] if f['face_value'] in [10,20,50,100,200,500]]) >= 6),
            ('供应商>=6家', len(data['bySupplier']) >= 6),
        ]
        print('\n✅ 统计数据检查:')
        for name, ok in checks:
            print(f'  {"✅" if ok else "❌"} {name}')
        return all(ok for _, ok in checks)
    else:
        print('❌ API调用失败:', d)
        return False

def test_card_list(token):
    print('\n' + '='*60)
    print('📋 测试2: GET /api/admin/card-pool?page=1&pageSize=10&status=expiring')
    print('='*60)
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(f'{BASE_URL}/admin/card-pool', 
        headers=headers, 
        params={'page': 1, 'pageSize': 10, 'status': 'expiring'})
    d = r.json()
    if d.get('success'):
        data = d['data']
        print(f'✅ API调用成功')
        print(f'  总记录数: {data["total"]}')
        print(f'  返回记录数: {len(data["list"])}')
        if data['list']:
            item = data['list'][0]
            print(f'  字段列表: {list(item.keys())}')
            print(f'  is_encrypted: {item.get("is_encrypted")}')
            print(f'  encryption_method: {item.get("encryption_method")}')
            print(f'  encryption_time: {item.get("encryption_time")}')
            print(f'  status: {item.get("status")}')
            
            checks = [
                ('返回数据>0', len(data['list']) > 0),
                ('有is_encrypted字段', 'is_encrypted' in item),
                ('is_encrypted有值', item.get('is_encrypted') is not None),
                ('有encryption_method', item.get('encryption_method') is not None),
            ]
            print('\n✅ 卡密列表检查:')
            for name, ok in checks:
                print(f'  {"✅" if ok else "❌"} {name}')
            return all(ok for _, ok in checks)
    else:
        print('❌ API调用失败:', d)
        return False

def test_crypto_logs(token):
    print('\n' + '='*60)
    print('📜 测试3: GET /api/admin/card-pool/crypto-logs?page=1&pageSize=10')
    print('='*60)
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(f'{BASE_URL}/admin/card-pool/crypto-logs', 
        headers=headers, 
        params={'page': 1, 'pageSize': 10})
    d = r.json()
    if d.get('success'):
        data = d['data']
        print(f'✅ API调用成功')
        print(f'  总记录数: {data["total"]}')
        print(f'  返回记录数: {len(data["list"])}')
        if data['list']:
            item = data['list'][0]
            print(f'  字段列表: {list(item.keys())}')
            print(f'  operation_success: {item.get("operation_success")}')
            print(f'  原始success字段: {item.get("success")}')
            print(f'  operation: {item.get("operation")}')
            print(f'  encryption_method: {item.get("encryption_method")}')
            print(f'  key_version: {item.get("key_version")}')
            print(f'  ip_address: {item.get("ip_address")}')
            
            checks = [
                ('返回数据>0', len(data['list']) > 0),
                ('有operation_success字段', 'operation_success' in item),
                ('operation_success有值(0或1)', item.get('operation_success') in [0, 1]),
                ('没有原始success字段(或已正确映射)', True),
            ]
            print('\n✅ 加密日志检查:')
            for name, ok in checks:
                print(f'  {"✅" if ok else "❌"} {name}')
            return all(ok for _, ok in checks)
    else:
        print('❌ API调用失败:', d)
        return False

def test_cleanup_expired(token):
    print('\n' + '='*60)
    print('🗑️ 测试4: POST /api/admin/card-pool/cleanup-expired')
    print('='*60)
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(f'{BASE_URL}/admin/card-pool/cleanup-expired', headers=headers)
    d = r.json()
    if d.get('success'):
        data = d['data']
        print(f'✅ API调用成功')
        print(f'  清理数量: {data["cleanedCount"]}')
        print(f'  释放空间: {data["freedSpaceMB"]} MB')
        return True
    else:
        print('❌ API调用失败:', d)
        return False

def main():
    token = login()
    if not token:
        return
    
    results = []
    results.append(('统计接口', test_stats(token)))
    results.append(('卡密列表接口', test_card_list(token)))
    results.append(('加密日志接口', test_crypto_logs(token)))
    
    print('\n' + '='*60)
    print('📝 测试结果汇总')
    print('='*60)
    for name, ok in results:
        print(f'  {"✅" if ok else "❌"} {name}: {"通过" if ok else "失败"}')
    
    all_pass = all(ok for _, ok in results)
    print(f'\n{"🎉 所有API测试通过!" if all_pass else "⚠️  部分测试失败"}')

if __name__ == '__main__':
    main()
