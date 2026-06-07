-- 插入测试用户 (密码都是 123456)
INSERT OR IGNORE INTO users (user_type, name, id_card, phone, password_hash, roles) VALUES
('natural', '张三', '340101199001011234', '13800138001', '$2a$10$HVoix7i6jYx4WfC0UFpq7e1gK7lE.BIt4wR1TB1pttmK8DckjnHTC', 'user'),
('natural', '李四', '340101199202022345', '13800138002', '$2a$10$HVoix7i6jYx4WfC0UFpq7e1gK7lE.BIt4wR1TB1pttmK8DckjnHTC', 'user'),
('legal', '安徽某某科技有限公司', '91340100MA2MQ12345', '13900139001', '$2a$10$HVoix7i6jYx4WfC0UFpq7e1gK7lE.BIt4wR1TB1pttmK8DckjnHTC', 'legal_user'),
('staff', '王审批', '340101198803033456', '13700137001', '$2a$10$HVoix7i6jYx4WfC0UFpq7e1gK7lE.BIt4wR1TB1pttmK8DckjnHTC', 'approver'),
('admin', '系统管理员', '340101198505055678', '13600136001', '$2a$10$HVoix7i6jYx4WfC0UFpq7e1gK7lE.BIt4wR1TB1pttmK8DckjnHTC', 'admin,operator');

-- 插入电子证照数据
INSERT OR IGNORE INTO licenses (user_id, license_type, license_number, holder_name, issue_date, expiry_date, issuer, status) VALUES
(1, '身份证', '340101199001011234', '张三', '2018-05-01', '2038-05-01', '合肥市公安局', 'valid'),
(1, '户口簿', '34010119900101001X', '张三', '2018-05-01', '2099-12-31', '合肥市公安局', 'valid'),
(1, '社会保障卡', 'A12345678', '张三', '2020-03-15', '2030-03-15', '安徽省人力资源和社会保障厅', 'valid'),
(1, '不动产权证', '皖(2021)合肥市不动产权第0012345号', '张三', '2021-06-20', '2091-06-19', '合肥市自然资源和规划局', 'valid'),
(1, '驾驶证', '340101199001011234', '张三', '2015-08-10', '2025-08-10', '合肥市公安局交通警察支队', 'valid'),
(3, '营业执照', '91340100MA2MQ12345', '安徽某某科技有限公司', '2020-01-01', '2099-12-31', '合肥市市场监督管理局', 'valid');

-- 插入高频服务事项（含表单定义和材料清单）
INSERT OR IGNORE INTO service_items (name, code, department, category, handling_time_limit, running_count, handling_depth, status, form_schema_json, material_list_json, scenario_tree_json) VALUES
('社会保障卡申领', 'GG002', '安徽省人力资源和社会保障厅', '社会保障', 15, 1256, '四级全程网办', 'online', 
'{
  "fields": [
    {"name": "name", "label": "姓名", "type": "text", "required": true, "prefillFrom": "user.name"},
    {"name": "idCard", "label": "身份证号", "type": "text", "required": true, "prefillFrom": "user.idCard"},
    {"name": "phone", "label": "联系电话", "type": "tel", "required": true, "prefillFrom": "user.phone"},
    {"name": "address", "label": "收件地址", "type": "text", "required": true},
    {"name": "cardType", "label": "卡类型", "type": "select", "required": true, "options": [{"value": "new", "label": "新办"}, {"value": "replace", "label": "补办"}, {"value": "change", "label": "换领"}]}
  ],
  "groups": [{"name": "basic", "title": "基本信息", "fields": ["name", "idCard", "phone"]}, {"name": "delivery", "title": "领取方式", "fields": ["address", "cardType"]}]
}',
'[{"name": "居民身份证", "required": true, "canUseLicense": true, "licenseType": "身份证"}, {"name": "近期免冠照片", "required": true, "canUseLicense": false}]',
'{"root": {"question": "您需要办理哪种业务？", "options": [{"label": "新办社保卡", "value": "new", "materials": ["居民身份证", "近期免冠照片"], "formFields": ["name", "idCard", "phone", "address", "cardType"]}, {"label": "补办社保卡", "value": "replace", "materials": ["居民身份证"], "formFields": ["name", "idCard", "phone", "address", "cardType"]}, {"label": "换领社保卡", "value": "change", "materials": ["居民身份证", "旧社保卡"], "formFields": ["name", "idCard", "phone", "address", "cardType"]}]}}'),

