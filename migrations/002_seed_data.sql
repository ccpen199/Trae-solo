-- 插入测试用户（密码均为 123456）
INSERT INTO users (id_card, name, phone, password_hash, user_type) VALUES 
('430101199001011234', '张三', '13800138001', '$2a$10$TrY9bCUPc51iPKK2f39LPekEUWI/bDz.ZdlUaNfUHJze41/ajfr.C', 'resident'),
('430101198505055678', '李四', '13800138002', '$2a$10$TrY9bCUPc51iPKK2f39LPekEUWI/bDz.ZdlUaNfUHJze41/ajfr.C', 'flexible'),
('430101198001019999', '王税管', '13900139001', '$2a$10$TrY9bCUPc51iPKK2f39LPekEUWI/bDz.ZdlUaNfUHJze41/ajfr.C', 'admin_tax'),
('430101197801018888', '刘运营', '13900139002', '$2a$10$TrY9bCUPc51iPKK2f39LPekEUWI/bDz.ZdlUaNfUHJze41/ajfr.C', 'admin_ops');

-- 插入参保信息
INSERT INTO insurance_info (user_id, insurance_type, status, pay_grade, total_months, government_subsidy, personal_account) VALUES 
(1, 'pension', 'insured', 200, 120, 3600, 24000),
(1, 'medical', 'insured', 320, 120, 2400, 8000),
(2, 'flexible_pension', 'insured', 600, 60, 0, 36000);

-- 插入稽核规则
INSERT INTO audit_rules (rule_name, rule_code, rule_condition, risk_level, threshold) VALUES 
('断缴超过3个月预警', 'break_pay_3m', '连续未缴费月数 > 3', 'medium', 3),
('缴费金额异常偏高', 'abnormal_high', '单笔缴费 > 上年度平均的3倍', 'high', 300),
('疑似重复参保', 'duplicate_insurance', '同一身份证在多险种参保', 'high', NULL),
('年龄异常缴费', 'age_abnormal', '参保年龄 < 16 或 > 70', 'medium', NULL);

-- 为用户1(张三)添加 6 条养老金发放记录（最近6个月，每月2800-3200元）
INSERT INTO pension_payments (user_id, pay_month, amount, bank_name, bank_account, status, paid_at) VALUES 
(1, '2026-01', 2850.00, '中国工商银行', '6222021234567890123', 'paid', '2026-01-15 10:00:00'),
(1, '2026-02', 2920.00, '中国工商银行', '6222021234567890123', 'paid', '2026-02-15 10:00:00'),
(1, '2026-03', 3050.00, '中国工商银行', '6222021234567890123', 'paid', '2026-03-15 10:00:00'),
(1, '2026-04', 2980.00, '中国工商银行', '6222021234567890123', 'paid', '2026-04-15 10:00:00'),
(1, '2026-05', 3100.00, '中国工商银行', '6222021234567890123', 'paid', '2026-05-15 10:00:00'),
(1, '2026-06', 3200.00, '中国工商银行', '6222021234567890123', 'paid', '2026-06-15 10:00:00');

-- 为用户1添加 3 条缴费订单（已完成的养老/医疗保险缴费）
INSERT INTO payment_orders (order_no, user_id, insurance_type, pay_year, pay_grade, amount, channel, status, tax_invoice_status, finance_status, medical_credit_status, paid_at, created_at) VALUES 
('ORD202601010001', 1, 'pension', 2026, 200, 2400.00, 'wechat', 'paid', 'issued', 'warehoused', 'credited', '2026-01-10 09:30:00', '2026-01-10 09:25:00'),
('ORD202601010002', 1, 'medical', 2026, 320, 3840.00, 'alipay', 'paid', 'issued', 'warehoused', 'credited', '2026-01-10 09:35:00', '2026-01-10 09:28:00'),
('ORD202606010003', 1, 'pension', 2026, 200, 2400.00, 'bank', 'paid', 'issued', 'warehoused', 'credited', '2026-06-01 14:20:00', '2026-06-01 14:15:00');

-- 添加 3 条预警记录（含断缴超3个月的预警）
INSERT INTO payment_warnings (user_id, warning_type, severity, description, status, triggered_at) VALUES 
(2, 'break_pay', 'high', '灵活就业人员养老保险已断缴5个月，超过预警阈值3个月', 'pending', '2026-06-01 08:00:00'),
(1, 'abnormal_amount', 'medium', '2026年6月缴费金额较上年度月均增长超过50%，疑似异常', 'processing', '2026-06-02 08:00:00'),
(2, 'suspected_fraud', 'low', '缴费记录与收入数据比对存在异常，需进一步核实', 'pending', '2026-06-03 08:00:00');

-- 为用户1添加 1 条家庭共济绑定记录
INSERT INTO family_mutual_aid (user_id, relative_id_card, relative_name, relationship, auth_amount, used_amount, status, verified_at) VALUES 
(1, '430101195001014321', '张父', 'parent', 5000.00, 1200.00, 'active', '2025-12-01 10:00:00');
