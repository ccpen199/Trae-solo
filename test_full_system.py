import requests
import json

BASE_URL = 'http://127.0.0.1:59043'

def login(u, p):
    r = requests.post(f'{BASE_URL}/api/auth/login', json={'username':u,'password':p})
    return r.json()['data']['token']

def print_section(title):
    print(f'\n{"="*60}')
    print(f'  {title}')
    print(f'{"="*60}\n')

def test_customer_type_dashboard():
    """测试1: 四类客群身份边界与数据口径拆分"""
    print_section('测试1: 四类客群身份边界与数据口径拆分')
    
    test_cases = [
        ('zhangsan', '个人用户(individual)'),
        ('zhaofamily', '家庭用户(family)'),
        ('huawei_co', '企业用户(enterprise)'),
        ('guangzhou_park', '园区用户(park)'),
        ('admin', '系统管理员(admin)'),
    ]
    
    for username, desc in test_cases:
        tok = login(username, 'password123')
        r = requests.get(f'{BASE_URL}/api/energy/dashboard', headers={'Authorization': f'Bearer {tok}'})
        resp = r.json()
        if not resp.get('success'):
            print(f'❌ {desc}: 接口错误 - {resp.get("error")}')
            continue
            
        d = resp['data']
        
        customer_type = d.get('customerType')
        is_admin = d.get('isAdmin', False)
        stats = d.get('stats', [])
        has_meter = d.get('meterRealtime') is not None
        has_weather = d.get('weather') is not None
        has_alerts = d.get('deviceAlerts') is not None
        
        print(f'✅ {desc}:')
        print(f'   客群类型: {customer_type}, 管理员: {is_admin}')
        print(f'   统计卡片数: {len(stats)}')
        print(f'   电表数据: {has_meter}, 气象数据: {has_weather}, 设备告警: {has_alerts}')
        
        # 验证统计卡片内容是否与客群匹配
        if stats:
            stat_labels = [s.get('label', '') for s in stats]
            print(f'   统计卡片: {", ".join(stat_labels[:4])}')

