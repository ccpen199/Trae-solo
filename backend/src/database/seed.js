require('dotenv').config({ path: '../../.env' });
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/ssl_manager.db');
const db = new Database(dbPath);

const seed = () => {
  console.log('开始填充测试数据...');

  const domains = [
    { root_domain: 'example.com', sub_domain: '@', business_owner: '电商平台', dns_provider: '阿里云', cert_type: 'OV', contact_person: '张三', contact_email: 'zhangsan@example.com', priority_level: 'high' },
    { root_domain: 'example.com', sub_domain: 'www', business_owner: '电商平台', dns_provider: '阿里云', cert_type: 'OV', contact_person: '张三', contact_email: 'zhangsan@example.com', priority_level: 'high' },
    { root_domain: 'example.com', sub_domain: 'api', business_owner: '技术中台', dns_provider: '腾讯云', cert_type: 'DV', contact_person: '李四', contact_email: 'lisi@example.com', priority_level: 'high' },
    { root_domain: 'example.cn', sub_domain: '@', business_owner: '官网', dns_provider: 'Cloudflare', cert_type: 'EV', contact_person: '王五', contact_email: 'wangwu@example.com', priority_level: 'medium' },
    { root_domain: 'test.org', sub_domain: 'dev', business_owner: '测试部', dns_provider: '华为云', cert_type: 'DV', contact_person: '赵六', contact_email: 'zhaoliu@example.com', priority_level: 'low' },
    { root_domain: 'expired.com', sub_domain: '@', business_owner: '遗留系统', dns_provider: '阿里云', cert_type: 'DV', contact_person: '', contact_email: '', priority_level: 'low' },
    { root_domain: 'weak.com', sub_domain: '@', business_owner: '旧系统', dns_provider: '阿里云', cert_type: 'DV', contact_person: '老员工', contact_email: 'old@example.com', priority_level: 'medium' },
  ];

  const insertDomain = db.prepare(`
    INSERT OR IGNORE INTO domains (root_domain, sub_domain, full_domain, business_owner, dns_provider, cert_type, contact_person, contact_email, priority_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  domains.forEach(d => {
    const full_domain = d.sub_domain === '@' ? d.root_domain : `${d.sub_domain}.${d.root_domain}`;
    insertDomain.run(d.root_domain, d.sub_domain, full_domain, d.business_owner, d.dns_provider, d.cert_type, d.contact_person, d.contact_email, d.priority_level);
  });

  const now = new Date();
  const certificates = [
    { domain_id: 1, ca_provider: 'Let\'s Encrypt', serial_number: 'SERIAL001', common_name: 'example.com', san_list: 'example.com,www.example.com', key_storage: 'KMS-阿里云', deploy_locations: 'Nginx-SH01,CDN', auto_renew: 1, days_left: 45, algorithm: 'RSA-2048' },
    { domain_id: 2, ca_provider: 'Let\'s Encrypt', serial_number: 'SERIAL002', common_name: 'www.example.com', san_list: 'www.example.com', key_storage: 'KMS-阿里云', deploy_locations: 'Nginx-SH01,CDN', auto_renew: 1, days_left: 25, algorithm: 'RSA-2048' },
    { domain_id: 3, ca_provider: 'ZeroSSL', serial_number: 'SERIAL003', common_name: 'api.example.com', san_list: 'api.example.com', key_storage: '本地加密', deploy_locations: 'API-Gateway', auto_renew: 0, days_left: 10, algorithm: 'RSA-2048' },
    { domain_id: 4, ca_provider: 'DigiCert', serial_number: 'SERIAL004', common_name: 'example.cn', san_list: 'example.cn,www.example.cn', key_storage: 'HSM', deploy_locations: 'Web-Server', auto_renew: 0, days_left: 365, algorithm: 'RSA-4096' },
    { domain_id: 5, ca_provider: 'Let\'s Encrypt', serial_number: 'SERIAL005', common_name: 'dev.test.org', san_list: 'dev.test.org', key_storage: '本地', deploy_locations: 'Dev-Server', auto_renew: 1, days_left: 5, algorithm: 'RSA-2048' },
    { domain_id: 6, ca_provider: 'Let\'s Encrypt', serial_number: 'SERIAL006', common_name: 'expired.com', san_list: 'expired.com', key_storage: '本地', deploy_locations: 'Old-Server', auto_renew: 0, days_left: -5, algorithm: 'RSA-1024' },
    { domain_id: 7, ca_provider: 'Old-CA', serial_number: 'SERIAL007', common_name: 'weak.com', san_list: 'weak.com', key_storage: '未知', deploy_locations: 'Legacy', auto_renew: 0, days_left: 90, algorithm: 'MD5-RSA' },
  ];

  const insertCert = db.prepare(`
    INSERT OR IGNORE INTO certificates (domain_id, ca_provider, serial_number, common_name, san_list, key_storage, deploy_locations, auto_renew, issue_date, expiry_date, algorithm, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  certificates.forEach(c => {
    const issue_date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const expiry_date = new Date(now.getTime() + c.days_left * 24 * 60 * 60 * 1000).toISOString();
    const status = c.days_left < 0 ? 'expired' : (c.days_left < 15 ? 'expiring_soon' : 'valid');
    insertCert.run(c.domain_id, c.ca_provider, c.serial_number, c.common_name, c.san_list, c.key_storage, c.deploy_locations, c.auto_renew, issue_date, expiry_date, c.algorithm, status);
  });

  const tasks = [
    { cert_id: 3, domain_id: 3, task_type: 'renewal', trigger_days: 15, status: 'in_progress', validation_status: 'completed', issue_status: 'in_progress', deploy_status: 'pending', assignee: '李四' },
    { cert_id: 5, domain_id: 5, task_type: 'renewal', trigger_days: 7, status: 'pending', validation_status: 'pending', issue_status: 'pending', deploy_status: 'pending', assignee: '赵六' },
    { cert_id: 6, domain_id: 6, task_type: 'renewal', trigger_days: 1, status: 'failed', validation_status: 'failed', issue_status: 'pending', deploy_status: 'pending', assignee: '' },
  ];

  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO renewal_tasks (cert_id, domain_id, task_type, trigger_days, status, validation_status, issue_status, deploy_status, verify_status, assignee, due_date, failure_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  tasks.forEach(t => {
    const due_date = new Date(now.getTime() + t.trigger_days * 24 * 60 * 60 * 1000).toISOString();
    const failure_reason = t.status === 'failed' ? 'DNS验证失败，域名解析异常' : null;
    insertTask.run(t.cert_id, t.domain_id, t.task_type, t.trigger_days, t.status, t.validation_status, t.issue_status, t.deploy_status, 'pending', t.assignee, due_date, failure_reason);
  });

  const logs = [
    { domain_id: 1, cert_id: 1, change_type: 'certificate', action: '签发', description: '首次签发证书', operator: 'admin', status: 'success' },
    { domain_id: 3, cert_id: 3, change_type: 'dns', action: '修改解析', description: '修改API域名解析到新网关', operator: '李四', status: 'success', rollback_action: '恢复旧IP 10.0.0.1' },
    { domain_id: 6, cert_id: 6, change_type: 'renewal', action: '续签失败', description: '自动续签失败', operator: 'system', status: 'failed', failure_reason: 'DNS验证超时' },
    { domain_id: 2, cert_id: 2, change_type: 'deployment', action: '证书部署', description: '部署到CDN节点', operator: '张三', status: 'success' },
  ];

  const insertLog = db.prepare(`
    INSERT OR IGNORE INTO change_logs (domain_id, cert_id, task_id, change_type, action, description, operator, rollback_action, status, failure_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  logs.forEach(l => {
    insertLog.run(l.domain_id, l.cert_id, null, l.change_type, l.action, l.description, l.operator, l.rollback_action || null, l.status, l.failure_reason || null);
  });

  console.log('测试数据填充完成！');
};

seed();
db.close();
