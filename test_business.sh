#!/bin/zsh
BASE="http://127.0.0.1:59057"

echo "=== 1. 测试多维度筛选（情人节 + 价格带 0-300） ==="
curl -sS --max-time 5 "$BASE/api/products?festival=情人节&minPrice=0&maxPrice=300&pageSize=2"
echo ""
echo ""

echo "=== 2. 测试创建订单 ==="
ORDER_RESULT=$(curl -sS --max-time 5 -X POST "$BASE/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"shopId":1,"items":[{"productId":1,"quantity":1,"price":299}],"totalAmount":299,"recipientName":"李四","recipientPhone":"13900139000","recipientAddress":"北京市海淀区中关村大街1号","recipientLat":39.9847,"recipientLng":116.3046,"deliveryType":"instant","expectedDeliveryTime":"2026-06-05T17:00:00.000Z"}')
echo $ORDER_RESULT
ORDER_ID=$(echo $ORDER_RESULT | sed 's/.*"id":"\([^"]*\)".*/\1/')
echo "Order ID: $ORDER_ID"
echo ""

echo "=== 3. 测试智能分单 ==="
curl -sS --max-time 5 -X POST "$BASE/api/dispatch/assign/$ORDER_ID"
echo ""
echo ""

echo "=== 4. 测试更新订单状态（花店接单） ==="
curl -sS --max-time 5 -X PUT "$BASE/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted"}'
echo ""
echo ""

echo "=== 5. 测试花材损耗登记 ==="
curl -sS --max-time 5 -X POST "$BASE/api/inventory/wastage" \
  -H "Content-Type: application/json" \
  -d '{"shopId":1,"productId":1,"batchNo":"BATCH-0001-202606","quantity":5,"reason":"鲜花枯萎，保鲜期到期"}'
echo ""
echo ""

echo "=== 6. 测试配送异常上报 ==="
curl -sS --max-time 5 -X POST "$BASE/api/exceptions" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"$ORDER_ID\",\"type\":\"rejected\",\"description\":\"收件人拒收，花材与图片不符\",\"evidence\":\"data:image/jpeg;base64,/9j/4AAQSkZJRg...\",\"reportedBy\":2}"
echo ""
echo ""

echo "=== 7. 测试售后自动赔付（超时75分钟） ==="
curl -sS --max-time 5 -X POST "$BASE/api/claims/auto" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"$ORDER_ID\",\"type\":\"timeout\",\"delayMinutes\":75}"
echo ""
echo ""

echo "=== 8. 测试区域热销榜（北京市） ==="
curl -sS --max-time 5 "$BASE/api/admin/hot-products?city=北京市&pageSize=3"
echo ""
echo ""

echo "=== 9. 测试花店评级 ==="
curl -sS --max-time 5 "$BASE/api/admin/ratings?pageSize=3"
echo ""
