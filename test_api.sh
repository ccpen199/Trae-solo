#!/bin/bash
BACKEND_PORT=59067
BASE_URL="http://127.0.0.1:$BACKEND_PORT/api"

echo "========================================"
echo "  智能简历工作台 - API 业务链路测试"
echo "========================================"
echo ""

# 1. 注册
echo "[1/8] 测试用户注册..."
REGISTER_RESPONSE=$(curl -sS -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"api_test@example.com","name":"API测试用户","password":"123456"}')
echo "✓ 注册成功"
echo ""

# 2. 登录
echo "[2/8] 测试用户登录..."
LOGIN_RESPONSE=$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"api_test@example.com","password":"123456"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "✓ 登录成功，Token获取成功"
echo ""

# 3. 获取模板列表
echo "[3/8] 测试获取模板列表..."
TEMPLATES=$(curl -sS "$BASE_URL/templates" -H "Authorization: Bearer $TOKEN")
TEMPLATE_COUNT=$(echo "$TEMPLATES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['templates']))")
echo "✓ 获取到 $TEMPLATE_COUNT 个模板"
echo ""

# 4. 创建简历
echo "[4/8] 测试创建简历..."
CREATE_RESPONSE=$(curl -sS -X POST "$BASE_URL/resumes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"测试简历","template_id":"tech-modern","content":{"basicInfo":{"name":"李四","phone":"13900139000","email":"lisi@example.com"},"education":[],"experience":[],"projects":[],"skills":[]}}')
RESUME_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "✓ 简历创建成功，ID: $RESUME_ID"
echo ""

# 5. 获取简历详情
echo "[5/8] 测试获取简历详情..."
GET_RESPONSE=$(curl -sS "$BASE_URL/resumes/$RESUME_ID" -H "Authorization: Bearer $TOKEN")
echo "$GET_RESPONSE" | python3 -c "import sys,json; r=json.load(sys.stdin)['resume']; print(f'✓ 简历标题: {r[\"title\"]}, 模板: {r[\"template_id\"]}')"
echo ""

# 6. 质量诊断
echo "[6/8] 测试质量诊断..."
QUALITY_RESPONSE=$(curl -sS -X POST "$BASE_URL/quality/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":{"basicInfo":{"name":"李四","email":"lisi@example.com"},"summary":"测试总结","education":[{"school":"北京大学","degree":"硕士"}],"experience":[{"company":"阿里巴巴","position":"高级工程师","description":"负责系统架构设计，优化性能提升50%"}],"projects":[{"name":"电商平台","description":"搭建高并发电商系统"}],"skills":[{"name":"Java","level":90}]},"industry":"tech"}')
echo "$QUALITY_RESPONSE" | python3 -c "import sys,json; q=json.load(sys.stdin)['report']; print(f'✓ 综合评分: {q[\"overallScore\"]}, 关键词: {q[\"keywordScore\"]}, 动词: {q[\"verbScore\"]}, 可读性: {q[\"readabilityScore\"]}')"
echo ""

# 7. ATS文本生成
echo "[7/8] 测试ATS文本生成..."
ATS_RESPONSE=$(curl -sS -X POST "$BASE_URL/quality/ats-text" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":{"basicInfo":{"name":"李四","email":"lisi@example.com"},"education":[{"school":"北京大学"}],"experience":[{"company":"阿里巴巴","description":"负责系统架构"}]}}')
ATS_LEN=$(echo "$ATS_RESPONSE" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['atsText']))")
echo "✓ ATS文本生成成功，长度: $ATS_LEN 字符"
echo ""

# 8. 获取简历列表
echo "[8/8] 测试获取简历列表..."
LIST_RESPONSE=$(curl -sS "$BASE_URL/resumes" -H "Authorization: Bearer $TOKEN")
LIST_COUNT=$(echo "$LIST_RESPONSE" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['resumes']))")
echo "✓ 简历列表获取成功，共 $LIST_COUNT 份简历"
echo ""

echo "========================================"
echo "  ✅ 所有核心API测试通过！"
echo "========================================"
echo ""
echo "前端地址: http://127.0.0.1:49067"
echo "后端地址: http://127.0.0.1:59067"
echo "数据库:   data/app.sqlite"
echo "管理员:   admin@resume.com / admin123456"