('不动产登记查询', 'GG003', '安徽省自然资源厅', '住房不动产', 3, 3420, '四级全程网办', 'online',
'{
  "fields": [
    {"name": "name", "label": "权利人姓名", "type": "text", "required": true, "prefillFrom": "user.name"},
    {"name": "idCard", "label": "身份证号", "type": "text", "required": true, "prefillFrom": "user.idCard"},
    {"name": "queryType", "label": "查询类型", "type": "select", "required": true, "options": [{"value": "own", "label": "本人名下不动产"}, {"value": "other", "label": "特定地址查询"}]}
  ]
}',
'[{"name": "居民身份证", "required": true, "canUseLicense": true, "licenseType": "身份证"}]',
'{}'),

('公积金提取', 'GG007', '安徽省住房和城乡建设厅', '住房公积金', 5, 2180, '四级全程网办', 'online',
'{
  "fields": [
    {"name": "name", "label": "姓名", "type": "text", "required": true, "prefillFrom": "user.name"},
    {"name": "idCard", "label": "身份证号", "type": "text", "required": true, "prefillFrom": "user.idCard"},
    {"name": "phone", "label": "联系电话", "type": "tel", "required": true, "prefillFrom": "user.phone"},
    {"name": "extractType", "label": "提取类型", "type": "select", "required": true, "options": [{"value": "buy", "label": "购房提取"}, {"value": "rent", "label": "租房提取"}, {"value": "retire", "label": "退休提取"}, {"value": "medical", "label": "大病医疗提取"}]},
    {"name": "bankAccount", "label": "收款银行账号", "type": "text", "required": true},
    {"name": "bankName", "label": "开户银行", "type": "text", "required": true}
  ]
}',
'[{"name": "居民身份证", "required": true, "canUseLicense": true, "licenseType": "身份证"}, {"name": "不动产权证", "required": false, "canUseLicense": true, "licenseType": "不动产权证"}]',
'{"root": {"question": "您需要办理哪种公积金提取？", "options": [{"label": "购房提取", "value": "buy", "materials": ["居民身份证", "不动产权证", "购房合同"]}, {"label": "租房提取", "value": "rent", "materials": ["居民身份证", "租房合同"]}, {"label": "退休提取", "value": "retire", "materials": ["居民身份证", "退休证明"]}, {"label": "大病医疗提取", "value": "medical", "materials": ["居民身份证", "医院诊断证明"]}]}}'),

('居民身份证办理', 'GG001', '安徽省公安厅', '户籍证件', 20, 5680, '四级全程网办', 'online',
'{
  "fields": [
    {"name": "name", "label": "姓名", "type": "text", "required": true, "prefillFrom": "user.name"},
    {"name": "idCard", "label": "原身份证号", "type": "text", "required": true, "prefillFrom": "user.idCard"},
    {"name": "phone", "label": "联系电话", "type": "tel", "required": true, "prefillFrom": "user.phone"},
    {"name": "businessType", "label": "业务类型", "type": "select", "required": true, "options": [{"value": "new", "label": "首次申领"}, {"value": "expire", "label": "到期换领"}, {"value": "lost", "label": "丢失补领"}, {"value": "damage", "label": "损坏换领"}]},
    {"name": "address", "label": "收件地址", "type": "text", "required": true}
  ]
}',
'[{"name": "居民户口簿", "required": true, "canUseLicense": true, "licenseType": "户口簿"}, {"name": "近期免冠照片", "required": true, "canUseLicense": false}]',
'{}'),

