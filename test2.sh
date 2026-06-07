#!/bin/bash
set -e
UT=$(curl -sS -X POST http://127.0.0.1:58937/api/auth/user/login -H "Content-Type: application/json" -d '{"phone":"13900001001","password":"user123"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")

RESP=$(curl -sS -X POST http://127.0.0.1:58937/api/consultations -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d '{"title":"劳动纠纷","category":"劳动争议","description":"公司辞退补偿"}')
CID=$(echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);c=d.get('consultation',d);print(c.get('id',''))")
echo "ConsultID: $CID"

for lvl in 2 3 4 5; do
  R=$(curl -sS -X POST "http://127.0.0.1:58937/api/consultations/$CID/escalate" -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d "{\"target_level\":$lvl,\"lawyer_id\":1}")
  echo "Lvl$lvl: $(echo $R | python3 -c "import sys,json;d=json.load(sys.stdin);print('level='+str(d.get('level',''))+' status='+d.get('status',''))")"
done

echo "Contract: $(curl -sS -X POST http://127.0.0.1:58937/api/contracts/generate -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d '{"title":"劳动合同","category":"劳动合同"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('success='+str(d.get('success'))+' risks='+str(len(d.get('risk_points',[]))))")"
echo "ALL DONE"
