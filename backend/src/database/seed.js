const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath, { verbose: console.log });

console.log('开始填充测试数据...');

const insertClient = db.prepare(`
  INSERT INTO clients (name, industry, contact_person, contact_phone, contact_email, settlement_method, status, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const clients = [
  { name: '腾讯科技', industry: '互联网', contact_person: '张经理', contact_phone: '13800138001', contact_email: 'zhang@tencent.com', settlement_method: '月度结算' },
  { name: '阿里巴巴', industry: '电商', contact_person: '李总监', contact_phone: '13800138002', contact_email: 'li@alibaba.com', settlement_method: '按人收费' },
  { name: '字节跳动', industry: '互联网', contact_person: '王主管', contact_phone: '13800138003', contact_email: 'wang@bytedance.com', settlement_method: '项目打包' },
];

clients.forEach(client => {
  insertClient.run(client.name, client.industry, client.contact_person, client.contact_phone, client.contact_email, client.settlement_method, 'active', 1);
});

console.log('✅ 客户数据插入完成');

const insertProject = db.prepare(`
  INSERT INTO projects (client_id, name, description, recruitment_target, start_date, end_date, status, settlement_method, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const projects = [
  { client_id: 1, name: '2024春季招聘', description: '技术岗春季批量招聘', recruitment_target: 50, start_date: '2024-03-01', end_date: '2024-06-30' },
  { client_id: 1, name: '社会招聘-技术', description: '高级技术人才招聘', recruitment_target: 20, start_date: '2024-04-01', end_date: '2024-09-30' },
  { client_id: 2, name: '电商运营扩招', description: '运营团队扩充', recruitment_target: 30, start_date: '2024-03-15', end_date: '2024-07-15' },
  { client_id: 3, name: '内容审核团队', description: '内容审核专员招聘', recruitment_target: 100, start_date: '2024-04-01', end_date: '2024-12-31' },
];

projects.forEach(project => {
  insertProject.run(project.client_id, project.name, project.description, project.recruitment_target, project.start_date, project.end_date, 'active', '月度结算', 1);
});

console.log('✅ 项目数据插入完成');

const insertPosition = db.prepare(`
  INSERT INTO positions (project_id, title, department, job_description, requirements, headcount, salary_range, location, batch, status, priority, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const positions = [
  { project_id: 1, title: '前端开发工程师', department: '技术部', job_description: '负责Web前端开发', requirements: '3年以上经验，React/Vue', headcount: 5, salary_range: '20k-35k', location: '深圳', batch: '第一批' },
  { project_id: 1, title: '后端开发工程师', department: '技术部', job_description: '负责服务端开发', requirements: 'Java/Go，5年经验', headcount: 8, salary_range: '25k-45k', location: '深圳', batch: '第一批' },
  { project_id: 1, title: '产品经理', department: '产品部', job_description: '负责产品规划', requirements: '5年以上产品经验', headcount: 3, salary_range: '30k-50k', location: '深圳', batch: '第一批' },
  { project_id: 2, title: '高级Java开发', department: '技术部', job_description: '核心系统开发', requirements: '8年以上Java', headcount: 5, salary_range: '35k-60k', location: '北京', batch: '第二批', status: 'open' },
  { project_id: 3, title: '电商运营专员', department: '运营部', job_description: '负责店铺运营', requirements: '2年以上电商经验', headcount: 10, salary_range: '10k-18k', location: '杭州', batch: '第一批' },
  { project_id: 4, title: '内容审核专员', department: '内容安全', job_description: '负责内容审核', requirements: '大专以上，责任心强', headcount: 50, salary_range: '6k-10k', location: '北京', batch: '第一批' },
  { project_id: 4, title: '审核组长', department: '内容安全', job_description: '负责审核团队管理', requirements: '3年以上管理经验', headcount: 5, salary_range: '12k-20k', location: '北京', batch: '第一批' },
];

positions.forEach(pos => {
  insertPosition.run(pos.project_id, pos.title, pos.department, pos.job_description, pos.requirements, pos.headcount, pos.salary_range, pos.location, pos.batch, pos.status || 'open', pos.priority || 'normal', 1);
});

console.log('✅ 岗位数据插入完成');

const insertAssignment = db.prepare(`
  INSERT INTO consultant_assignments (project_id, position_id, consultant_id, role)
  VALUES (?, ?, ?, ?)
`);

insertAssignment.run(1, 1, 2, '主顾问');
insertAssignment.run(1, 2, 2, '主顾问');
insertAssignment.run(2, 4, 2, '主顾问');
insertAssignment.run(3, 5, 2, '助理');
insertAssignment.run(4, 6, 2, '主顾问');

console.log('✅ 顾问分配完成');

const insertCandidate = db.prepare(`
  INSERT INTO candidates (name, phone, email, gender, age, education, work_experience, current_company, current_position, expected_salary, tags, source, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const candidates = [
  { name: '张三', phone: '13900139001', email: 'zhangsan@email.com', gender: '男', age: 28, education: '本科', work_experience: '5年前端开发经验', current_company: '某科技公司', current_position: '高级前端工程师', expected_salary: '30k', tags: 'React,Vue,TypeScript', source: 'BOSS直聘' },
  { name: '李四', phone: '13900139002', email: 'lisi@email.com', gender: '男', age: 32, education: '硕士', work_experience: '8年后端开发经验', current_company: '某大厂', current_position: '技术专家', expected_salary: '50k', tags: 'Java,微服务,高并发', source: '猎头推荐' },
  { name: '王芳', phone: '13900139003', email: 'wangfang@email.com', gender: '女', age: 26, education: '本科', work_experience: '3年产品经验', current_company: '某互联网公司', current_position: '产品经理', expected_salary: '25k', tags: 'B端产品,数据分析', source: '内推' },
  { name: '赵六', phone: '13900139004', email: 'zhaoliu@email.com', gender: '男', age: 30, education: '本科', work_experience: '6年Java开发', current_company: '某金融公司', current_position: '资深工程师', expected_salary: '40k', tags: 'Java,Spring,MySQL', source: '拉勾网' },
  { name: '陈小美', phone: '13900139005', email: 'chenxiaomei@email.com', gender: '女', age: 24, education: '本科', work_experience: '2年运营经验', current_company: '某电商平台', current_position: '运营专员', expected_salary: '15k', tags: '电商运营,活动策划', source: '校招' },
  { name: '刘强', phone: '13900139006', email: 'liuqiang@email.com', gender: '男', age: 25, education: '大专', work_experience: '1年审核经验', current_company: '某内容平台', current_position: '内容审核', expected_salary: '8k', tags: '内容审核,责任心强', source: '58同城' },
  { name: '周明', phone: '13900139007', email: 'zhouming@email.com', gender: '男', age: 29, education: '本科', work_experience: '5年前端经验', current_company: '某游戏公司', current_position: '前端开发', expected_salary: '32k', tags: 'React,Canvas,游戏', source: 'BOSS直聘' },
  { name: '吴丽', phone: '13900139008', email: 'wuli@email.com', gender: '女', age: 27, education: '硕士', work_experience: '4年后端经验', current_company: '某AI公司', current_position: '算法工程师', expected_salary: '45k', tags: 'Python,机器学习', source: '猎头' },
];

candidates.forEach(c => {
  insertCandidate.run(c.name, c.phone, c.email, c.gender, c.age, c.education, c.work_experience, c.current_company, c.current_position, c.expected_salary, c.tags, c.source, 1);
});

console.log('✅ 候选人数据插入完成');

const insertApplication = db.prepare(`
  INSERT INTO candidate_applications (candidate_id, position_id, current_stage, stage_status, is_repeat, pool_count, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertStageRecord = db.prepare(`
  INSERT INTO stage_records (application_id, stage, status, started_at, completed_at, result, notes, internal_notes, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const applications = [
  { candidate_id: 1, position_id: 1, current_stage: 'interview', stage_status: 'in_progress' },
  { candidate_id: 2, position_id: 2, current_stage: 'offer', stage_status: 'in_progress' },
  { candidate_id: 3, position_id: 3, current_stage: 'recommend', stage_status: 'completed' },
  { candidate_id: 4, position_id: 4, current_stage: 'phone_call', stage_status: 'in_progress' },
  { candidate_id: 5, position_id: 5, current_stage: 'screening', stage_status: 'pending' },
  { candidate_id: 6, position_id: 6, current_stage: 'onboard', stage_status: 'completed' },
  { candidate_id: 7, position_id: 1, current_stage: 'screening', stage_status: 'pending' },
  { candidate_id: 8, position_id: 2, current_stage: 'elimination', stage_status: 'completed' },
];

const now = new Date();
applications.forEach((app, idx) => {
  const result = insertApplication.run(app.candidate_id, app.position_id, app.current_stage, app.stage_status, 0, 1, 1);
  const appId = result.lastInsertRowid;
  
  const stages = ['screening', 'phone_call', 'recommend', 'interview', 'offer', 'onboard'];
  const currentIdx = stages.indexOf(app.current_stage);
  
  for (let i = 0; i <= currentIdx; i++) {
    const isCompleted = i < currentIdx || app.stage_status === 'completed';
    const startDate = new Date(now.getTime() - (currentIdx - i) * 2 * 24 * 60 * 60 * 1000);
    const endDate = isCompleted ? new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000) : null;
    
    insertStageRecord.run(
      appId,
      stages[i],
      isCompleted ? 'completed' : (app.stage_status === 'in_progress' ? 'in_progress' : 'pending'),
      startDate.toISOString(),
      endDate ? endDate.toISOString() : null,
      isCompleted ? 'pass' : null,
      isCompleted ? '通过' + stages[i] : null,
      '内部备注：候选人表现' + (isCompleted ? '优秀' : '待观察'),
      1
    );
  }
});

console.log('✅ 申请和阶段记录完成');

const insertElimination = db.prepare(`
  INSERT INTO elimination_reasons (application_id, stage, reason_category, reason_detail, description, created_by)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertElimination.run(8, 'offer', '薪资不匹配', '期望薪资超出预算', '候选人期望50k，预算上限45k，无法达成一致', 1);

console.log('✅ 淘汰原因完成');

const insertSlaConfig = db.prepare(`
  INSERT INTO sla_configs (project_id, position_id, metric_type, metric_name, target_hours, warning_hours, description)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const slaConfigs = [
  { project_id: 1, metric_type: 'position_response', metric_name: '岗位响应时间', target_hours: 24, warning_hours: 18 },
  { project_id: 1, metric_type: 'first_recommend', metric_name: '首批推荐时间', target_hours: 72, warning_hours: 48 },
  { project_id: 1, metric_type: 'interview_arrange', metric_name: '面试安排时间', target_hours: 48, warning_hours: 36 },
  { project_id: 1, metric_type: 'offer_follow', metric_name: 'Offer跟进时间', target_hours: 24, warning_hours: 12 },
  { project_id: 2, metric_type: 'position_response', metric_name: '岗位响应时间', target_hours: 24, warning_hours: 18 },
  { project_id: 2, metric_type: 'first_recommend', metric_name: '首批推荐时间', target_hours: 72, warning_hours: 48 },
];

slaConfigs.forEach(config => {
  insertSlaConfig.run(config.project_id, config.position_id || null, config.metric_type, config.metric_name, config.target_hours, config.warning_hours, config.description || '');
});

console.log('✅ SLA配置完成');

const insertSlaRecord = db.prepare(`
  INSERT INTO sla_records (application_id, stage_record_id, metric_type, start_time, end_time, actual_hours, target_hours, status, delay_reason)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const delayedStart = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
insertSlaRecord.run(1, 1, 'first_recommend', delayedStart.toISOString(), null, null, 72, 'warning', '候选人较多，筛选工作量大');

console.log('✅ SLA记录完成');

const insertReport = db.prepare(`
  INSERT INTO weekly_reports (project_id, week_start, week_end, content, new_positions, new_candidates, interviews, offers, onboards, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertReport.run(
  1,
  '2024-05-13',
  '2024-05-19',
  '本周招聘进展顺利，前端岗位推荐5人，后端推荐8人，产品推荐3人。面试安排12场，发出Offer 5个，入职2人。',
  3,
  16,
  12,
  5,
  2,
  1
);

console.log('✅ 周报数据完成');

db.close();
console.log('\n🎉 所有测试数据填充完成！');
console.log('📊 已填充: 3客户 + 4项目 + 7岗位 + 8候选人 + 8申请 + SLA配置');