('驾驶证补换证', 'GG005', '安徽省公安厅', '交通出行', 10, 1890, '四级全程网办', 'online',
'{
  "fields": [
    {"name": "name", "label": "姓名", "type": "text", "required": true, "prefillFrom": "user.name"},
    {"name": "idCard", "label": "身份证号", "type": "text", "required": true, "prefillFrom": "user.idCard"},
    {"name": "phone", "label": "联系电话", "type": "tel", "required": true, "prefillFrom": "user.phone"},
    {"name": "businessType", "label": "业务类型", "type": "select", "required": true, "options": [{"value": "lost", "label": "遗失补证"}, {"value": "damage", "label": "损坏换证"}, {"value": "expire", "label": "到期换证"}]},
    {"name": "address", "label": "收件地址", "type": "text", "required": true}
  ]
}',
'[{"name": "居民身份证", "required": true, "canUseLicense": true, "licenseType": "身份证"}, {"name": "机动车驾驶人身体条件证明", "required": true, "canUseLicense": false}]',
'{}'),

('医保报销申请', 'GG006', '安徽省医疗保障局', '医疗卫生', 20, 980, '四级全程网办', 'online',
'{
  "fields": [
    {"name": "name", "label": "申请人姓名", "type": "text", "required": true, "prefillFrom": "user.name"},
    {"name": "idCard", "label": "身份证号", "type": "text", "required": true, "prefillFrom": "user.idCard"},
    {"name": "phone", "label": "联系电话", "type": "tel", "required": true, "prefillFrom": "user.phone"},
    {"name": "hospital", "label": "就诊医院", "type": "text", "required": true},
    {"name": "treatmentDate", "label": "就诊日期", "type": "date", "required": true},
    {"name": "amount", "label": "医疗费用金额", "type": "number", "required": true},
    {"name": "bankAccount", "label": "收款银行账号", "type": "text", "required": true}
  ]
}',
'[{"name": "居民身份证", "required": true, "canUseLicense": true, "licenseType": "身份证"}, {"name": "社会保障卡", "required": true, "canUseLicense": true, "licenseType": "社会保障卡"}, {"name": "医疗费用发票", "required": true, "canUseLicense": false}, {"name": "出院小结/诊断证明", "required": true, "canUseLicense": false}]',
'{}'),

('企业开办一窗通', 'GG004', '安徽省市场监督管理局', '企业开办', 3, 756, '四级全程网办', 'online',
'{
  "fields": [
    {"name": "enterpriseName", "label": "企业名称", "type": "text", "required": true},
    {"name": "unifiedCode", "label": "统一社会信用代码", "type": "text", "required": false, "prefillFrom": "user.idCard"},
    {"name": "legalPerson", "label": "法定代表人", "type": "text", "required": true},
    {"name": "legalPersonIdCard", "label": "法人身份证号", "type": "text", "required": true},
    {"name": "phone", "label": "联系电话", "type": "tel", "required": true, "prefillFrom": "user.phone"},
    {"name": "businessScope", "label": "经营范围", "type": "textarea", "required": true},
    {"name": "registeredCapital", "label": "注册资本", "type": "text", "required": true}
  ]
}',
'[{"name": "营业执照", "required": false, "canUseLicense": true, "licenseType": "营业执照"}, {"name": "法人身份证", "required": true, "canUseLicense": true, "licenseType": "身份证"}, {"name": "公司章程", "required": true, "canUseLicense": false}]',
'{}'),

('个体工商户注册', 'GG008', '安徽省市场监督管理局', '企业开办', 5, 1340, '四级全程网办', 'online',
'{
  "fields": [
    {"name": "name", "label": "经营者姓名", "type": "text", "required": true, "prefillFrom": "user.name"},
    {"name": "idCard", "label": "身份证号", "type": "text", "required": true, "prefillFrom": "user.idCard"},
    {"name": "phone", "label": "联系电话", "type": "tel", "required": true, "prefillFrom": "user.phone"},
    {"name": "businessName", "label": "字号名称", "type": "text", "required": true},
    {"name": "businessScope", "label": "经营范围", "type": "textarea", "required": true},
    {"name": "address", "label": "经营场所", "type": "text", "required": true}
  ]
}',
'[{"name": "居民身份证", "required": true, "canUseLicense": true, "licenseType": "身份证"}, {"name": "经营场所证明", "required": true, "canUseLicense": false}]',
'{}');

