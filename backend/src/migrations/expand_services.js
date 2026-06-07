const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

const categories = [
  { name: '公安服务', code: 'police', department: '公安厅', icon: 'shield' },
  { name: '人社服务', code: 'hrss', department: '人力资源和社会保障厅', icon: 'user' },
  { name: '医保服务', code: 'medical', department: '医疗保障局', icon: 'heart' },
  { name: '教育服务', code: 'education', department: '教育厅', icon: 'book' },
  { name: '民政服务', code: 'civil', department: '民政厅', icon: 'home' },
  { name: '税务服务', code: 'tax', department: '税务局', icon: 'calculator' },
  { name: '住房服务', code: 'housing', department: '住房和城乡建设厅', icon: 'building' },
  { name: '交通服务', code: 'transport', department: '交通运输厅', icon: 'car' },
  { name: '市场监管', code: 'market', department: '市场监督管理局', icon: 'audit' },
  { name: '司法服务', code: 'justice', department: '司法厅', icon: 'balance' },
  { name: '自然资源', code: 'natural', department: '自然资源厅', icon: 'environment' },
  { name: '生态环境', code: 'environment', department: '生态环境厅', icon: 'cloud' },
  { name: '卫生健康', code: 'health', department: '卫生健康委员会', icon: 'medicine-box' },
  { name: '应急管理', code: 'emergency', department: '应急管理厅', icon: 'safety' },
  { name: '文化旅游', code: 'culture', department: '文化和旅游厅', icon: 'camera' },
  { name: '体育服务', code: 'sports', department: '体育局', icon: 'trophy' },
  { name: '科技服务', code: 'science', department: '科学技术厅', icon: 'bulb' },
  { name: '工信服务', code: 'industry', department: '工业和信息化厅', icon: 'apartment' },
  { name: '财政服务', code: 'finance', department: '财政厅', icon: 'dollar' },
  { name: '审计服务', code: 'audit', department: '审计厅', icon: 'file-search' },
  { name: '统计服务', code: 'statistics', department: '统计局', icon: 'bar-chart' },
  { name: '林业服务', code: 'forestry', department: '林业局', icon: 'tree' },
  { name: '水利服务', code: 'water', department: '水利厅', icon: 'water' },
  { name: '农业农村', code: 'agriculture', department: '农业农村厅', icon: 'coffee' },
  { name: '商务服务', code: 'commerce', department: '商务厅', icon: 'shop' },
  { name: '退役军人', code: 'veteran', department: '退役军人事务厅', icon: 'usergroup-add' },
  { name: '外事服务', code: 'foreign', department: '外事办公室', icon: 'global' },
  { name: '档案服务', code: 'archive', department: '档案局', icon: 'folder' }
];

