-- 迁移脚本：为风险事件表添加完整元信息字段

-- business_abnormalities 表迁移
ALTER TABLE business_abnormalities ADD COLUMN data_source TEXT;
ALTER TABLE business_abnormalities ADD COLUMN data_updated_at TEXT;
ALTER TABLE business_abnormalities ADD COLUMN source_url TEXT;
ALTER TABLE business_abnormalities ADD COLUMN processing_status TEXT DEFAULT '待处理';
ALTER TABLE business_abnormalities ADD COLUMN processing_result TEXT;
ALTER TABLE business_abnormalities ADD COLUMN processing_time TEXT;
ALTER TABLE business_abnormalities ADD COLUMN reviewer TEXT;
ALTER TABLE business_abnormalities ADD COLUMN review_result TEXT;
ALTER TABLE business_abnormalities ADD COLUMN review_time TEXT;
ALTER TABLE business_abnormalities ADD COLUMN display_deadline TEXT;
ALTER TABLE business_abnormalities ADD COLUMN countdown_days INTEGER;
ALTER TABLE business_abnormalities ADD COLUMN expiry_status TEXT DEFAULT '公示中';

-- bid_rigging_suspects 表迁移
ALTER TABLE bid_rigging_suspects ADD COLUMN data_source TEXT;
ALTER TABLE bid_rigging_suspects ADD COLUMN data_updated_at TEXT;
ALTER TABLE bid_rigging_suspects ADD COLUMN source_url TEXT;
ALTER TABLE bid_rigging_suspects ADD COLUMN processing_status TEXT DEFAULT '待核实';
ALTER TABLE bid_rigging_suspects ADD COLUMN processing_result TEXT;
ALTER TABLE bid_rigging_suspects ADD COLUMN processing_time TEXT;
ALTER TABLE bid_rigging_suspects ADD COLUMN reviewer TEXT;
ALTER TABLE bid_rigging_suspects ADD COLUMN review_result TEXT;
ALTER TABLE bid_rigging_suspects ADD COLUMN review_time TEXT;
ALTER TABLE bid_rigging_suspects ADD COLUMN display_deadline TEXT;
ALTER TABLE bid_rigging_suspects ADD COLUMN countdown_days INTEGER;
ALTER TABLE bid_rigging_suspects ADD COLUMN expiry_status TEXT DEFAULT '公示中';

-- subcontractor_blacklist 表迁移
ALTER TABLE subcontractor_blacklist ADD COLUMN data_source TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN data_updated_at TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN source_url TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN processing_status TEXT DEFAULT '待处理';
ALTER TABLE subcontractor_blacklist ADD COLUMN processing_result TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN processing_time TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN reviewer TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN review_result TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN review_time TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN display_deadline TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN countdown_days INTEGER;
ALTER TABLE subcontractor_blacklist ADD COLUMN expiry_status TEXT DEFAULT '公示中';
ALTER TABLE subcontractor_blacklist ADD COLUMN credit_repair_available INTEGER DEFAULT 1;
ALTER TABLE subcontractor_blacklist ADD COLUMN credit_repair_status TEXT;
ALTER TABLE subcontractor_blacklist ADD COLUMN credit_repair_application_id INTEGER;

-- health_scores 表迁移
ALTER TABLE health_scores ADD COLUMN business_score_details TEXT;
ALTER TABLE health_scores ADD COLUMN judicial_score_details TEXT;
ALTER TABLE health_scores ADD COLUMN bidding_score_details TEXT;
ALTER TABLE health_scores ADD COLUMN qualification_score_details TEXT;
ALTER TABLE health_scores ADD COLUMN personnel_score_details TEXT;
ALTER TABLE health_scores ADD COLUMN credit_score_details TEXT;
