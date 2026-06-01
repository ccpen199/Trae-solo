import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, './data/app.sqlite');
const db = new Database(dbPath);

const insertSampleData = () => {
  console.log('开始插入示例数据...');

  const competitors = [
    { name: 'ChatGPT', category: 'AI大模型', official_website: 'https://chat.openai.com', status: 'active', created_by: 'admin' },
    { name: 'Claude', category: 'AI大模型', official_website: 'https://anthropic.com', status: 'active', created_by: 'admin' },
    { name: '文心一言', category: 'AI大模型', official_website: 'https://yiyan.baidu.com', status: 'active', created_by: 'operator' },
    { name: '通义千问', category: 'AI大模型', official_website: 'https://tongyi.aliyun.com', status: 'active', created_by: 'operator' },
    { name: 'Midjourney', category: 'AI图像', official_website: 'https://midjourney.com', status: 'active', created_by: 'admin' },
    { name: 'Stable Diffusion', category: 'AI图像', official_website: 'https://stability.ai', status: 'active', created_by: 'admin' }
  ];

  const insertCompetitor = db.prepare(`
    INSERT INTO competitors (name, category, official_website, app_store_url, status, created_by)
    VALUES (@name, @category, @official_website, '', @status, @created_by)
  `);

  const competitorIds = [];
  competitors.forEach(c => {
    const result = insertCompetitor.run(c);
    competitorIds.push(result.lastInsertRowid);
    console.log(`插入竞品: ${c.name}`);
  });

  const prices = [
    { competitor_id: competitorIds[0], plan_name: '免费版', price: 0, currency: 'CNY', price_unit: '月', change_type: 'new', source_url: 'https://openai.com/pricing' },
    { competitor_id: competitorIds[0], plan_name: 'Plus版', price: 142, currency: 'CNY', price_unit: '月', change_type: 'new', source_url: 'https://openai.com/pricing' },
    { competitor_id: competitorIds[1], plan_name: 'Pro版', price: 150, currency: 'CNY', price_unit: '月', change_type: 'new', source_url: 'https://anthropic.com/pricing' },
    { competitor_id: competitorIds[2], plan_name: '基础版', price: 59.9, currency: 'CNY', price_unit: '月', change_type: 'new', source_url: 'https://yiyan.baidu.com/pricing' },
    { competitor_id: competitorIds[3], plan_name: '标准版', price: 99, currency: 'CNY', price_unit: '月', change_type: 'new', source_url: 'https://tongyi.aliyun.com/pricing' },
    { competitor_id: competitorIds[2], plan_name: '基础版', price: 79.9, currency: 'CNY', price_unit: '月', change_type: 'increase', previous_price: 59.9, source_url: 'https://yiyan.baidu.com/pricing' },
    { competitor_id: competitorIds[4], plan_name: '标准版', price: 68, currency: 'CNY', price_unit: '月', change_type: 'decrease', previous_price: 88, source_url: 'https://midjourney.com/pricing' }
  ];

  const insertPrice = db.prepare(`
    INSERT INTO price_history (competitor_id, plan_name, price, currency, price_unit, change_type, previous_price, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  prices.forEach(p => {
    insertPrice.run(p.competitor_id, p.plan_name, p.price, p.currency, p.price_unit, p.change_type, p.previous_price || null, p.source_url);
  });
  console.log(`插入 ${prices.length} 条价格记录`);

  const tasks = [
    { competitor_id: competitorIds[0], task_type: 'website', target_url: 'https://chat.openai.com', status: 'completed', created_by: 'operator' },
    { competitor_id: competitorIds[1], task_type: 'price', target_url: 'https://anthropic.com/pricing', status: 'running', created_by: 'operator' },
    { competitor_id: competitorIds[2], task_type: 'review', target_url: 'https://apps.apple.com/app/idxxxxxx', status: 'pending', created_by: 'auditor' },
    { competitor_id: competitorIds[4], task_type: 'feature', target_url: 'https://midjourney.com/features', status: 'reviewing', created_by: 'operator' },
    { competitor_id: null, task_type: 'website', target_url: 'https://example.com', status: 'auto_block', created_by: 'admin' }
  ];

  const insertTask = db.prepare(`
    INSERT INTO crawl_tasks (competitor_id, task_type, status, target_url, created_by)
    VALUES (@competitor_id, @task_type, @status, @target_url, @created_by)
  `);

  const taskIds = [];
  tasks.forEach(t => {
    const result = insertTask.run(t);
    taskIds.push(result.lastInsertRowid);
  });
  console.log(`插入 ${tasks.length} 条抓取任务`);

  const workflows = [];
  taskIds.forEach((taskId, index) => {
    const task = tasks[index];
    workflows.push({ task_id: taskId, action: 'create', operator: task.created_by, previous_status: null, new_status: 'pending' });
    if (task.status !== 'pending') {
      workflows.push({ task_id: taskId, action: 'submit', operator: task.created_by, previous_status: 'pending', new_status: 'queued' });
    }
    if (['running', 'completed', 'reviewing'].includes(task.status)) {
      workflows.push({ task_id: taskId, action: 'execute', operator: 'operator', previous_status: 'queued', new_status: task.status === 'running' ? 'running' : 'reviewing' });
    }
    if (task.status === 'completed') {
      workflows.push({ task_id: taskId, action: 'close', operator: 'auditor', reason: '抓取完成', previous_status: 'reviewing', new_status: 'completed' });
    }
    if (task.status === 'auto_block') {
      workflows.push({ task_id: taskId, action: 'close', operator: 'system', reason: '抓取失败，自动拦截', previous_status: 'running', new_status: 'auto_block' });
    }
  });

  const insertWorkflow = db.prepare(`
    INSERT INTO task_workflow (task_id, action, operator, reason, previous_status, new_status)
    VALUES (@task_id, @action, @operator, @reason, @previous_status, @new_status)
  `);

  workflows.forEach(w => {
    insertWorkflow.run({ ...w, reason: w.reason || '' });
  });
  console.log(`插入 ${workflows.length} 条工作流记录`);

  const reviews = [
    { competitor_id: competitorIds[0], source: 'App Store', rating: 4.8, content: '功能强大，回答准确，日常工作必备工具', reviewer: 'userA', sentiment: 'positive', is_noise: 0 },
    { competitor_id: competitorIds[0], source: '官网', rating: 4.5, content: '有时候会胡说八道，需要仔细甄别', reviewer: 'userB', sentiment: 'neutral', is_noise: 0 },
    { competitor_id: competitorIds[1], source: 'App Store', rating: 5.0, content: '上下文理解能力超强', reviewer: 'userC', sentiment: 'positive', is_noise: 0 },
    { competitor_id: competitorIds[2], source: '官网', rating: 4.0, content: '国内访问速度快，符合中文习惯', reviewer: 'userD', sentiment: 'positive', is_noise: 0 },
    { competitor_id: competitorIds[0], source: 'Other', rating: 3.0, content: '广告太多了影响使用', reviewer: 'spam123', sentiment: 'negative', is_noise: 1 },
    { competitor_id: competitorIds[4], source: '社区', rating: 4.7, content: '图像生成质量非常惊艳', reviewer: 'artist', sentiment: 'positive', is_noise: 0 }
  ];

  const insertReview = db.prepare(`
    INSERT INTO reviews (competitor_id, source, rating, content, reviewer, review_date, sentiment, is_noise)
    VALUES (@competitor_id, @source, @rating, @content, @reviewer, datetime('now'), @sentiment, @is_noise)
  `);

  reviews.forEach(r => insertReview.run(r));
  console.log(`插入 ${reviews.length} 条评论`);

  const features = [
    { feature_name: '多轮对话', category: '对话能力' },
    { feature_name: '代码生成', category: '编程能力' },
    { feature_name: '图像理解', category: '多模态' },
    { feature_name: '联网搜索', category: '附加功能' },
    { feature_name: '文件上传', category: '附加功能' },
    { feature_name: 'API调用', category: '开发者' }
  ];

  const insertFeature = db.prepare(`
    INSERT INTO feature_comparisons (feature_name, category)
    VALUES (@feature_name, @category)
  `);

  features.forEach(f => insertFeature.run(f));
  console.log(`插入 ${features.length} 个功能对比项`);

  const reports = [
    { title: '2026年5月AI大模型市场分析', report_type: 'general', content: '本月市场整体稳定，头部产品竞争激烈...', recommendations: '建议关注价格战趋势，优化定价策略', generated_by: 'admin' },
    { title: '文心一言涨价分析报告', report_type: 'price', content: '文心一言基础版从59.9元涨价至79.9元，涨幅33%', recommendations: '评估我方产品价格竞争力', generated_by: 'operator' }
  ];

  const insertReport = db.prepare(`
    INSERT INTO analysis_reports (title, report_type, content, recommendations, generated_by)
    VALUES (@title, @report_type, @content, @recommendations, @generated_by)
  `);

  reports.forEach(r => insertReport.run(r));
  console.log(`插入 ${reports.length} 份分析报告`);

  const logs = [
    { user_id: 'admin', action: 'create', target_type: 'competitor', target_id: competitorIds[0], details: '{"name":"ChatGPT"}', ip_address: '192.168.1.100' },
    { user_id: 'operator', action: 'create', target_type: 'crawl_task', target_id: taskIds[0], details: '{"task_type":"website"}', ip_address: '10.0.0.55' },
    { user_id: 'auditor', action: 'update', target_type: 'config_rule', target_id: 1, details: '{"is_enabled":1}', ip_address: '172.16.0.23' },
    { user_id: 'operator', action: 'close', target_type: 'crawl_task', target_id: taskIds[0], details: '{"result":"completed"}', ip_address: '203.0.113.45' },
    { user_id: 'admin', action: 'delete', target_type: 'competitor', target_id: competitorIds[1], details: '{"name":"Test"}', ip_address: '8.8.8.8' },
    { user_id: 'user', action: 'create', target_type: 'report', target_id: 1, details: '{"title":"测试报告"}', ip_address: '114.114.114.114' },
    { user_id: 'auditor', action: 'mark_noise', target_type: 'review', target_id: 5, details: '{}', ip_address: '192.168.100.254' },
    { user_id: 'operator', action: 'update', target_type: 'price_history', target_id: 3, details: '{"price":199}', ip_address: '10.10.10.10' }
  ];

  const insertLog = db.prepare(`
    INSERT INTO operation_logs (user_id, action, target_type, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  logs.forEach(l => insertLog.run(l.user_id, l.action, l.target_type, l.target_id, l.details, l.ip_address));
  console.log(`插入 ${logs.length} 条操作日志`);

  console.log('');
  console.log('========================================');
  console.log('示例数据插入完成！');
  console.log('========================================');
};

insertSampleData();
db.close();
