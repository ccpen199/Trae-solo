#!/bin/bash
echo "=== 1. 登录获取 admin token ==="
TOKEN=$(curl -s -X POST http://127.0.0.1:53669/api/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token||'ERROR'))")
echo "  Token: ${TOKEN:0:20}..."

echo ""
echo "=== 2. 获取发票列表 ==="
curl -s "http://127.0.0.1:53669/api/report/invoices" \
  -H "Authorization: Bearer $TOKEN" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);console.log('  总数:',a.length);a.slice(0,5).forEach(i=>console.log('    ID:',i.id,'金额:',i.amount,'状态:',i.status,'发票号:',i.invoice_number||'-'))})"

echo ""
echo "=== 3. 测试空发票号 ==="
PENDING_ID=$(curl -s "http://127.0.0.1:53669/api/report/invoices?status=pending" \
  -H "Authorization: Bearer $TOKEN" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);console.log(a[0]?.id||'')})")
echo "  待开具发票ID: $PENDING_ID"

RESULT=$(curl -s -X PUT "http://127.0.0.1:53669/api/report/invoices/$PENDING_ID/issue" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invoice_number":""}')
echo "  空发票号结果: $RESULT"
echo "  结果: $(echo $RESULT | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);console.log(a.error?'✅ 正确拦截 - '+a.error:'❌ 未拦截')})")"

echo ""
echo "=== 4. 测试重复发票号 ==="
ISSUED_NUM=$(curl -s "http://127.0.0.1:53669/api/report/invoices?status=issued" \
  -H "Authorization: Bearer $TOKEN" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);const x=a.find(i=>i.invoice_number);console.log(x?.invoice_number||'')})")
echo "  已存在的发票号: $ISSUED_NUM"

RESULT=$(curl -s -X PUT "http://127.0.0.1:53669/api/report/invoices/$PENDING_ID/issue" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"invoice_number\":\"$ISSUED_NUM\"}")
echo "  重复发票号结果: $RESULT"
echo "  结果: $(echo $RESULT | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);console.log(a.error?'✅ 正确拦截 - '+a.error:'❌ 未拦截')})")"

echo ""
echo "=== 5. 测试正常开具 ==="
NEW_NUM="INV$(date +%s | tail -c 8)"
echo "  新发票号: $NEW_NUM"
RESULT=$(curl -s -X PUT "http://127.0.0.1:53669/api/report/invoices/$PENDING_ID/issue" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"invoice_number\":\"$NEW_NUM\"}")
echo "  开具结果: $RESULT"
echo "  结果: $(echo $RESULT | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);console.log(a.message?'✅ 成功 - '+a.message:'❌ 失败')})")"

echo ""
echo "=== 6. 验证所有账号登录 ==="
echo "  admin: $(curl -s -X POST http://127.0.0.1:53669/api/auth/staff/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token?'✅ 成功':'❌ 失败'))")"
echo "  收银员: $(curl -s -X POST http://127.0.0.1:53669/api/auth/staff/login -H 'Content-Type: application/json' -d '{"username":"station1_cash1","password":"cashier123"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token?'✅ 成功':'❌ 失败'))")"
echo "  站长: $(curl -s -X POST http://127.0.0.1:53669/api/auth/staff/login -H 'Content-Type: application/json' -d '{"username":"station1_mgr","password":"manager123"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token?'✅ 成功':'❌ 失败'))")"
echo "  会员: $(curl -s -X POST http://127.0.0.1:53669/api/auth/member/login -H 'Content-Type: application/json' -d '{"phone":"13800000001","password":"123456"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token?'✅ 成功':'❌ 失败'))")"

echo ""
echo "✅ 测试完成"
