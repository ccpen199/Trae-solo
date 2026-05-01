-- 优惠券营销系统初始化数据库脚本
-- 初始化系统表和基础数据

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建必要的索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_owner ON budgets(owner_id);

CREATE INDEX IF NOT EXISTS idx_templates_status ON coupon_templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_budget ON coupon_templates(budget_id);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON coupon_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_instances_template ON coupon_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_instances_user ON coupon_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_instances_status ON coupon_instances(status);
CREATE INDEX IF NOT EXISTS idx_instances_code ON coupon_instances(coupon_code);
CREATE INDEX IF NOT EXISTS idx_instances_order ON coupon_instances(order_id);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_no ON orders(order_no);

CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_trace ON audit_logs(trace_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_distribution_template ON distribution_jobs(template_id);
CREATE INDEX IF NOT EXISTS idx_distribution_status ON distribution_jobs(status);

CREATE INDEX IF NOT EXISTS idx_transitions_from ON state_transitions(from_state);
CREATE INDEX IF NOT EXISTS idx_transitions_to ON state_transitions(to_state);

CREATE INDEX IF NOT EXISTS idx_fraud_device ON fraud_checks(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_fraud_ip ON fraud_checks(ip_address);
CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_created ON fraud_checks(timestamp);
