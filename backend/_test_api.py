#!/usr/bin/env python3
"""API 接口测试脚本"""
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:59212/api"

def api_get(path):
    try:
        with urllib.request.urlopen(f"{BASE_URL}{path}") as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as e:
        return 0, {"error": str(e)}

def api_post(path, data):
    try:
        req = urllib.request.Request(
            f"{BASE_URL}{path}",
            data=json.dumps(data).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as e:
        return 0, {"error": str(e)}

def test_health():
    print("=== 1. 健康检查 ===")
    status, data = api_get("/health")
    print(f"  状态码: {status}")
    print(f"  success: {data.get('success')}")
    print(f"  ✅ 通过" if data.get("success") else f"  ❌ 失败: {data}")
    print()

def test_products_list():
    print("=== 2. 商品列表接口 ===")
    status, data = api_get("/products?pageSize=3&page=1")
    print(f"  状态码: {status}")
    print(f"  success: {data.get('success')}")
    
    if data.get("success"):
        result = data["data"]
        print(f"  总数: {result.get('total')}")
        print(f"  每页: {result.get('pageSize')}")
        
        items = result.get("list", [])
        if items:
            p = items[0]
            print(f"\n  第一个商品字段检查:")
            print(f"    ✅ name: {p.get('name')}")
            print(f"    ✅ price: {p.get('price')}")
            print(f"    ✅ channelCount: {p.get('channelCount')}")
            print(f"    ✅ activeChannelCount: {p.get('activeChannelCount')}")
            print(f"    ✅ hasFallback: {p.get('hasFallback')}")
            print(f"    ✅ lastSync: {p.get('lastSync')}")
            print(f"    ✅ sync_batch: {p.get('sync_batch')}")
            print(f"    ✅ region_limited: {p.get('region_limited')}")
            print(f"    ✅ available_regions: {p.get('available_regions')}")
            print(f"    ✅ channelStatus: {p.get('channelStatus')}")
        print(f"  ✅ 通过")
    else:
        print(f"  ❌ 失败: {data}")
    print()
    return items[0]["id"] if data.get("success") and result.get("list") else None

def test_products_hot():
    print("=== 3. 热门商品接口 ===")
    status, data = api_get("/products/hot")
    print(f"  状态码: {status}")
    print(f"  success: {data.get('success')}")
    
    if data.get("success"):
        items = data.get("data", [])
        print(f"  数量: {len(items)}")
        if items:
            p = items[0]
            print(f"\n  第一个商品字段检查:")
            print(f"    ✅ hasFallback: {p.get('hasFallback')}")
            print(f"    ✅ sync_batch: {p.get('sync_batch')}")
            print(f"    ✅ available_regions: {p.get('available_regions')}")
            print(f"    ✅ channelStatus: {p.get('channelStatus')}")
        print(f"  ✅ 通过")
    else:
        print(f"  ❌ 失败: {data}")
    print()

def test_product_detail(product_id):
    print("=== 4. 商品详情接口 ===")
    status, data = api_get(f"/products/{product_id}")
    print(f"  状态码: {status}")
    print(f"  success: {data.get('success')}")
    
    if data.get("success"):
        p = data["data"]
        print(f"\n  字段检查:")
        print(f"    ✅ name: {p.get('name')}")
        print(f"    ✅ sync_batch: {p.get('sync_batch')}")
        print(f"    ✅ available_regions: {p.get('available_regions')}")
        print(f"    ✅ region_limited: {p.get('region_limited')}")
        print(f"    ✅ supplier_info: {p.get('supplier_info')}")
        print(f"    ✅ stock_sync_history 数量: {len(p.get('stock_sync_history', []))}")
        print(f"    ✅ hasFallback: {p.get('hasFallback')}")
        print(f"    ✅ activeChannelCount: {p.get('activeChannelCount')}")
        print(f"    ✅ channelStatus: {p.get('channelStatus')}")
        print(f"    ✅ applicablePromotions: {len(p.get('applicablePromotions', []))} 个")
        
        if p.get("stock_sync_history"):
            h = p["stock_sync_history"][0]
            print(f"\n  同步历史样例:")
            print(f"    time: {h.get('time')}")
            print(f"    before: {h.get('before')}")
            print(f"    after: {h.get('after')}")
            print(f"    variance: {h.get('variance')}")
        
        print(f"  ✅ 通过")
    else:
        print(f"  ❌ 失败: {data}")
    print()

def test_calculate_price(product_id):
    print("=== 5. 价格计算接口 ===")
    
    print("  5.1 正常请求 (无token):")
    status, data = api_post("/products/calculate-price", {
        "items": [{"productId": product_id, "quantity": 2}]
    })
    print(f"    状态码: {status}")
    print(f"    success: {data.get('success')}")
    
    if data.get("success"):
        d = data["data"]
        print(f"    ✅ originalPrice: {d.get('originalPrice')}")
        print(f"    ✅ finalPrice: {d.get('finalPrice')}")
        print(f"    ✅ savedAmount: {d.get('savedAmount')}")
        print(f"    ✅ commissionEarned: {d.get('commissionEarned')}")
        print(f"    ✅ breakdown: {len(d.get('breakdown', []))} 条")
        if d.get("breakdown"):
            b = d["breakdown"][0]
            print(f"      第一条: type={b.get('type')}, name={b.get('name')}, discount={b.get('discount')}")
    else:
        print(f"    ❌ 失败: {data}")
    
    print()
    print("  5.2 空请求:")
    status, data = api_post("/products/calculate-price", {})
    print(f"    状态码: {status}")
    print(f"    success: {data.get('success')}")
    print(f"    message: {data.get('message')}")
    print(f"    ✅ 正确返回400" if status == 400 else f"    ❌ 状态码错误")
    
    print()
    print("  5.3 无效商品ID:")
    status, data = api_post("/products/calculate-price", {
        "items": [{"productId": "invalid-id", "quantity": 1}]
    })
    print(f"    状态码: {status}")
    print(f"    success: {data.get('success')}")
    print(f"    message: {data.get('message')}")
    print(f"    ✅ 正确返回400" if status == 400 else f"    ❌ 状态码错误")
    
    print()

def main():
    print("=" * 60)
    print("API 接口测试")
    print("=" * 60)
    print()
    
    test_health()
    
    product_id = test_products_list()
    
    test_products_hot()
    
    if product_id:
        test_product_detail(product_id)
        test_calculate_price(product_id)
    
    print("=" * 60)
    print("测试完成!")
    print("=" * 60)

if __name__ == "__main__":
    main()
