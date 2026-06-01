INSERT OR IGNORE INTO risk_assessments (customer_id, assessment_no, risk_score, risk_level, risk_tags, risk_reasons, status, created_by) VALUES
(1, 'ASSESS000001', 25, 'low', '["usage_stable"]', '客户状态稳定，无明显风险', 'closed', 1),
(2, 'ASSESS000002', 55, 'medium', '["payment_delay"]', '付款延迟，需要关注', 'pending', 1),
(3, 'ASSESS000003', 85, 'critical', '["expired", "no_payment"]', '服务已过期，长时间未付款', 'manual_review', 1),
(4, 'ASSESS000004', 15, 'low', '["new_customer"]', '新客户，活跃度高', 'closed', 1),
(5, 'ASSESS000005', 70, 'high', '["expire_soon", "usage_decline"]', '服务即将到期，使用频次下降', 'watching', 1);

INSERT OR IGNORE INTO recovery_tasks (customer_id, task_no, task_title, task_type, description, priority, assignee_id, status, created_by) VALUES
(2, 'TASK000001', '上海贸易集团客户挽回', '电话回访', '中风险客户，需要了解续约意向', 'medium', 2, 'processing', 1),
(3, 'TASK000002', '广州制造公司客户挽回', '专属优惠', '极高风险客户，已过期，需紧急跟进', 'high', 3, 'pending', 1),
(5, 'TASK000003', '杭州数字公司客户挽回', '升级服务', '高风险客户，即将到期', 'medium', 2, 'completed', 1);