def test_compliance_module():
    """测试2: 合规审计模块完整链路"""
    print_section('测试2: 合规审计模块完整链路')
    
    tok = login('huawei_co', 'password123')
    headers = {'Authorization': f'Bearer {tok}'}
    
    # 2.1 电价核查
    print('2.1 电价核查:')
    r = requests.get(f'{BASE_URL}/api/compliance/price-audit', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    data = resp['data']
    audit_results = data.get('auditResults', [])
    print(f'   核查账单数: {len(audit_results)}, 异常数: {data.get("anomalyCount", 0)}')
    print(f'   总偏差金额: {data.get("totalDeviation", 0)} 元')
    if audit_results:
        ar = audit_results[0]
        print(f'   首个核查: 账单期={ar.get("billing_period")}, 状态={ar.get("status")}')
        if ar.get('priceChecks'):
            print(f'   分时段核查: {len(ar["priceChecks"])} 项')
    
    # 2.2 补贴管理
    print('\n2.2 补贴管理:')
    r = requests.get(f'{BASE_URL}/api/compliance/subsidies', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    subsidies = resp['data']
    print(f'   补贴记录数: {len(subsidies)}')
    if subsidies:
        s = subsidies[0]
        print(f'   首个补贴: 类型={s.get("type")}, 金额={s.get("amount")}, 状态={s.get("status")}')
        
        # 补贴时间线
        r = requests.get(f'{BASE_URL}/api/compliance/subsidies/{s["id"]}/timeline', headers=headers)
        resp = r.json()
        if resp.get('success'):
            tl = resp['data'].get('timeline', [])
            print(f'   补贴时间线: {len(tl)} 个阶段')
            for t in tl[:3]:
                print(f'     - {t.get("label")}: {t.get("time")}')
    
    # 2.3 绿色权益
    print('\n2.3 绿色权益:')
    r = requests.get(f'{BASE_URL}/api/compliance/green-rights', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    data = resp['data']
    records = data.get('records', [])
    print(f'   权益记录数: {len(records)}')
    if records:
        gr = records[0]
        print(f'   首个权益: 类型={gr.get("type")}, 额度={gr.get("value")}, 状态={gr.get("status")}')
        
        # 权益追踪
        r = requests.get(f'{BASE_URL}/api/compliance/green-rights/{gr["id"]}/trace', headers=headers)
        resp = r.json()
        if resp.get('success'):
            trace = resp['data'].get('trace', [])
            print(f'   权益追踪: {len(trace)} 条记录')
            for t in trace[:3]:
                print(f'     - {t.get("action")}: {t.get("details")}')

def test_energy_business_closure():
    """测试3: 综合能源区域业务闭环"""
    print_section('测试3: 综合能源区域业务闭环')
    
    tok = login('huawei_co', 'password123')
    headers = {'Authorization': f'Bearer {tok}'}
    
    # 3.1 能效诊断报告
    print('3.1 能效诊断报告:')
    r = requests.get(f'{BASE_URL}/api/energy/reports', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
    else:
        reports = resp['data']
        print(f'   报告数量: {len(reports)}')
        if reports:
            report = reports[0]
            print(f'   报告ID={report.get("id")}, 评分={report.get("efficiency_score")}, 状态={report.get("status")}')
            print(f'   创建时间={report.get("created_at")}')
    
    # 3.2 光伏接入方案
    print('\n3.2 光伏接入方案:')
    r = requests.get(f'{BASE_URL}/api/energy/pv-plans', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
    else:
        plans = resp['data']
        print(f'   方案数量: {len(plans)}')
        if plans:
            plan = plans[0]
            print(f'   方案ID={plan.get("id")}, 装机容量={plan.get("recommended_capacity")}kW')
            print(f'   投资金额={plan.get("investment_cost")}万, 回收期={plan.get("payback_years")}年, 状态={plan.get("status")}')
    
    # 3.3 碳足迹记录
    print('\n3.3 碳足迹记录:')
    r = requests.get(f'{BASE_URL}/api/energy/carbon-records', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
    else:
        records = resp['data']
        print(f'   碳足迹记录数: {len(records)}')
        if records:
            rec = records[0]
            print(f'   记录ID={rec.get("id")}, 碳排放={rec.get("total_carbon")}kgCO2')
            print(f'   计算时间={rec.get("created_at")}')
    
    # 3.4 设备预警
    print('\n3.4 设备预警:')
    r = requests.get(f'{BASE_URL}/api/energy/device-alerts', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
    else:
        alerts = resp['data']
        print(f'   设备预警数: {len(alerts)}')
        if alerts:
            alert = alerts[0]
            print(f'   预警ID={alert.get("id")}, 严重程度={alert.get("severity")}')
            print(f'   设备={alert.get("device_name")}, 状态={alert.get("status")}')

def test_electricity_service():
    """测试4: 用电服务中枢闭环"""
    print_section('测试4: 用电服务中枢闭环')
    
    tok = login('huawei_co', 'password123')
    headers = {'Authorization': f'Bearer {tok}'}
    
    # 4.1 电费查询
    print('4.1 电费查询:')
    r = requests.get(f'{BASE_URL}/api/electricity/bills', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    bills = resp['data']
    print(f'   账单数量: {len(bills)}')
    if bills:
        bill = bills[0]
        print(f'   账期={bill.get("billing_period")}, 总电量={bill.get("total_kwh")}kWh')
        print(f'   总金额={bill.get("total_amount")}元, 状态={bill.get("status")}')
        print(f'   峰谷平: 峰={bill.get("peak_kwh")}kWh, 谷={bill.get("valley_kwh")}kWh, 平={bill.get("flat_kwh")}kWh')
    
    # 4.2 实时电价
    print('\n4.2 实时电价:')
    r = requests.get(f'{BASE_URL}/api/electricity/price-tariff', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    price = resp['data']
    print(f'   当前时段: {price.get("currentPeriod")}')
    tariffs = price.get('tariffs', [])
    if not tariffs:
        tariffs = [price] if price.get('tariffs') is None else []
    for p in (price.get('tariffs') or []):
        print(f'   {p.get("period_type")}: {p.get("price_per_kwh")}元/kWh')
    
    # 4.3 电表实时数据
    print('\n4.3 电表实时数据:')
    r = requests.get(f'{BASE_URL}/api/electricity/meter-realtime', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    meter = resp['data']
    print(f'   表号={meter.get("meter_no")}, 读数={meter.get("reading_kwh")}kWh')
    print(f'   电压={meter.get("voltage")}V, 电流={meter.get("current")}A, 功率因数={meter.get("power_factor")}')
    
    # 4.4 停电通知
    print('\n4.4 停电通知:')
    r = requests.get(f'{BASE_URL}/api/electricity/outages', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    outages = resp['data']
    print(f'   停电通知数: {len(outages)}')
    if outages:
        o = outages[0]
        print(f'   通知ID={o.get("id")}, 类型={o.get("type")}, 状态={o.get("status")}')
        print(f'   影响用户={o.get("affected_users")}户')

def test_knowledge_base():
    """测试5: 资讯知识模块"""
    print_section('测试5: 资讯知识模块')
    
    tok = login('zhangsan', 'password123')
    headers = {'Authorization': f'Bearer {tok}'}
    
    # 5.1 政策原文库
    print('5.1 政策原文库:')
    r = requests.get(f'{BASE_URL}/api/knowledge/policies', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    policies = resp['data']
    print(f'   政策数量: {len(policies)}')
    if policies:
        p = policies[0]
        print(f'   标题={p.get("title")}, 分类={p.get("category")}')
        print(f'   标签={p.get("tags")}, 发布日期={p.get("publish_date")}')
    
    # 5.2 安全百科
    print('\n5.2 安全百科:')
    r = requests.get(f'{BASE_URL}/api/knowledge/safety', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    entries = resp['data']
    print(f'   百科条目数: {len(entries)}')
    if entries:
        e = entries[0]
        print(f'   标题={e.get("title")}, 分类={e.get("category")}')
        print(f'   标签={e.get("tags")}, 阅读量={e.get("view_count")}')
    
    # 5.3 专家直播回放
    print('\n5.3 专家直播回放:')
    r = requests.get(f'{BASE_URL}/api/knowledge/expert-sessions', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    sessions = resp['data']
    print(f'   直播回放数: {len(sessions)}')
    if sessions:
        s = sessions[0]
        print(f'   标题={s.get("title")}, 专家={s.get("expert")}')
        print(f'   时长={s.get("duration")}分钟, 观看人数={s.get("viewers")}')

def test_smartlife():
    """测试6: 智慧生活模块"""
    print_section('测试6: 智慧生活模块')
    
    tok = login('zhangsan', 'password123')
    headers = {'Authorization': f'Bearer {tok}'}
    
    # 6.1 智能设备
    print('6.1 智能设备:')
    r = requests.get(f'{BASE_URL}/api/smartlife/devices', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    devices = resp['data']
    print(f'   设备数量: {len(devices)}')
    if devices:
        d = devices[0]
        print(f'   设备名={d.get("device_name")}, 类型={d.get("device_type")}')
        print(f'   状态={d.get("status")}, 能耗={d.get("power_consumption")}W')
    
    # 6.2 积分商城商品:
    print('\n6.2 积分商城商品:')
    r = requests.get(f'{BASE_URL}/api/smartlife/mall', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    items = resp['data']
    print(f'   商品数量: {len(items)}')
    if items:
        item = items[0]
        print(f'   商品={item.get("name")}, 积分={item.get("points_cost")}')
        print(f'   库存={item.get("stock")}')
    
    # 6.3 兑换订单
    print('\n6.3 兑换订单:')
    r = requests.get(f'{BASE_URL}/api/smartlife/redemption-orders', headers=headers)
    resp = r.json()
    if not resp.get('success'):
        print(f'   错误: {resp.get("error")}')
        return
        
    orders_data = resp['data']
    orders = orders_data.get('list', [])
    print(f'   订单数量: {len(orders)}')
    if orders:
        o = orders[0]
        print(f'   订单={o.get("item_name")}, 数量={o.get("quantity")}')
        print(f'   状态={o.get("status")}, 消耗积分={o.get("points_cost")}')

def main():
    print('\n' + '='*60)
    print('  南方电网能源服务数字生态平台 - 完整系统测试')
    print('='*60)
    
    test_customer_type_dashboard()
    test_compliance_module()
    test_energy_business_closure()
    test_electricity_service()
    test_knowledge_base()
    test_smartlife()
    
    print_section('测试完成')
    print('✅ 所有模块测试已执行，请检查各模块输出是否正常\n')

if __name__ == '__main__':
    main()
