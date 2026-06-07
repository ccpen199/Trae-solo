#!/bin/bash
BASE=http://127.0.0.1:59023

echo "=== 1. Register admin user ==="
ADMIN_RES=$(curl -sS --max-time 5 -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@city.com","password":"admin123","nickname":"管理员","city":"上海"}')
echo "$ADMIN_RES"

ADMIN_TOKEN=$(echo "$ADMIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
ADMIN_ID=$(echo "$ADMIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['id'])" 2>/dev/null)
echo "Admin Token: ${ADMIN_TOKEN:0:30}..."
echo "Admin ID: $ADMIN_ID"

echo ""
echo "=== 2. Set admin role (need to do via DB since we can't without admin) ==="
# Need to update DB directly for first admin
cd /Users/chen/Documents/trae_projects/local_projects/may-89023/backend
node -e "const db = require('./src/models/database'); db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', '$ADMIN_ID'); console.log('Role updated')"

echo ""
echo "=== 3. Re-login as admin ==="
ADMIN_LOGIN=$(curl -sS --max-time 5 -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
echo "New Admin Token: ${ADMIN_TOKEN:0:30}..."

echo ""
echo "=== 4. Register author user ==="
AUTHOR_RES=$(curl -sS --max-time 5 -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"author1","email":"author@city.com","password":"author123","nickname":"探店达人","city":"北京"}')
echo "$AUTHOR_RES"
AUTHOR_TOKEN=$(echo "$AUTHOR_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
AUTHOR_ID=$(echo "$AUTHOR_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['id'])" 2>/dev/null)

node -e "const db = require('./src/models/database'); db.prepare('UPDATE users SET role = ?, is_certified = ? WHERE id = ?').run('author', 1, '$AUTHOR_ID'); console.log('Author role set')"

echo ""
echo "=== 5. Create content as author ==="
CONTENT_RES=$(curl -sS --max-time 5 -X POST $BASE/api/contents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTHOR_TOKEN" \
  -d '{
    "title": "北京胡同里的隐藏咖啡馆",
    "body": "<p>在北京的胡同深处，藏着许多别具一格的咖啡馆。今天要推荐的这家，位于东城区的一条安静小巷里。</p><p>推开门，温暖的光线和咖啡香扑面而来。木质吧台、复古吊灯、手写菜单，每一个细节都让人感到舒适。</p><p>推荐他们的招牌：桂花拿铁和手冲埃塞俄比亚。桂花的清香和咖啡的醇厚完美融合，是秋冬季节的绝佳选择。</p>",
    "content_type": "article",
    "summary": "发现北京胡同深处的隐藏咖啡馆，桂花拿铁和手冲埃塞都很推荐",
    "topic_ids": ["t3", "t1"],
    "city": "北京",
    "tags": ["咖啡馆", "胡同", "北京", "探店"]
  }')
echo "$CONTENT_RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Content ID: {d[\"data\"][\"id\"]}, Review: {d[\"data\"][\"review_status\"]}')" 2>/dev/null || echo "$CONTENT_RES"
CONTENT_ID=$(echo "$CONTENT_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

echo ""
echo "=== 6. Create more content ==="
curl -sS --max-time 5 -X POST $BASE/api/contents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTHOR_TOKEN" \
  -d '{
    "title": "周末City Walk：从法租界到外滩",
    "body": "<p>上海的周末，最适合来一场City Walk。从梧桐树掩映的法租界出发，沿着老洋房林立的街道慢慢走向外滩。</p><p>路线推荐：武康路 → 安福路 → 巨鹿路 → 外滩。全程约3小时，沿途有无数值得拍照打卡的角落。</p>",
    "content_type": "note",
    "summary": "上海周末City Walk路线推荐，从法租界漫步到外滩",
    "topic_ids": ["t2", "t9"],
    "city": "上海",
    "tags": ["CityWalk", "上海", "周末", "外滩"]
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Content2: {d[\"data\"][\"id\"]}')" 2>/dev/null

echo ""
echo "=== 7. List contents ==="
curl -sS --max-time 5 "$BASE/api/contents?page=1&pageSize=10" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Total: {d[\"data\"][\"total\"]}, Items: {len(d[\"data\"][\"list\"])}')" 2>/dev/null

echo ""
echo "=== 8. View content detail ==="
curl -sS --max-time 5 "$BASE/api/contents/$CONTENT_ID" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Title: {d[\"data\"][\"title\"]}, Views: {d[\"data\"][\"view_count\"]}')" 2>/dev/null

echo ""
echo "=== 9. Like content ==="
curl -sS --max-time 5 -X POST "$BASE/api/contents/$CONTENT_ID/like" \
  -H "Authorization: Bearer $AUTHOR_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d)" 2>/dev/null

echo ""
echo "=== 10. Add comment ==="
curl -sS --max-time 5 -X POST "$BASE/api/contents/$CONTENT_ID/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"body":"太棒了！下次去北京一定要去打卡"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Comment: {d[\"message\"]}')" 2>/dev/null

echo ""
echo "=== 11. Follow topic ==="
curl -sS --max-time 5 -X POST "$BASE/api/topics/t3/follow" \
  -H "Authorization: Bearer $AUTHOR_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d)" 2>/dev/null

echo ""
echo "=== 12. Admin dashboard ==="
curl -sS --max-time 5 "$BASE/api/admin/dashboard" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Users: {d[\"data\"][\"totalUsers\"]}, Contents: {d[\"data\"][\"totalContents\"]}, Pending: {d[\"data\"][\"pendingReviews\"]}')" 2>/dev/null

echo ""
echo "=== 13. Admin analytics ==="
curl -sS --max-time 5 "$BASE/api/admin/analytics?period=daily" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'New Users: {d[\"data\"][\"stats\"][\"newUsers\"]}, New Contents: {d[\"data\"][\"stats\"][\"newContents\"]}')" 2>/dev/null

echo ""
echo "=== 14. Sensitive words ==="
curl -sS --max-time 5 "$BASE/api/admin/sensitive-words" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Sensitive words: {len(d[\"data\"])}')" 2>/dev/null

echo ""
echo "=== 15. Send tip ==="
curl -sS --max-time 5 -X POST "$BASE/api/earnings/tip" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"content_id\":\"$CONTENT_ID\",\"amount\":10,\"message\":\"好文章！\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d)" 2>/dev/null

echo ""
echo "=== 16. My earnings ==="
curl -sS --max-time 5 "$BASE/api/earnings/my" \
  -H "Authorization: Bearer $AUTHOR_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Earnings: {d}')" 2>/dev/null

echo ""
echo "=== 17. Frontend check ==="
HTTP_CODE=$(curl -I --max-time 5 http://127.0.0.1:49023/ 2>&1 | head -1)
echo "Frontend: $HTTP_CODE"

echo ""
echo "=== ALL TESTS COMPLETE ==="
