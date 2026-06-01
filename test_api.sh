#!/bin/bash
BASE_URL="http://127.0.0.1:59901/api"

echo "=== 1. 创建证照模板 ==="
curl -sS -X POST "$BASE_URL/templates" \
  -H "Content-Type: application/json" \
  -d '{"template_code":"ID-001","template_name":"居民身份证","certificate_type":"身份证照","fields":[{"name":"姓名","type":"string","required":true},{"name":"性别","type":"string","required":true}],"validity_period":10,"validity_unit":"year","created_by":"admin"}'

echo ""
echo ""
echo "=== 2. 创建申请人 ==="
curl -sS -X POST "$BASE_URL/applicants" \
  -H "Content-Type: application/json" \
  -d '{"applicant_name":"张三","id_type":"身份证","id_number":"110101199001011234","phone":"13800138000"}'

echo ""
echo ""
echo "=== 3. 获取模板列表 ==="
curl -sS "$BASE_URL/templates"

echo ""
echo ""
echo "=== 4. 获取申请人列表 ==="
curl -sS "$BASE_URL/applicants"