-- 插入数据资源目录
INSERT OR IGNORE INTO api_resources (name, code, provider, endpoint, call_count, avg_response_time, error_rate, last_called_at) VALUES
('自然人身份核验接口', 'API001', '安徽省公安厅', '/api/external/police/identity-verify', 15234, 120, 0.1, '2024-01-15 10:30:00'),
('企业工商信息查询', 'API002', '安徽省市场监督管理局', '/api/external/gsj/enterprise-query', 8956, 200, 0.3, '2024-01-15 09:45:00'),
('社保缴费信息查询', 'API003', '安徽省人力资源和社会保障厅', '/api/external/rst/social-insurance-query', 12456, 150, 0.2, '2024-01-15 11:20:00'),
('医保信息查询', 'API004', '安徽省医疗保障局', '/api/external/ybj/medical-insurance-query', 7890, 180, 0.15, '2024-01-15 14:10:00'),
('不动产信息查询', 'API005', '安徽省自然资源厅', '/api/external/zrzyt/real-estate-query', 5678, 250, 0.4, '2024-01-15 16:00:00'),
('电子证照获取接口', 'API006', '安徽省数据资源管理局', '/api/external/sjzyj/license-get', 23456, 100, 0.05, '2024-01-15 08:00:00'),
('电子签章服务', 'API007', '安徽省数据资源管理局', '/api/external/sjzyj/esign', 34567, 80, 0.08, '2024-01-15 15:30:00'),
('OCR文字识别', 'API008', '安徽省数据资源管理局', '/api/external/sjzyj/ocr', 18765, 300, 0.5, '2024-01-15 13:45:00');

-- 插入效能统计数据
INSERT OR IGNORE INTO metrics (stat_date, total_applications, completed_applications, avg_handling_time, satisfaction_score, nps_score, over_warning_count) VALUES
('2024-01-15', 328, 295, 6.8, 92, 78, 3),
('2024-01-14', 412, 380, 7.2, 90, 75, 5),
('2024-01-13', 356, 320, 6.5, 93, 80, 2),
('2024-01-12', 389, 365, 7.0, 91, 77, 4),
('2024-01-11', 402, 378, 6.9, 94, 82, 1),
('2024-01-10', 367, 340, 7.1, 89, 74, 6),
('2024-01-09', 395, 372, 6.7, 92, 79, 2);

-- 插入测试办件
INSERT OR IGNORE INTO applications (application_no, service_id, applicant_id, status, form_data, scenario_path, submitted_at, completed_at) VALUES
('AH2024011500001', 2, 1, 'completed', '{"name":"张三","idCard":"340101199001011234","phone":"13800138001","address":"合肥市包河区某某路123号","cardType":"new"}', '["new"]', '2024-01-10 09:30:00', '2024-01-15 14:00:00'),
('AH2024011500002', 3, 1, 'approved', '{"name":"张三","idCard":"340101199001011234","queryType":"own"}', '[]', '2024-01-14 10:15:00', NULL),
('AH2024011500003', 7, 1, 'reviewing', '{"name":"张三","idCard":"340101199001011234","phone":"13800138001","extractType":"rent","bankAccount":"622202XXXXXXX1234","bankName":"中国工商银行"}', '["rent"]', '2024-01-15 08:45:00', NULL);

-- 插入审批节点
INSERT OR IGNORE INTO approval_nodes (application_id, flow_id, node_name, department, operator_id, action, comment, handled_at) VALUES
(1, 1, '材料审核', '安徽省人力资源和社会保障厅', 4, 'approve', '材料齐全，符合要求', '2024-01-10 14:30:00'),
(1, 1, '制卡', '安徽省人力资源和社会保障厅', 4, 'approve', '社保卡制作完成', '2024-01-12 10:00:00'),
(1, 1, '寄送', '中国邮政', NULL, 'approve', '已寄出，快递单号：SF1234567890', '2024-01-15 09:00:00'),
(1, 1, '办结', '安徽省人力资源和社会保障厅', 4, 'complete', '用户已签收，办件完成', '2024-01-15 14:00:00'),
(2, 2, '材料审核', '安徽省自然资源厅', 4, 'approve', '身份核验通过', '2024-01-14 15:00:00'),
(2, 2, '查询登记薄', '安徽省自然资源厅', 4, 'approve', '查询结果已生成', '2024-01-15 09:30:00'),
(3, 3, '材料审核', '安徽省住房和城乡建设厅', 4, 'pending', NULL, NULL);
