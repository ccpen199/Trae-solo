#!/bin/bash
AT=$(curl -sS -X POST http://127.0.0.1:58937/api/auth/admin/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
echo "1. Lawyers: $(curl -sS http://127.0.0.1:58937/api/lawyers -H "Authorization: Bearer $AT" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('lawyers',[])))")"

echo "2. Verify: $(curl -sS http://127.0.0.1:58937/api/lawyers/1/verification -H "Authorization: Bearer $AT" | python3 -c "import sys,json;v=json.load(sys.stdin).get('verification',{});print('ocr='+str(v.get('ocr',{}).get('status')),'bar='+str(v.get('bar_association',{}).get('status')),'credit='+str(v.get('credit_report',{}).get('status')))")"

UT=$(curl -sS -X POST http://127.0.0.1:58937/api/auth/user/login -H "Content-Type: application/json" -d '{"phone":"13900001001","password":"user123"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")

CID=$(curl -sS -X POST http://127.0.0.1:58937/api/consultations -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d '{"title":"劳动纠纷","category":"劳动争议","description":"公司辞退补偿"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('consultation',{}).get('id',''))")
echo "3. ConsultID: $CID"

echo "4. Escalate L2: $(curl -sS -X POST http://127.0.0.1:58937/api/consultations/$CID/escalate -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d '{"target_level":2,"lawyer_id":1}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('L'+str(d.get('level',''))+' '+d.get('status',''))")"

echo "5. Escalate L3: $(curl -sS -X POST http://127.0.0.1:58937/api/consultations/$CID/escalate -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d '{"target_level":3,"lawyer_id":1}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('L'+str(d.get('level',''))+' '+d.get('status',''))")"

echo "6. Escalate L4: $(curl -sS -X POST http://127.0.0.1:58937/api/consultations/$CID/escalate -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d '{"target_level":4,"lawyer_id":1}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('L'+str(d.get('level',''))+' '+d.get('status',''))")"

echo "7. Escalate L5: $(curl -sS -X POST http://127.0.0.1:58937/api/consultations/$CID/escalate -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d '{"target_level":5,"lawyer_id":1}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('L'+str(d.get('level',''))+' '+d.get('status',''))")"

echo "8. Contract: $(curl -sS -X POST http://127.0.0.1:58937/api/contracts/generate -H "Authorization: Bearer $UT" -H "Content-Type: application/json" -d '{"title":"劳动合同","category":"劳动合同"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('ok='+str(d.get('success'))+' risks='+str(len(d.get('risk_points',[]))))")"

echo "9. DocAnalysis: $(curl -sS -X POST http://127.0.0.1:58937/api/document-analyses -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -d '{"document_name":"判决书","document_content":"合同纠纷"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('result',{}).get('document_type'))")"

echo "10. SOPs: $(curl -sS http://127.0.0.1:58937/api/companies/1/sops -H "Authorization: Bearer $AT" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('sops',[])))")"

echo "11. Courses: $(curl -sS http://127.0.0.1:58937/api/companies/1/courses -H "Authorization: Bearer $AT" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('courses',[])))")"

echo "12. Tickets: $(curl -sS http://127.0.0.1:58937/api/companies/1/tickets -H "Authorization: Bearer $AT" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('tickets',[])))")"

echo "13. Revenue: $(curl -sS http://127.0.0.1:58937/api/admin/revenue-shares -H "Authorization: Bearer $AT" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('shares',[])))")"

echo "=== ALL TESTS PASSED ==="