const services = [
  { category: 1, name: '身份证办理', code: 'id_card_apply', handling_time: '15个工作日', is_hot: 1 },
  { category: 1, name: '居住证申领', code: 'residence_permit', handling_time: '7个工作日', is_hot: 1 },
  { category: 1, name: '户口迁移', code: 'household_migration', handling_time: '10个工作日', is_hot: 1 },
  { category: 1, name: '护照办理', code: 'passport_apply', handling_time: '7个工作日', is_hot: 0 },
  { category: 1, name: '港澳通行证', code: 'hk_macau_pass', handling_time: '7个工作日', is_hot: 0 },
  { category: 2, name: '社保查询', code: 'social_security_query', handling_time: '即时办理', is_hot: 1 },
  { category: 2, name: '养老保险转移', code: 'pension_transfer', handling_time: '30个工作日', is_hot: 1 },
  { category: 2, name: '失业保险金申领', code: 'unemployment_benefit', handling_time: '10个工作日', is_hot: 1 },
  { category: 2, name: '工伤认定申请', code: 'injury_recognition', handling_time: '60个工作日', is_hot: 0 },
  { category: 2, name: '技能补贴申领', code: 'skill_subsidy', handling_time: '15个工作日', is_hot: 0 },
  { category: 3, name: '医保报销', code: 'medical_reimbursement', handling_time: '15个工作日', is_hot: 1 },
  { category: 3, name: '异地就医备案', code: 'remote_medical_record', handling_time: '3个工作日', is_hot: 1 },
  { category: 3, name: '医保参保登记', code: 'medical_registration', handling_time: '5个工作日', is_hot: 1 },
  { category: 3, name: '慢性病认定', code: 'chronic_disease', handling_time: '20个工作日', is_hot: 0 },
  { category: 4, name: '学历认证', code: 'degree_verification', handling_time: '7个工作日', is_hot: 1 },
  { category: 4, name: '教师资格认定', code: 'teacher_cert', handling_time: '20个工作日', is_hot: 1 },
  { category: 4, name: '入学报名', code: 'school_enrollment', handling_time: '预约办理', is_hot: 1 },
  { category: 4, name: '助学贷款申请', code: 'student_loan', handling_time: '30个工作日', is_hot: 0 },
  { category: 5, name: '婚姻登记预约', code: 'marriage_registration', handling_time: '预约办理', is_hot: 1 },
  { category: 5, name: '低保申请', code: 'subsidy_apply', handling_time: '30个工作日', is_hot: 1 },
  { category: 5, name: '收养登记', code: 'adoption_reg', handling_time: '30个工作日', is_hot: 0 },
  { category: 5, name: '社会组织登记', code: 'ngo_registration', handling_time: '60个工作日', is_hot: 0 },
  { category: 6, name: '个人所得税申报', code: 'personal_tax', handling_time: '即时办理', is_hot: 1 },
  { category: 6, name: '发票申领', code: 'invoice_apply', handling_time: '5个工作日', is_hot: 1 },
  { category: 6, name: '税务登记变更', code: 'tax_change', handling_time: '即时办理', is_hot: 0 },
  { category: 6, name: '出口退税', code: 'export_tax_refund', handling_time: '20个工作日', is_hot: 0 },
  { category: 7, name: '公积金提取', code: 'housing_fund', handling_time: '7个工作日', is_hot: 1 },
  { category: 7, name: '不动产登记', code: 'real_estate_reg', handling_time: '20个工作日', is_hot: 1 },
  { category: 7, name: '预售许可证查询', code: 'presale_permit', handling_time: '即时办理', is_hot: 0 },
  { category: 8, name: '驾驶证换证', code: 'driver_license_renew', handling_time: '3个工作日', is_hot: 1 },
  { category: 8, name: '机动车上牌', code: 'vehicle_registration', handling_time: '5个工作日', is_hot: 1 },
  { category: 8, name: '网约车资格证', code: 'ride_hailing_cert', handling_time: '15个工作日', is_hot: 0 },
  { category: 8, name: '道路运输证', code: 'road_transport_cert', handling_time: '10个工作日', is_hot: 0 },
  { category: 9, name: '营业执照办理', code: 'business_license', handling_time: '3个工作日', is_hot: 1 },
  { category: 9, name: '企业变更登记', code: 'company_change', handling_time: '5个工作日', is_hot: 1 },
  { category: 9, name: '食品经营许可证', code: 'food_license', handling_time: '20个工作日', is_hot: 1 },
  { category: 9, name: '商标注册', code: 'trademark_reg', handling_time: '9个月', is_hot: 0 },
  { category: 10, name: '律师执业证', code: 'lawyer_license', handling_time: '30个工作日', is_hot: 0 },
  { category: 10, name: '公证申请', code: 'notary_apply', handling_time: '15个工作日', is_hot: 1 },
  { category: 10, name: '法律援助', code: 'legal_aid', handling_time: '7个工作日', is_hot: 1 },
  { category: 10, name: '人民调解', code: 'people_mediation', handling_time: '即时办理', is_hot: 0 },
  { category: 11, name: '不动产查询', code: 'property_query', handling_time: '即时办理', is_hot: 1 },
  { category: 11, name: '采矿权审批', code: 'mining_right', handling_time: '40个工作日', is_hot: 0 },
  { category: 11, name: '土地使用权登记', code: 'land_right_reg', handling_time: '20个工作日', is_hot: 0 },
  { category: 12, name: '环评审批', code: 'eia_approval', handling_time: '60个工作日', is_hot: 0 },
  { category: 12, name: '排污许可证', code: 'pollution_permit', handling_time: '30个工作日', is_hot: 0 },
  { category: 12, name: '环保投诉', code: 'env_complaint', handling_time: '15个工作日', is_hot: 0 },
  { category: 13, name: '预约挂号', code: 'medical_appointment', handling_time: '即时办理', is_hot: 1 },
  { category: 13, name: '出生证明', code: 'birth_certificate', handling_time: '7个工作日', is_hot: 1 },
  { category: 13, name: '死亡证明', code: 'death_certificate', handling_time: '即时办理', is_hot: 0 },
  { category: 13, name: '医师资格认定', code: 'doctor_qualification', handling_time: '30个工作日', is_hot: 0 },
  { category: 14, name: '安全生产许可证', code: 'safety_permit', handling_time: '45个工作日', is_hot: 0 },
  { category: 14, name: '应急预案备案', code: 'emergency_plan', handling_time: '10个工作日', is_hot: 0 },
  { category: 14, name: '灾害救助申请', code: 'disaster_relief', handling_time: '7个工作日', is_hot: 0 },
  { category: 15, name: '导游证办理', code: 'tour_guide_cert', handling_time: '20个工作日', is_hot: 0 },
  { category: 15, name: '文物保护审批', code: 'cultural_relic', handling_time: '60个工作日', is_hot: 0 },
  { category: 15, name: '图书馆读者证', code: 'library_card', handling_time: '即时办理', is_hot: 1 },
  { category: 16, name: '运动员等级', code: 'athlete_grade', handling_time: '30个工作日', is_hot: 0 },
  { category: 16, name: '社会体育指导员', code: 'sports_instructor', handling_time: '20个工作日', is_hot: 0 },
  { category: 16, name: '赛事活动审批', code: 'sports_event_approval', handling_time: '15个工作日', is_hot: 0 },
  { category: 17, name: '高新技术企业认定', code: 'high_tech_enterprise', handling_time: '60个工作日', is_hot: 0 },
  { category: 17, name: '科技项目申报', code: 'tech_project_apply', handling_time: '30个工作日', is_hot: 0 },
  { category: 17, name: '专利申请', code: 'patent_apply', handling_time: '3个月', is_hot: 0 },
  { category: 18, name: '信息化项目审批', code: 'it_project_approval', handling_time: '20个工作日', is_hot: 0 },
  { category: 18, name: '软件企业认定', code: 'software_enterprise', handling_time: '30个工作日', is_hot: 0 },
  { category: 18, name: '工业产品生产许可', code: 'industrial_product_permit', handling_time: '60个工作日', is_hot: 0 },
  { category: 19, name: '会计从业资格', code: 'accounting_qualification', handling_time: '即时办理', is_hot: 0 },
  { category: 19, name: '政府采购', code: 'government_procurement', handling_time: '30个工作日', is_hot: 0 },
  { category: 19, name: '票据领购', code: 'invoice_purchase', handling_time: '即时办理', is_hot: 0 },
  { category: 20, name: '审计查询', code: 'audit_query', handling_time: '即时办理', is_hot: 0 },
  { category: 20, name: '内部审计备案', code: 'internal_audit_record', handling_time: '10个工作日', is_hot: 0 },
  { category: 21, name: '统计登记', code: 'statistics_reg', handling_time: '即时办理', is_hot: 0 },
  { category: 21, name: '统计数据查询', code: 'stats_data_query', handling_time: '即时办理', is_hot: 0 },
  { category: 22, name: '林木采伐许可', code: 'logging_permit', handling_time: '20个工作日', is_hot: 0 },
  { category: 22, name: '林权证办理', code: 'forest_ownership_cert', handling_time: '30个工作日', is_hot: 0 },
  { category: 23, name: '取水许可', code: 'water_intake_permit', handling_time: '45个工作日', is_hot: 0 },
  { category: 23, name: '水土保持方案', code: 'soil_water_conservation', handling_time: '30个工作日', is_hot: 0 },
  { category: 24, name: '农村土地承包', code: 'rural_land_contract', handling_time: '30个工作日', is_hot: 0 },
  { category: 24, name: '农业补贴申请', code: 'agriculture_subsidy', handling_time: '15个工作日', is_hot: 1 },
  { category: 24, name: '动物检疫证明', code: 'animal_quarantine', handling_time: '即时办理', is_hot: 0 },
  { category: 25, name: '进出口权备案', code: 'import_export_right', handling_time: '15个工作日', is_hot: 0 },
  { category: 25, name: '外商投资备案', code: 'foreign_investment_record', handling_time: '10个工作日', is_hot: 0 },
  { category: 25, name: '会展备案', code: 'exhibition_record', handling_time: '7个工作日', is_hot: 0 },
  { category: 26, name: '优待证办理', code: 'veteran_preferential_cert', handling_time: '30个工作日', is_hot: 1 },
  { category: 26, name: '优抚对象认定', code: 'veteran_recognition', handling_time: '20个工作日', is_hot: 0 },
  { category: 26, name: '退役安置', code: 'veteran_placement', handling_time: '30个工作日', is_hot: 0 },
  { category: 27, name: '护照签证服务', code: 'passport_visa_service', handling_time: '15个工作日', is_hot: 0 },
  { category: 27, name: '涉外公证认证', code: 'foreign_notary', handling_time: '20个工作日', is_hot: 0 },
  { category: 28, name: '档案查询', code: 'archive_query', handling_time: '即时办理', is_hot: 0 },
  { category: 28, name: '档案寄存', code: 'archive_storage', handling_time: '即时办理', is_hot: 0 },
  { category: 28, name: '档案证明开具', code: 'archive_certification', handling_time: '即时办理', is_hot: 0 }
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO service_categories (name, code, department, icon, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);

const insertService = db.prepare(`
  INSERT OR IGNORE INTO service_items (category_id, name, code, department, handling_time, is_hot, required_materials)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  db.prepare('DELETE FROM application_steps').run();
  db.prepare('DELETE FROM applications').run();
  db.prepare('DELETE FROM service_items').run();
  db.prepare('DELETE FROM service_categories').run();

  categories.forEach((cat, idx) => {
    const result = insertCategory.run(cat.name, cat.code, cat.department, cat.icon, idx);
    cat.id = result.lastInsertRowid;
  });

  services.forEach(srv => {
    const category = categories[srv.category - 1];
    const materials = JSON.stringify([
      '身份证明',
      '申请表',
      '相关证明材料'
    ]);
    insertService.run(category.id, srv.name, srv.code, category.department, srv.handling_time, srv.is_hot, materials);
  });
})();

console.log(`已添加 ${categories.length} 个服务分类，${services.length} 个服务事项`);

db.close();
