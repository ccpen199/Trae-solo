#!/bin/bash
BASE=http://127.0.0.1:58919/api

test_login() {
  local name=$1; local phone=$2; local code=$3; local role=$4
  local RES=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$phone\",\"code\":\"$code\",\"role\":\"$role\"}")
  local SUCCESS=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
  local ERROR=$(echo $RES | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('error','') if not d.get('success') else '')")
  local USER=$(echo $RES | python3 -c "import sys,json;d=json.load(sys.stdin);u=d.get('user',{});print(u.get('name','')+'/'+u.get('role','') if d.get('success') else '')")
  echo "[$name] success=$SUCCESS user=$USER error=$ERROR"
}

echo "===== 登录异常场景验证 ====="
test_login "错误验证码" "13800138001" "000000" "driver"
test_login "手机号格式错" "12345" "123456" "driver"
test_login "空字段" "" "" ""
test_login "角色错误:司机账号选错货主" "13800138001" "123456" "shipper"
test_login "货主账号选错司机" "13900139001" "123456" "driver"
test_login "管理员账号不存在" "13700009999" "123456" "admin"

echo ""
echo "===== 登录正常场景验证 ====="
test_login "✅司机张立国" "13800138001" "123456" "driver"
test_login "✅货主王经理" "13900139001" "123456" "shipper"
test_login "✅管理员" "13700137001" "123456" "admin"
test_login "✅新用户自动注册(司机)" "13800000001" "123456" "driver"
test_login "✅新用户自动注册(货主)" "13900000001" "123456" "shipper"
