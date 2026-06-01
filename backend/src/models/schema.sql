CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS customer_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT DEFAULT '#1890ff',
  description TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, category)
);

CREATE TABLE IF NOT EXISTS customer_profile_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  tagged_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES customer_tags(id) ON DELETE CASCADE,
  UNIQUE(customer_id, tag_id)
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  company_website TEXT,
  position TEXT,
  industry TEXT,
  company_size TEXT,
  region TEXT,
  decision_maker_level TEXT,
  
  purchase_intent TEXT,
  lifecycle_stage TEXT,
  followup_status TEXT,
  budget_range TEXT,
  expected_purchase_date TEXT,
  
  source_channel TEXT,
  first_contact_date DATETIME,
  last_contact_date DATETIME,
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_opened INTEGER DEFAULT 0,
  total_replies INTEGER DEFAULT 0,
  reply_rate REAL DEFAULT 0,
  avg_response_time_hours REAL,
  
  pain_points TEXT,
  interests TEXT,
  objections TEXT,
  key_requirements TEXT,
  competitor_used TEXT,
  
  internal_notes TEXT,
  status TEXT DEFAULT 'active',
  is_sensitive INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  
  created_by INTEGER NOT NULL,
  owner_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  tone TEXT DEFAULT 'professional',
  category TEXT,
  variable_fields TEXT,
  status TEXT DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_by INTEGER NOT NULL,
  approved_by INTEGER,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS variable_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  required INTEGER DEFAULT 1,
  default_value TEXT,
  description TEXT,
  validation_rules TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  model_config TEXT NOT NULL,
  tone_preferences TEXT,
  variable_requirements TEXT,
  approval_workflow TEXT,
  status TEXT DEFAULT 'active',
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS email_generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  template_id INTEGER,
  customer_id INTEGER NOT NULL,
  subject TEXT,
  content TEXT,
  tone TEXT,
  variables TEXT,
  validation_result TEXT,
  status TEXT DEFAULT 'draft',
  preview_approved_by INTEGER,
  preview_approved_at DATETIME,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agent_profiles(id),
  FOREIGN KEY (template_id) REFERENCES email_templates(id),
  FOREIGN KEY (customer_id) REFERENCES customer_profiles(id),
  FOREIGN KEY (preview_approved_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS send_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  generation_id INTEGER NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_by INTEGER NOT NULL,
  status TEXT DEFAULT 'sent',
  opened_at DATETIME,
  clicked_at DATETIME,
  bounced_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generation_id) REFERENCES email_generations(id),
  FOREIGN KEY (sent_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reply_classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  send_record_id INTEGER NOT NULL,
  reply_content TEXT,
  classification TEXT,
  confidence REAL,
  classified_by INTEGER,
  classified_at DATETIME,
  is_manual INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (send_record_id) REFERENCES send_records(id),
  FOREIGN KEY (classified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  operator_id INTEGER NOT NULL,
  reason TEXT,
  change_summary TEXT,
  old_values TEXT,
  new_values TEXT,
  affected_objects TEXT,
  recovery_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS workbench_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  title TEXT NOT NULL,
  description TEXT,
  responsible_role TEXT,
  suggested_action TEXT,
  closing_criteria TEXT,
  related_entity_type TEXT,
  related_entity_id INTEGER,
  status TEXT DEFAULT 'open',
  assignee_id INTEGER,
  closed_by INTEGER,
  closed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignee_id) REFERENCES users(id),
  FOREIGN KEY (closed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT OR IGNORE INTO roles (name, description, permissions) VALUES
('business_owner', '业务负责人', '["agent:manage","template:approve","report:view","user:manage"]'),
('model_operator', '模型运营', '["agent:configure","template:create","template:edit","report:view"]'),
('reviewer', '审核人员', '["template:approve","email:review","email:approve","alert:manage"]'),
('frontline_user', '一线使用者', '["customer:manage","email:generate","email:send","alert:view"]');

INSERT OR IGNORE INTO users (username, password, name, email, role_id) VALUES
('admin', 'admin123', '系统管理员', 'admin@example.com', 1),
('operator1', 'op123', '模型运营小张', 'operator@example.com', 2),
('reviewer1', 'rv123', '审核小李', 'reviewer@example.com', 3),
('user1', 'user123', '销售小王', 'user@example.com', 4);

INSERT OR IGNORE INTO variable_fields (name, key, type, required, description, validation_rules) VALUES
('客户姓名', 'customer_name', 'string', 1, '收件人姓名', '{"minLength":1,"maxLength":50}'),
('公司名称', 'company_name', 'string', 1, '客户公司名称', '{"minLength":1,"maxLength":100}'),
('产品名称', 'product_name', 'string', 1, '推广的产品名称', '{"minLength":1,"maxLength":100}'),
('联系电话', 'contact_phone', 'string', 0, '客户联系电话', '{"pattern":"^[0-9\\-\\+\\s]+$"}'),
('会议日期', 'meeting_date', 'date', 0, '提议的会议日期', '{"isFuture":true}');

INSERT OR IGNORE INTO agent_profiles (name, description, model_config, tone_preferences, variable_requirements, approval_workflow, created_by) VALUES
('标准销售邮件助手', '用于生成标准的B2B销售推广邮件', '{"model":"gpt-4","temperature":0.7,"maxTokens":2000}', '["professional","friendly"]', '["customer_name","company_name","product_name"]', '{"require_preview_approval":true,"auto_send_threshold":0.9}', 1);

INSERT OR IGNORE INTO customer_tags (name, category, color, description) VALUES
('高意向', '购买意向', '#ff4d4f', '客户明确表示有购买需求'),
('中意向', '购买意向', '#faad14', '客户对产品感兴趣但尚未决策'),
('低意向', '购买意向', '#52c41a', '客户初步了解产品'),
('初步接触', '生命周期', '#1890ff', '刚建立联系的潜在客户'),
('需求确认', '生命周期', '#722ed1', '正在确认具体需求'),
('方案评估', '生命周期', '#13c2c2', '正在评估解决方案'),
('商务谈判', '生命周期', '#eb2f96', '进入商务谈判阶段'),
('待跟进', '跟进状态', '#faad14', '需要主动跟进'),
('已预约', '跟进状态', '#1890ff', '已预约下次沟通'),
('暂不联系', '跟进状态', '#8c8c8c', '暂时不需要跟进'),
('预算充足', '预算', '#52c41a', '已确认预算充足'),
('预算有限', '预算', '#faad14', '预算有限需调整方案'),
('暂无预算', '预算', '#ff4d4f', '暂无相关预算'),
('技术决策者', '角色', '#722ed1', '技术选型关键决策人'),
('业务决策者', '角色', '#eb2f96', '业务部门负责人'),
('高层决策者', '角色', '#1890ff', '公司高层管理人员'),
('老客户推荐', '来源', '#52c41a', '通过老客户推荐获得'),
('线上咨询', '来源', '#1890ff', '通过网站/广告咨询'),
('展会获取', '来源', '#13c2c2', '通过行业展会获取'),
('AI感兴趣', '兴趣', '#722ed1', '对AI技术有浓厚兴趣'),
('降本增效', '需求', '#52c41a', '关注成本优化和效率提升'),
('数字化转型', '需求', '#1890ff', '正在进行数字化转型'),
('竞品用户', '竞争', '#faad14', '正在使用竞争对手产品');

INSERT OR IGNORE INTO customer_profiles (name, email, phone, company, company_website, position, industry, company_size, region, decision_maker_level, purchase_intent, lifecycle_stage, followup_status, budget_range, expected_purchase_date, source_channel, pain_points, interests, objections, key_requirements, competitor_used, internal_notes, is_sensitive, score, owner_id, created_by) VALUES
('张总', 'zhang@techcorp.com', '13800138001', '科技创新有限公司', 'https://techcorp.com', 'CTO', '软件服务', '500-1000人', '北京', 'high', 'high', '方案评估', '待跟进', '50-100万', '2026-06', '展会获取', '技术迭代慢,人才招聘难,研发效率低', 'AI技术,数字化转型,自动化测试', '担心技术落地难度,团队学习成本高', '快速落地,降低研发成本,提升交付质量', '竞品A,竞品B', '对我们的AI解决方案很感兴趣，约好下周三进行技术演示', 0, 85, 4, 4),
('李经理', 'li@finservice.com', '13900139002', '金融服务集团', 'https://finservice.com', '运营总监', '金融', '1000+人', '上海', 'medium', 'medium', '需求确认', '已预约', '100-200万', '2026-07', '线上咨询', '合规成本高,客户流失,运营效率低', '自动化,风控系统,智能客服', '对数据安全要求极高,合规风险担忧', '7x24小时支持,数据本地化部署,合规证明', '竞品C', '敏感客户，需要高层对接，合规要求严格', 1, 72, 4, 4),
('王总监', 'wang@retail.com', '13700137003', '零售连锁企业', 'https://retail.com', '市场总监', '零售', '100-500人', '广州', 'medium', 'high', '商务谈判', '待跟进', '30-50万', '2026-05', '老客户推荐', '获客成本高,转化低,会员复购率低', '私域运营,会员体系,精准营销', '价格敏感,担心ROI不达预期', '快速获客,提升转化率,会员忠诚度', '竞品D', '对私域运营方案非常认可，正在谈价格', 0, 90, 4, 4),
('陈总', 'chen@mfg.com', '13600136004', '精密制造有限公司', 'https://mfg.com', 'CEO', '制造业', '100-500人', '深圳', 'high', 'medium', '初步接触', '暂不联系', '20-30万', '', '线上咨询', '供应链管理难,质量追溯难,设备维护成本高', '智能制造,物联网,预测性维护', '暂无相关预算', '生产过程数字化,设备监控', '', '刚接触，先保持联系', 0, 45, 4, 4),
('刘总监', 'liu@health.com', '13500135005', '健康医疗科技', 'https://health.com', '技术总监', '医疗健康', '50-100人', '杭州', 'high', 'high', '需求确认', '待跟进', '80-120万', '2026-06', '老客户推荐', '数据处理效率低,多系统集成难', 'AI辅助诊断,数据中台', '对医疗数据合规要求极高', '医疗行业资质,数据安全,系统集成', '竞品E', '医疗AI项目，需要相关资质证明', 0, 78, 4, 4);

INSERT OR IGNORE INTO customer_profile_tags (customer_id, tag_id, tagged_by) VALUES
(1, 1, 4), (1, 6, 4), (1, 7, 4), (1, 11, 4), (1, 14, 4), (1, 20, 4),
(2, 2, 4), (2, 5, 4), (2, 8, 4), (2, 12, 4), (2, 15, 4), (2, 21, 4),
(3, 1, 4), (3, 6, 4), (3, 7, 4), (3, 11, 4), (3, 16, 4), (3, 22, 4),
(4, 3, 4), (4, 4, 4), (4, 9, 4), (4, 13, 4),
(5, 2, 4), (5, 5, 4), (5, 7, 4), (5, 12, 4), (5, 14, 4), (5, 20, 4);

INSERT OR IGNORE INTO email_templates (name, subject, content, tone, category, variable_fields, status, version, created_by, approved_by, approved_at) VALUES
('产品介绍邮件', '关于{{product_name}}的合作机会', '尊敬的{{customer_name}}：\n\n您好！我是来自我们公司的销售代表。了解到贵公司在{{company_name}}的卓越成就，我想向您介绍我们的{{product_name}}，它可以帮助您解决当前的业务挑战。\n\n我们的产品已经帮助多家同行业企业实现了效率提升和成本降低。\n\n期待与您进一步沟通。\n\n此致\n敬礼', 'professional', 'introductory', '["customer_name","company_name","product_name"]', 'approved', 1, 2, 3, CURRENT_TIMESTAMP);
