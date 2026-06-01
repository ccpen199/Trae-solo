#!/bin/bash
BASE_URL="http://127.0.0.1:59901/api"

echo "=== 5. 签发证照 ==="
curl -sS -X POST "$BASE_URL/certificates" \
  -H "Content-Type: application/json" \
  -d '{"template_id":1,"applicant_id":1,"certificate_data":{"姓名":"张三","性别":"男","出生日期":"1990-01-01","住址":"北京市朝阳区"},"issuing_authority":"北京市公安局","issuer":"管理员"}'

echo ""
echo ""
echo "=== 6. 获取证照列表 ==="
curl -sS "$BASE_URL/certificates"

echo ""
echo ""
echo "=== 7. 核验证照（有效） ==="
CERT_NUM=$(curl -sS "$BASE_URL/certificates" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['certificate_number'])")
echo "证照编号: $CERT_NUM"
curl -sS -X POST "$BASE_URL/verification" \
  -H "Content-Type: application/json" \
  -d "{\"certificate_number\":\"$CERT_NUM\",\"caller\":\"测试系统\",\"purpose\":\"身份核验\"}"

echo ""
echo ""
echo "=== 8. 证照延期 ==="
CERT_ID=$(curl -sS "$BASE_URL/certificates" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
curl -sS -X POST "$BASE_URL/certificates/$CERT_ID/extend" \
  -H "Content-Type: application/json" \
  -d '{"extend_days":365,"change_reason":"证照有效期延长","operator":"管理员"}'

echo ""
echo ""
echo "=== 9. 吊销证照 ==="
curl -sS -X POST "$BASE_URL/certificates/$CERT_ID/revoke" \
  -H "Content-Type: application/json" \
  -d '{"change_reason":"持证人违规","legal_basis":"《证照管理办法》第二十条","operator":"管理员"}'

echo ""
echo ""
echo "=== 10. 核验证照（已吊销） ==="
curl -sS -X POST "$BASE_URL/verification" \
  -H "Content-Type: application/json" \
  -d "{\"certificate_number\":\"$CERT_NUM\",\"caller\":\"测试系统\",\"purpose\":\"身份核验\"}"

echo ""
echo ""
echo "=== 11. 查看核验日志 ==="
curl -sS "$BASE_URL/verification/logs?pageSize=10"
