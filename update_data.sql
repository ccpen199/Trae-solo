DELETE FROM jobs;
DELETE FROM orders;
DELETE FROM settlements;
DELETE FROM message_sessions;
DELETE FROM messages;
DELETE FROM reports;
DELETE FROM guarantees;
DELETE FROM arbitrate_records;
DELETE FROM audit_logs;
DELETE FROM campus_ambassadors;
DELETE FROM credit_certifications;
DELETE FROM peak_predictions;
DELETE FROM worker_profiles;
DELETE FROM employer_profiles;
DELETE FROM users WHERE username IN ('employer1', 'employer2', 'worker1', 'worker2', 'worker3');

INSERT INTO users (username, password_hash, role, phone) VALUES
('employer1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employer', '13800000001'),
('employer2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employer', '13800000002'),
('worker1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'worker', '13900000001'),
('worker2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'worker', '13900000002'),
('worker3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'worker', '13900000003');

INSERT INTO employer_profiles (user_id, company_name, business_license, verified, publish_limit, publish_count) VALUES
((SELECT id FROM users WHERE username='employer1'), '星耀科技有限公司', 'BL202400001', 1, 20, 3),
((SELECT id FROM users WHERE username='employer2'), '云浪信息技术', 'BL202400002', 1, 15, 2);

INSERT INTO worker_profiles (user_id, identity_type, real_name, university, major, grade, skills, availability_calendar) VALUES
((SELECT id FROM users WHERE username='worker1'), 'student', '张三', '北京大学', '计算机科学与技术', '大三', '["编程","数据分析","英语翻译"]', '{"weekdays":true,"weekends":true}'),
((SELECT id FROM users WHERE username='worker2'), 'student', '李四', '清华大学', '视觉传达设计', '大二', '["UI设计","平面设计","视频剪辑"]', '{"weekdays":false,"weekends":true}'),
((SELECT id FROM users WHERE username='worker3'), 'professional', '王五', NULL, NULL, NULL, '["文案写作","英语翻译","市场调研"]', '{"weekdays":true,"weekends":true}');

INSERT INTO jobs (employer_id, title, description, work_time, work_location, hourly_wage, category, status, audit_status) VALUES
((SELECT id FROM users WHERE username='employer1'), '前端开发实习生', '负责公司官网及后台系统前端开发，使用React和Vue框架。要求熟悉HTML/CSS/JavaScript，有实际项目经验者优先。', '周一至周五 9:00-18:00', '北京市海淀区中关村', 35, '技术', 'open', 'approved'),
((SELECT id FROM users WHERE username='employer1'), 'UI设计助理', '协助完成移动应用界面设计，图标及原型图制作。需要熟练使用Figma、Sketch等设计工具。', '周六日 10:00-16:00', '北京市海淀区五道口', 40, '设计', 'open', 'approved'),
((SELECT id FROM users WHERE username='employer2'), '数据录入文员', '负责公司客户资料录入及数据核对工作。要求细心认真，熟练使用Excel。', '周一、三、五 14:00-18:00', '北京市朝阳区望京', 25, '行政', 'open', 'approved'),
((SELECT id FROM users WHERE username='employer2'), '英语翻译兼职', '技术文档中英互译，要求专业八级水平，熟悉IT行业术语。', '远程灵活安排', '远程办公', 50, '翻译', 'open', 'approved'),
((SELECT id FROM users WHERE username='employer1'), '咖啡店咖啡师', '负责饮品制作及顾客服务。有咖啡店工作经验者优先考虑。', '工作日早班 7:00-11:00', '北京市西城区西单', 28, '餐饮', 'open', 'approved');

INSERT INTO orders (job_id, worker_id, employer_id, status, work_start, work_end, check_in_lat, check_in_lng, check_in_time, check_in_geofence) VALUES
((SELECT id FROM jobs WHERE title='前端开发实习生'), (SELECT id FROM users WHERE username='worker1'), (SELECT id FROM users WHERE username='employer1'), 'working', '2024-06-03 09:00:00', '2024-06-03 18:00:00', 39.9842, 116.3074, '2024-06-03 08:55:00', 1),
((SELECT id FROM jobs WHERE title='UI设计助理'), (SELECT id FROM users WHERE username='worker2'), (SELECT id FROM users WHERE username='employer1'), 'applied', NULL, NULL, NULL, NULL, NULL, 0),
((SELECT id FROM jobs WHERE title='数据录入文员'), (SELECT id FROM users WHERE username='worker3'), (SELECT id FROM users WHERE username='employer2'), 'completed', NULL, NULL, NULL, NULL, NULL, 1);

INSERT INTO settlements (order_id, worker_id, employer_id, amount, fee, tax, actual_amount, status, channel, transaction_id) VALUES
((SELECT id FROM orders WHERE job_id=(SELECT id FROM jobs WHERE title='数据录入文员')), (SELECT id FROM users WHERE username='worker3'), (SELECT id FROM users WHERE username='employer2'), 280, 14, 8.4, 257.6, 'completed', 'T0', 'TXN202406020001'),
((SELECT id FROM orders WHERE job_id=(SELECT id FROM jobs WHERE title='前端开发实习生')), (SELECT id FROM users WHERE username='worker1'), (SELECT id FROM users WHERE username='employer1'), 315, 15.75, 9.45, 289.8, 'pending', 'T0', NULL);

INSERT INTO message_sessions (job_id, worker_id, employer_id, last_message) VALUES
((SELECT id FROM jobs WHERE title='前端开发实习生'), (SELECT id FROM users WHERE username='worker1'), (SELECT id FROM users WHERE username='employer1'), '请问实习什么时候可以入职？'),
((SELECT id FROM jobs WHERE title='UI设计助理'), (SELECT id FROM users WHERE username='worker2'), (SELECT id FROM users WHERE username='employer1'), '我对这个设计岗位很感兴趣');

INSERT INTO messages (session_id, sender_id, receiver_id, content, is_read) VALUES
(1, (SELECT id FROM users WHERE username='worker1'), (SELECT id FROM users WHERE username='employer1'), '您好，我对前端开发实习生岗位很感兴趣，请问还招人吗？', 1),
(1, (SELECT id FROM users WHERE username='employer1'), (SELECT id FROM users WHERE username='worker1'), '还在招人，你可以先申请', 1),
(1, (SELECT id FROM users WHERE username='worker1'), (SELECT id FROM users WHERE username='employer1'), '请问实习什么时候可以入职？', 0),
(2, (SELECT id FROM users WHERE username='worker2'), (SELECT id FROM users WHERE username='employer1'), '我对这个设计岗位很感兴趣', 0);
