INSERT OR IGNORE INTO departments (name, bed_count) VALUES
('重症医学科', 20),
('呼吸内科', 35),
('普外科', 40),
('神经外科', 25),
('心血管内科', 30),
('骨科', 35),
('急诊科', 15),
('儿科', 25);

INSERT OR IGNORE INTO users (username, name, role, department_id) VALUES
('admin', '系统管理员', 'admin', NULL),
('infection01', '张感控', 'infection', NULL),
('infection02', '李感控', 'infection', NULL),
('icu01', '王主任', 'department', 1),
('resp01', '刘主任', 'department', 2),
('surg01', '陈主任', 'department', 3),
('lab01', '赵检验', 'lab', NULL);

INSERT OR IGNORE INTO patients (mrn, name, gender, age, department_id, bed_no, admission_date) VALUES
('P001', '张三', '男', 65, 1, 'ICU-01', '2024-01-10'),
('P002', '李四', '女', 58, 2, 'RESP-05', '2024-01-12'),
('P003', '王五', '男', 72, 3, 'SURG-12', '2024-01-08'),
('P004', '赵六', '女', 45, 1, 'ICU-03', '2024-01-15'),
('P005', '孙七', '男', 55, 1, 'ICU-05', '2024-01-14'),
('P006', '周八', '女', 60, 1, 'ICU-07', '2024-01-13'),
('P007', '吴九', '男', 68, 2, 'RESP-08', '2024-01-11'),
('P008', '郑十', '女', 52, 3, 'SURG-15', '2024-01-09');

INSERT OR IGNORE INTO temperature_records (patient_id, temperature, record_time) VALUES
(1, 38.5, '2024-01-11 08:00:00'),
(1, 39.1, '2024-01-11 14:00:00'),
(1, 38.8, '2024-01-12 08:00:00'),
(2, 37.8, '2024-01-13 08:00:00'),
(2, 38.2, '2024-01-13 20:00:00'),
(3, 38.3, '2024-01-10 08:00:00'),
(4, 39.2, '2024-01-16 08:00:00'),
(4, 38.9, '2024-01-16 16:00:00'),
(5, 38.6, '2024-01-15 08:00:00'),
(6, 38.4, '2024-01-14 08:00:00'),
(7, 37.9, '2024-01-12 08:00:00'),
(8, 38.1, '2024-01-11 08:00:00');

INSERT OR IGNORE INTO lab_results (patient_id, test_name, test_value, pathogen, specimen_type, result_date, is_positive) VALUES
(1, '血培养', '阳性', '肺炎克雷伯菌', '血液', '2024-01-12', 1),
(2, '痰培养', '阳性', '铜绿假单胞菌', '痰液', '2024-01-14', 1),
(3, '伤口分泌物', '阳性', '金黄色葡萄球菌', '分泌物', '2024-01-11', 1),
(4, '血培养', '阳性', '肺炎克雷伯菌', '血液', '2024-01-17', 1),
(5, '血培养', '阳性', '肺炎克雷伯菌', '血液', '2024-01-16', 1),
(6, '痰培养', '阳性', '鲍曼不动杆菌', '痰液', '2024-01-15', 1),
(7, '血常规', 'WBC: 12.5', NULL, '血液', '2024-01-13', 0),
(8, '引流液培养', '阳性', '大肠埃希菌', '引流液', '2024-01-12', 1);

INSERT OR IGNORE INTO antibiotic_usage (patient_id, drug_name, dosage, start_date, end_date, reason) VALUES
(1, '美罗培南', '1g q8h', '2024-01-11', NULL, '经验性抗感染'),
(2, '头孢他啶', '2g q12h', '2024-01-13', '2024-01-20', '肺部感染'),
(3, '万古霉素', '1g q12h', '2024-01-10', '2024-01-17', '手术部位感染'),
(4, '美罗培南', '1g q8h', '2024-01-16', NULL, '脓毒症'),
(5, '美罗培南', '1g q8h', '2024-01-15', NULL, '脓毒症'),
(6, '亚胺培南', '500mg q6h', '2024-01-14', '2024-01-21', 'VAP'),
(7, '莫西沙星', '400mg qd', '2024-01-12', '2024-01-19', 'CAP'),
(8, '哌拉西林他唑巴坦', '4.5g q6h', '2024-01-11', NULL, '腹腔感染');

