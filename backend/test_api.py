import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 50)
print("Testing Backend API")
print("=" * 50)

# 1. Test health check
print("\n1. Health check...")
response = client.get("/health")
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}")

# 2. Test login
print("\n2. Login test (supplier/123456)...")
response = client.post("/api/auth/login?username=supplier&password=123456")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    token = data.get("access_token")
    print(f"   ✓ Login successful!")
    print(f"   User: {data.get('user', {}).get('name')}")
    print(f"   Role: {data.get('user', {}).get('role')}")

    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Test me endpoint
    print("\n3. Get current user...")
    response = client.get("/api/auth/me", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   User: {response.json()}")
    
    # 4. Create an order
    print("\n4. Create asset registration order...")
    order_data = {
        "total_amount": 100000.00,
        "expected_completion_date": "2025-12-31",
        "priority": 0,
        "description": "Test order",
        "details": [
            {"item_name": "Test Product", "quantity": 100, "unit_price": 1000.00}
        ]
    }
    response = client.post("/api/orders/", json=order_data, headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        order = response.json()
        order_id = order.get("id")
        order_no = order.get("order_no")
        print(f"   ✓ Order created!")
        print(f"   Order ID: {order_id}")
        print(f"   Order No: {order_no}")
        print(f"   Status: {order.get('status')}")
        
        # 5. Submit the order
        print("\n5. Submit order...")
        response = client.post(f"/api/orders/{order_id}/submit?comment=Submit test", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            order = response.json()
            print(f"   ✓ Order submitted!")
            print(f"   New status: {order.get('status')}")
        else:
            print(f"   Error: {response.text}")
        
        # 6. Get dashboard
        print("\n6. Get dashboard...")
        response = client.get("/api/reports/dashboard", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Dashboard: {response.json()}")
        
        # 7. Get allowed actions
        print("\n7. Get allowed actions...")
        response = client.get(f"/api/orders/{order_id}/allowed-actions", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Actions: {response.json()}")

    else:
        print(f"   Error: {response.text}")

print("\n" + "=" * 50)
print("Test completed!")
print("=" * 50)
