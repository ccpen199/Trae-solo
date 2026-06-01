#!/bin/bash
BASE_URL="http://127.0.0.1:59901/api"

echo "========================================"
echo "电子证照管理系统 - 完整自测场景"
echo "========================================"

echo ""
echo "=== 场景1: 模板变更不影响已签发证照 ==="
echo "1.1 创建新模板"
curl -sS -X POST "$BASE_URL/templates" \
  -H "Content-Type: application/json" \
  -d '{"template_code":"LIC-001","template_name":"营业执照","certificate_type":"经营证照","fields":[{"name":"企业名称","type":"string","required":true}],"validity_period":5,"validity_unit":"year","created_by":"admin"}'

echo ""
echo "1.2 创建企业申请人"
curl -sS -X POST "$BASE_URL/applicants" \
  -H "Content-Type: application/json" \
  -d '{"applicant_name":"某某科技有限公司","id_type":"统一社会信用代码","id_number":"91110000MA001ABCDE","phone":"010-12345678"}' 2>/dev/null || echo "申请人已存在"

echo ""
echo "1.3 签发营业执照"
NEW_APP_ID=$(curl -sS "$BASE_URL/applicants" | python3 -c "import sys,json; data=json.load(sys.stdin)['data']; print([x['id'] for x in data if '科技' in x['applicant_name']][0])")
echo "申请人ID: $NEW_APP_ID"
curl -sS -X POST "$BASE_URL/certificates" \
  -H "Content-Type: application/json" \
  -d "{\"template_id\":2,\"applicant_id\":$NEW_APP_ID,\"certificate_data\":{\"企业名称\":\"某某科技有限公司\"},\"issuing_authority\":\"市场监督管理局\",\"issuer\":\"审批员\"}"

echo ""
echo "1.4 查看已签发证照的模板版本"
CERT_ID=$(curl -sS "$BASE_URL/certificates" | python3 -c "import sys,json; data=json.load(sys.stdin)['data']; print([x['id'] for x in data if x['template_name']=='营业执照'][0])")
echo "新证照ID: $CERT_ID"
curl -sS "$BASE_URL/certificates/$CERT_ID" | python3 -c "
import sys,json
data=json.load(sys.stdin)['data']
print(f'模板版本: v{data[\"template_version\"]}')
print(f'证照数据: {data[\"certificate_data\"]}')
"

echo ""
echo "1.5 更新模板（增加字段）"
curl -sS -X PUT "$BASE_URL/templates/2" \
  -H "Content-Type: application/json" \
  -d '{"template_name":"营业执照（新版）","fields":[{"name":"企业名称","type":"string","required":true},{"name":"注册资本","type":"string","required":true}],"change_reason":"增加注册资本字段","changed_by":"admin"}'

echo ""
echo "1.6 验证模板版本已升级"
curl -sS "$BASE_URL/templates/2" | python3 -c "
import sys,json
data=json.load(sys.stdin)['data']
print(f'新模板版本: v{data[\"version\"]}')
print(f'新字段数: {len(data[\"fields\"])}')
"

echo ""
echo "1.7 验证已签发证照仍使用旧版本模板"
curl -sS "$BASE_URL/certificates/$CERT_ID" | python3 -c "
import sys,json
data=json.load(sys.stdin)['data']
print(f'证照模板版本: v{data[\"template_version\"]}')
print(f'证照数据未变: {data[\"certificate_data\"]}')
"

echo ""
echo ""
echo "=== 场景2: 重复签发检测 ==="
echo "2.1 尝试重复签发同一类型证照"
curl -sS -X POST "$BASE_URL/certificates" \
  -H "Content-Type: application/json" \
  -d "{\"template_id\":2,\"applicant_id\":$NEW_APP_ID,\"certificate_data\":{\"企业名称\":\"某某科技有限公司\"},\"issuing_authority\":\"市场监督管理局\",\"issuer\":\"审批员\"}"

echo ""
echo ""
echo "=== 场景3: 审批未完成不能签发 ==="
echo "3.1 创建待审批事项"
curl -sS -X POST "$BASE_URL/approvals" \
  -H "Content-Type: application/json" \
  -d '{"item_code":"APP-001","item_name":"经营许可审批","template_id":2,"applicant_id":1}'

echo ""
echo "3.2 使用未审批事项签发证照（应失败）"
curl -sS -X POST "$BASE_URL/certificates" \
  -H "Content-Type: application/json" \
  -d "{\"template_id\":1,\"approval_item_id\":1,\"applicant_id\":2,\"certificate_data\":{\"姓名\":\"测试用户\"},\"issuing_authority\":\"测试机关\",\"issuer\":\"测试员\"}"

echo ""
echo ""
echo "=== 场景4: 高频调用审计 ==="
echo "4.1 连续发起12次核验请求（触发限流）"
for i in {1..12}; do
  RESULT=$(curl -sS -X POST "$BASE_URL/verification" \
    -H "Content-Type: application/json" \
    -d '{"certificate_number":"INVALID-TEST","caller":"压力测试","purpose":"测试"}')
  if echo "$RESULT" | grep -q "HIGH_FREQUENCY"; then
    echo "请求 $i: 触发限流保护"
    break
  fi
done

echo ""
echo "4.2 查看审计日志"
curl -sS "$BASE_URL/verification/audit?pageSize=5" | python3 -c "
import sys,json
data=json.load(sys.stdin)['data']
if data:
    for log in data:
        print(f'类型:{log[\"log_type\"]}, 调用者:{log[\"caller\"]}, 次数:{log[\"access_count\"]}, 级别:{log[\"alert_level\"]}')
else:
    print('暂无审计日志')
"

echo ""
echo "========================================"
echo "自测完成！"
echo "========================================"
