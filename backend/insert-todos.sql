-- 插入待办事项测试数据
DELETE FROM todo_items WHERE user_id IN (1,2,3,4);

INSERT INTO todo_items (user_id, title, description, type, priority, status, created_at) VALUES
(1, '养老金资格认证', '请在本月底前完成养老金领取资格认证', '养老', 1, 'pending', datetime('now','-2 days')),
(1, '医保账户变动通知', '您的医保个人账户有新的入账记录', '医疗', 2, 'pending', datetime('now','-1 days')),
(1, '社保卡到期提醒', '您的社保卡将于90天后到期，请及时更换', '社保', 1, 'pending', datetime('now'));

INSERT INTO todo_items (user_id, title, description, type, priority, status, created_at) VALUES
(2, '系统安全审计', '请完成本月系统安全审计报告', '系统', 1, 'pending', datetime('now','-3 days')),
(2, '用户权限审核', '有3个新用户权限申请待审核', '系统', 2, 'pending', datetime('now','-1 days'));

INSERT INTO todo_items (user_id, title, description, type, priority, status, created_at) VALUES
(3, '服务上线审核', '2个新服务等待上线审核', '运营', 1, 'pending', datetime('now','-2 days')),
(3, '运营数据报表', '请提交上月运营数据报表', '运营', 2, 'pending', datetime('now'));

INSERT INTO todo_items (user_id, title, description, type, priority, status, created_at) VALUES
(4, '数据库备份检查', '请检查上周数据库备份是否完整', '运维', 1, 'pending', datetime('now','-2 days')),
(4, '服务器性能优化', '服务器CPU使用率持续偏高，请优化', '运维', 2, 'pending', datetime('now','-1 days'));

DELETE FROM notifications WHERE user_id IN (1,2,3,4);

INSERT INTO notifications (user_id, title, content, type, is_read, created_at) VALUES
(1, '系统维护通知', '系统将于本周六凌晨2点-4点进行维护升级', 'system', 0, datetime('now','-1 days')),
(1, '养老金调整', '2024年养老金调整方案已发布，请查看详情', 'policy', 0, datetime('now')),
(2, '新用户注册', '有5个新用户完成注册', 'system', 0, datetime('now','-6 hours')),
(3, '服务评论通知', '您的服务收到3条新评论', 'service', 0, datetime('now','-3 hours'));