INSERT OR IGNORE INTO surgeries (patient_id, surgery_name, surgery_date, wound_class, duration_minutes) VALUES
(3, '胆囊切除术', '2024-01-09', 'II类', 95),
(5, '脑出血清除术', '2024-01-14', 'I类', 180),
(8, '结肠癌根治术', '2024-01-10', 'III类', 240);

INSERT OR IGNORE INTO diagnoses (patient_id, diagnosis_code, diagnosis_name, diagnosis_date, is_infection_related) VALUES
(1, 'A41.9', '脓毒症', '2024-01-11', 1),
(2, 'J15.9', '细菌性肺炎', '2024-01-13', 1),
(3, 'T81.4', '手术后伤口感染', '2024-01-11', 1),
(4, 'A41.9', '脓毒症', '2024-01-16', 1),
(5, 'A41.9', '脓毒症', '2024-01-15', 1),
(6, 'J95.0', '呼吸机相关性肺炎', '2024-01-14', 1),
(7, 'J18.9', '社区获得性肺炎', '2024-01-12', 1),
(8, 'K65.0', '腹腔感染', '2024-01-11', 1);

INSERT OR IGNORE INTO infection_cases (patient_id, infection_site, pathogen, department_id, status, confirm_date, confirmed_by, confirm_reason) VALUES
(1, '血流感染', '肺炎克雷伯菌', 1, 'confirmed', '2024-01-12', 2, '血培养阳性+发热+脓毒症诊断'),
(2, '下呼吸道', '铜绿假单胞菌', 2, 'confirmed', '2024-01-14', 2, '痰培养阳性+发热+肺炎诊断'),
(3, '手术部位', '金黄色葡萄球菌', 3, 'confirmed', '2024-01-11', 2, '术后伤口感染+分泌物培养阳性'),
(4, '血流感染', '肺炎克雷伯菌', 1, 'pending', NULL, NULL, NULL),
(5, '血流感染', '肺炎克雷伯菌', 1, 'pending', NULL, NULL, NULL),
(6, '下呼吸道', '鲍曼不动杆菌', 1, 'pending', NULL, NULL, NULL),
(7, '下呼吸道', NULL, 2, 'pending', NULL, NULL, NULL),
(8, '腹腔感染', '大肠埃希菌', 3, 'confirmed', '2024-01-12', 3, '术后腹腔感染+引流液培养阳性');

INSERT OR IGNORE INTO outbreak_alerts (alert_code, department_id, pathogen, time_window_start, time_window_end, case_count, status) VALUES
('ALERT-2024-001', 1, '肺炎克雷伯菌', '2024-01-10 00:00:00', '2024-01-20 23:59:59', 3, 'pending'),
('ALERT-2024-002', 2, NULL, '2024-01-10 00:00:00', '2024-01-20 23:59:59', 2, 'pending');

INSERT OR IGNORE INTO outbreak_alert_cases (alert_id, case_id) VALUES
(1, 1), (1, 4), (1, 5),
(2, 2), (2, 7);

INSERT OR IGNORE INTO rectification_tasks (task_code, department_id, issue_description, corrective_measures, assignee_id, due_date, status) VALUES
('TASK-2024-001', 1, 'ICU手卫生依从性抽查不合格，仅65%', '1. 加强手卫生培训 2. 增加速干手消剂放置点 3. 每周抽查', 4, '2024-01-25', 'in_progress'),
('TASK-2024-002', 3, '普外科术后感染率超过阈值3%', '1. 回顾分析感染病例 2. 强化无菌操作 3. 优化围术期抗菌药使用', 6, '2024-01-28', 'pending'),
('TASK-2024-003', 2, '呼吸科多重耐药菌接触隔离措施不到位', '1. 隔离标识张贴 2. 个人防护用品配备 3. 环境消毒加强', 5, '2024-01-22', 'completed');
