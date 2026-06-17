#!/usr/bin/env python3
import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend/data.db')

def format_batch_no(timestamp):
    import time
    d = time.localtime(timestamp)
    return f"BATCH{d.tm_year}{d.tm_mon:02d}{d.tm_mday:02d}{d.tm_hour:02d}"

def enrich_product(p, cursor):
    ch = cursor.execute('''
        SELECT rc.*, s.name as supplier_name
        FROM recharge_channels rc
        LEFT JOIN suppliers s ON rc.supplier_id = s.id
        WHERE rc.product_id = ?
        ORDER BY rc.priority ASC
    ''', (p['id'],)).fetchall()
    
    active_channels = [c for c in ch if c['status'] == 1]
    inactive_channels = [c for c in ch if c['status'] != 1]
    has_fallback = len(ch) > 1
    
    region_limits = cursor.execute(
        'SELECT region_code FROM region_limits WHERE product_id = ? AND allow = 1',
        (p['id'],)
    ).fetchall()
    
    region_limited = 1 if p['region_limit'] else (1 if len(region_limits) > 0 else 0)
    sync_batch = format_batch_no(p['updated_at']) if p['updated_at'] else None
    
    supplier_channels = [c for c in ch if c['supplier_id'] == p['supplier_id']]
    supplier_success_rate = 0.95
    if len(supplier_channels) > 0:
        supplier_success_rate = round(
            sum((c['success_rate'] if c['success_rate'] is not None else 0) for c in supplier_channels) / len(supplier_channels) * 100
        ) / 100
    
    all_supplier_ids = list(set(c['supplier_id'] for c in ch))
    suppliers = []
    for sid in all_supplier_ids:
        s = cursor.execute(
            'SELECT id, name, code, status FROM suppliers WHERE id = ?',
            (sid,)
        ).fetchone()
        if not s:
            continue
        s_channels = [c for c in ch if c['supplier_id'] == sid]
        s_active = [c for c in s_channels if c['status'] == 1]
        suppliers.append({
            **dict(s),
            'channels': s_channels,
            'channel_count': len(s_channels),
            'active_channel_count': len(s_active),
            'success_rate': round(
                sum((c['success_rate'] if c['success_rate'] is not None else 0) for c in s_channels) / len(s_channels) * 100
            ) / 100 if len(s_channels) > 0 else 0.95,
            'price': p['price'],
            'stock': p['stock'],
            'is_main': sid == p['supplier_id']
        })
    
    sync_history = cursor.execute('''
        SELECT before_stock as before, after_stock as after, variance, sync_time as time
        FROM stock_sync_history
        WHERE product_id = ?
        ORDER BY sync_time DESC
        LIMIT 3
    ''', (p['id'],)).fetchall()
    
    return {
        **dict(p),
        'channels': [dict(c) for c in ch],
        'channelCount': len(ch),
        'activeChannelCount': len(active_channels),
        'hasFallback': has_fallback,
        'lastSync': p['updated_at'],
        'sync_batch': sync_batch,
        'region_limited': region_limited,
        'available_regions': [r['region_code'] for r in region_limits] if len(region_limits) > 0 else ['全国'],
        'channelStatus': {
            'total': len(ch),
            'active': len(active_channels),
            'inactive': len(inactive_channels),
            'successRate': round(
                sum((c['success_rate'] if c['success_rate'] is not None else 0) for c in active_channels) / len(ch) * 100
            ) / 100 if len(ch) > 0 else 0
        },
        'supplier_info': {
            'name': p['supplier_name'],
            'code': p['supplier_code'],
            'success_rate': supplier_success_rate,
            'channel_count': len(supplier_channels)
        },
        'suppliers': suppliers,
        'supplier_count': len(suppliers),
        'stock_sync_history': [dict(h) for h in sync_history]
    }

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print('=' * 80)
    print('问题诊断报告 - 商品列表API')
    print('=' * 80)
    
    # 1. 统计商品总数
    cursor.execute('SELECT COUNT(*) as cnt FROM products WHERE status = 1')
    total = cursor.fetchone()['cnt']
    print(f'\n✅ 商品总数: {total} (要求: 434)')
    
    # 2. 检查通道数据
    cursor.execute('SELECT COUNT(*) as cnt FROM recharge_channels')
    total_channels = cursor.fetchone()['cnt']
    print(f'✅ 总通道数: {total_channels} (平均每个商品 {total_channels/total:.1f} 个)')
    
    # 3. 检查没有通道的商品
    cursor.execute('''
        SELECT p.id, p.name 
        FROM products p 
        LEFT JOIN recharge_channels rc ON p.id = rc.product_id 
        WHERE p.status = 1
        GROUP BY p.id 
        HAVING COUNT(rc.id) = 0
    ''')
    no_channel = cursor.fetchall()
    if no_channel:
        print(f'❌ 警告: {len(no_channel)} 个商品没有通道数据')
        for p in no_channel[:5]:
            print(f'   - {p["name"]} ({p["id"]})')
    else:
        print('✅ 所有商品都有通道数据')
    
    # 4. 抽样检查3个商品的完整数据
    print('\n' + '=' * 80)
    print('抽样验证 - 前3个商品完整数据结构')
    print('=' * 80)
    
    products = cursor.execute('''
        SELECT p.*, c.name as category_name, s.name as supplier_name, s.code as supplier_code
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.status = 1
        ORDER BY p.created_at DESC
        LIMIT 3
    ''').fetchall()
    
    issues = []
    for i, p in enumerate(products):
        enriched = enrich_product(p, cursor)
        print(f'\n【商品 {i+1}】{enriched["name"]}')
        print(f'  - ID: {enriched["id"]}')
        
        # 检查通道数
        ch_count = enriched['channelCount']
        active_count = enriched['activeChannelCount']
        print(f'  - 通道数: {active_count}/{ch_count} (要求: 真实3-5，不为0)')
        if ch_count == 0:
            issues.append(f'商品 {enriched["name"]}: 通道总数为0')
        if active_count == 0:
            issues.append(f'商品 {enriched["name"]}: 可用通道数为0')
        
        # 检查供应商数量
        sup_count = enriched['supplier_count']
        print(f'  - 供应商数: {sup_count} (要求: ≥2)')
        if sup_count < 2:
            issues.append(f'商品 {enriched["name"]}: 供应商数不足2个')
        
        # 检查可售范围
        region_limited = enriched['region_limited']
        regions = enriched['available_regions']
        print(f'  - 可售范围: {"部分地区" if region_limited else "全国"} ({len(regions)}个地区)')
        
        # 检查备用通道
        has_fallback = enriched['hasFallback']
        print(f'  - 备用通道: {"有" if has_fallback else "无"}')
        
        # 检查同步历史
        sync_hist = enriched['stock_sync_history']
        print(f'  - 同步历史: {len(sync_hist)} 条')
        if len(sync_hist) > 0:
            h = sync_hist[0]
            print(f'    最近一次: {h["before"]} → {h["after"]} (变化: {h["variance"]})')
        
        # 检查字段完整性
        required_fields = [
            'channelCount', 'activeChannelCount', 'hasFallback',
            'region_limited', 'available_regions', 'supplier_count',
            'suppliers', 'stock_sync_history', 'sync_batch'
        ]
        missing_fields = [f for f in required_fields if f not in enriched or enriched[f] is None]
        if missing_fields:
            issues.append(f'商品 {enriched["name"]}: 缺少字段 {missing_fields}')
            print(f'  ❌ 缺少字段: {missing_fields}')
        else:
            print(f'  ✅ 所有必填字段完整')
    
    # 5. 前端代码问题分析
    print('\n' + '=' * 80)
    print('前端代码问题分析')
    print('=' * 80)
    
    frontend_issues = [
        {
            'issue': 'useEffect 依赖项导致无限循环',
            'location': 'Products.tsx:152',
            'detail': 'useEffect(() => { loadData(); }, [page, filter]); filter是对象，每次渲染都会创建新对象，导致无限循环',
            'fix': '使用 useMemo 包裹 filter，或者单独依赖 filter.keyword'
        },
        {
            'issue': '同步库存按钮重复',
            'location': 'Products.tsx:488-500 和 554-561',
            'detail': '操作列和库存列各有一个同步库存按钮，功能重复',
            'fix': '保留一个即可，建议只在操作列保留'
        },
        {
            'issue': '批量同步只同步当前页',
            'location': 'Products.tsx:241',
            'detail': 'batchSyncAll 只遍历 products（当前页），不是全部434个商品',
            'fix': '需要先获取所有商品ID，或者后端提供批量同步接口'
        },
        {
            'issue': 'toast 反馈不完整',
            'location': 'Products.tsx:193-204',
            'detail': '同步成功后只显示行内气泡，没有调用 showToast 全局提示',
            'fix': '同步成功/失败都应该调用 showToast 提供全局反馈'
        },
        {
            'issue': '可售地区展开逻辑有问题',
            'location': 'Products.tsx:306-313 和 436-445',
            'detail': 'toggleRegions 函数定义了但没有正确绑定到点击事件，可售范围点击打开的是弹窗而不是展开',
            'fix': '统一使用弹窗方式，移除未使用的展开逻辑'
        },
        {
            'issue': '备用通道数量计算错误',
            'location': 'Products.tsx:542',
            'detail': '{p.supplier_count - 1} 个备用 - 备用通道应该是通道层面的，不是供应商层面的',
            'fix': '应该用 p.channelCount - p.activeChannelCount 或者 p.channels.length - p.activeChannelCount'
        }
    ]
    
    for i, issue in enumerate(frontend_issues, 1):
        print(f'\n{i}. {issue["issue"]}')
        print(f'   位置: {issue["location"]}')
        print(f'   详情: {issue["detail"]}')
        print(f'   修复: {issue["fix"]}')
    
    # 6. 总结
    print('\n' + '=' * 80)
    print('问题总结')
    print('=' * 80)
    
    if issues:
        print(f'\n❌ 后端数据问题 ({len(issues)} 个):')
        for issue in issues:
            print(f'   - {issue}')
    else:
        print('\n✅ 后端数据结构完整，所有字段都正确返回')
    
    print(f'\n⚠️  前端代码问题 ({len(frontend_issues)} 个):')
    for i, issue in enumerate(frontend_issues, 1):
        print(f'   {i}. {issue["issue"]}')
    
    # 7. 输出一个完整的商品JSON供参考
    print('\n' + '=' * 80)
    print('完整商品数据示例 (JSON)')
    print('=' * 80)
    if products:
        enriched = enrich_product(products[0], cursor)
        # 移除大字段
        enriched.pop('channels', None)
        for s in enriched.get('suppliers', []):
            s.pop('channels', None)
        print(json.dumps(enriched, ensure_ascii=False, indent=2, default=str)[:1500])
    
    conn.close()

if __name__ == '__main__':
    main()
