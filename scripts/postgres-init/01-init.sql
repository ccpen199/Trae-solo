-- ============================================================
-- 宁夏城市服务总入口 - PostgreSQL 初始化脚本
-- ============================================================

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================
-- 审计日志保留策略 - 自动按月份分区
-- ============================================================

-- 创建审计日志表分区函数（按月分区 + 自动清理90天前）
CREATE OR REPLACE FUNCTION nx_gov_audit_partition_trigger()
RETURNS TRIGGER AS $$
DECLARE
    table_name text;
    start_date date;
    end_date date;
BEGIN
    table_name := 'audit_log_' || to_char(NEW.created_at, 'YYYY_MM');
    start_date := date_trunc('month', NEW.created_at)::date;
    end_date   := start_date + interval '1 month';

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = table_name) THEN
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
            table_name, start_date, end_date
        );
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS %I_user_id_idx ON %I (user_id)',
            table_name, table_name
        );
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS %I_module_action_idx ON %I (module, action)',
            table_name, table_name
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 90天自动清理函数
CREATE OR REPLACE FUNCTION nx_gov_cleanup_audit_logs()
RETURNS void AS $$
DECLARE
    partition_record record;
    cutoff_date date := current_date - interval '90 days';
BEGIN
    FOR partition_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name ~ '^audit_log_\d{4}_\d{2}$'
          AND table_schema = 'public'
    LOOP
        EXECUTE format(
            'DELETE FROM %I WHERE created_at < %L',
            partition_record.table_name, cutoff_date
        );
        RAISE NOTICE '已清理表 % 中90天前的记录', partition_record.table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 敏感字段访问审计触发器
-- ============================================================
CREATE OR REPLACE FUNCTION nx_gov_sensitive_field_audit()
RETURNS TRIGGER AS $$
DECLARE
    old_val text;
    new_val text;
    field_name text;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.id_card IS DISTINCT FROM NEW.id_card THEN
            RAISE WARNING '敏感字段变更: id_card 用户ID=%', NEW.id;
        END IF;
        IF OLD.phone IS DISTINCT FROM NEW.phone THEN
            RAISE WARNING '敏感字段变更: phone 用户ID=%', NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 评论/备注
-- ============================================================
COMMENT ON DATABASE nx_city_service IS '宁夏自治区级城市服务总入口数据库';

-- 创建默认数据库角色（如需要）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nx_gov_app') THEN
        CREATE ROLE nx_gov_app LOGIN PASSWORD 'nx_gov_app_2024_pwd';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE nx_city_service TO nx_gov_app;
GRANT ALL ON SCHEMA public TO nx_gov_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nx_gov_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nx_gov_app;
