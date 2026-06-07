const db = require('./init');
const bcrypt = require('bcryptjs');

const seedData = () => {
  console.log('开始初始化测试数据...');

  db.serialize(() => {
    const hashedPassword = bcrypt.hashSync('123456', 10);

    const providers = [
      { username: 'zhang_clipper', name: '张剪辑师', email: 'zhang@example.com', phone: '13800000001', location: '北京市朝阳区', category: '视频剪辑', skills: [1, 2, 5] },
      { username: 'li_organizer', name: '李收纳师', email: 'li@example.com', phone: '13800000002', location: '北京市海淀区', category: '家居收纳', skills: [7, 8, 9] },
      { username: 'wang_escort', name: '王陪诊员', email: 'wang@example.com', phone: '13800000003', location: '北京市西城区', category: '陪诊服务', skills: [13, 14, 15] },
      { username: 'zhao_repair', name: '赵维修师傅', email: 'zhao@example.com', phone: '13800000004', location: '北京市东城区', category: '家电维修', skills: [19, 20, 23] },
      { username: 'chen_cleaner', name: '陈保洁', email: 'chen@example.com', phone: '13800000005', location: '北京市丰台区', category: '家政保洁', skills: [25, 26, 27] },
      { username: 'sun_mover', name: '孙搬家师傅', email: 'sun@example.com', phone: '13800000006', location: '北京市通州区', category: '搬家服务', skills: [31, 33, 34] },
      { username: 'zhou_pet', name: '周宠物师', email: 'zhou@example.com', phone: '13800000007', location: '北京市昌平区', category: '宠物照料', skills: [37, 38, 40] },
      { username: 'wu_tutor', name: '吴家教', email: 'wu@example.com', phone: '13800000008', location: '北京市朝阳区', category: '家教辅导', skills: [43, 44, 46] },
      { username: 'zheng_dev', name: '郑程序员', email: 'zheng@example.com', phone: '13800000009', location: '北京市海淀区', category: 'IT技术', skills: [49, 50, 52] },
      { username: 'feng_designer', name: '冯设计师', email: 'feng@example.com', phone: '13800000010', location: '北京市朝阳区', category: '设计创意', skills: [55, 56, 57] },
    ];

    const clients = [
      { username: 'client1', name: '客户小王', email: 'client1@example.com', phone: '13900000001', location: '北京市朝阳区' },
      { username: 'client2', name: '客户小李', email: 'client2@example.com', phone: '13900000002', location: '北京市海淀区' },
      { username: 'client3', name: '客户小张', email: 'client3@example.com', phone: '13900000003', location: '北京市西城区' },
    ];

    const requirements = [
      { title: '企业宣传片剪辑', description: '需要专业剪辑师剪辑企业宣传片，时长约5分钟，有原始素材，需要添加字幕和配乐', category: '视频剪辑', budget_fixed: 3000, location: '北京市朝阳区', deadline: '2026-06-30', deliverables: '剪辑成片、工程文件、配乐' },
      { title: '全屋收纳整理', description: '三居室全屋收纳整理，主要包括衣柜、厨房、书房，需要专业收纳师提供空间规划方案', category: '家居收纳', budget_fixed: 1500, location: '北京市海淀区', deadline: '2026-06-20', deliverables: '空间规划方案、收纳整理服务' },
      { title: '医院全程陪诊', description: '老人需要去医院做体检，需要陪诊员全程陪同，包括挂号、排队、取药、报告解读', category: '陪诊服务', budget_fixed: 500, location: '北京市西城区', deadline: '2026-06-15', deliverables: '全程陪诊服务、报告解读' },
      { title: '空调清洗加氟', description: '3台挂机空调需要清洗和加氟，其中一台制冷效果不好', category: '家电维修', budget_fixed: 800, location: '北京市东城区', deadline: '2026-06-18', deliverables: '空调清洗、加氟服务' },
      { title: '新房开荒保洁', description: '120平米新房开荒保洁，包括玻璃、地板、墙面等全方位清洁', category: '家政保洁', budget_min: 800, budget_max: 1200, location: '北京市丰台区', deadline: '2026-06-25', deliverables: '开荒保洁服务' },
      { title: '居民搬家服务', description: '两居室搬家，从5楼搬到3楼，有电梯，主要是家具和生活用品', category: '搬家服务', budget_fixed: 1800, location: '北京市通州区', deadline: '2026-06-22', deliverables: '搬家服务、家具拆装' },
      { title: '宠物寄养一周', description: '出国旅游需要寄养一只金毛犬，7天，要求每天遛狗两次', category: '宠物照料', budget_fixed: 700, location: '北京市昌平区', deadline: '2026-06-28', deliverables: '宠物寄养服务' },
      { title: '初三数学辅导', description: '初三学生数学辅导，每周2次，每次2小时，主要是中考冲刺', category: '家教辅导', budget_min: 200, budget_max: 300, location: '北京市朝阳区', deadline: '2026-07-15', deliverables: '数学辅导服务' },
      { title: '企业官网开发', description: '开发企业展示型官网，约10个页面，响应式设计，需要后台管理系统', category: 'IT技术', budget_fixed: 15000, location: '北京市海淀区', deadline: '2026-07-30', deliverables: '网站源码、后台系统、部署服务' },
      { title: '品牌Logo设计', description: '新公司需要设计品牌Logo，包含主Logo、副Logo、名片设计等', category: '设计创意', budget_fixed: 5000, location: '北京市朝阳区', deadline: '2026-06-30', deliverables: 'Logo设计方案、源文件、名片设计' },
    ];

    const insertProvider = (provider, callback) => {
      db.run(
        `INSERT INTO users (username, email, password, role, real_name, phone, location, is_verified, rating, rating_count, response_time, service_radius) 
         VALUES (?, ?, ?, 'provider', ?, ?, ?, 1, ?, ?, ?, ?)`,
        [provider.username, provider.email, hashedPassword, provider.name, provider.phone, provider.location, 4.5 + Math.random() * 0.5, Math.floor(Math.random() * 50) + 10, Math.floor(Math.random() * 30) + 15, Math.floor(Math.random() * 20) + 5],
        function(err) {
          if (err) {
            console.error('插入服务者失败:', err);
            return callback();
          }
          const userId = this.lastID;
          
          provider.skills.forEach((skillId, index) => {
            db.run(
              `INSERT INTO provider_skills (user_id, skill_tag_id, proficiency_level, years_experience, hourly_rate, is_certified) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [userId, skillId, Math.floor(Math.random() * 3) + 3, Math.floor(Math.random() * 8) + 2, 100 + Math.floor(Math.random() * 200), Math.random() > 0.3 ? 1 : 0]
            );
          });

          for (let i = 0; i < 3; i++) {
            db.run(
              `INSERT INTO portfolios (user_id, title, description, images, is_approved) 
               VALUES (?, ?, ?, ?, 1)`,
              [userId, `${provider.category}作品${i + 1}`, `专业${provider.category}服务案例，获得客户好评`, JSON.stringify([])]
            );
          }
          
          console.log(`✓ 创建服务者: ${provider.name} (${provider.category})`);
          callback();
        }
      );
    };

    const insertClient = (client, callback) => {
      db.run(
        `INSERT INTO users (username, email, password, role, real_name, phone, location) 
         VALUES (?, ?, ?, 'client', ?, ?, ?)`,
        [client.username, client.email, hashedPassword, client.name, client.phone, client.location],
        function(err) {
          if (err) {
            console.error('插入客户失败:', err);
            return callback();
          }
          console.log(`✓ 创建客户: ${client.name}`);
          callback(this.lastID);
        }
      );
    };

    const insertRequirement = (req, clientId, callback) => {
      db.run(
        `INSERT INTO service_requirements (client_id, title, description, category, budget_type, budget_fixed, budget_min, budget_max, location, delivery_deadline, deliverables, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
        [clientId, req.title, req.description, req.category, req.budget_fixed ? 'fixed' : 'range', req.budget_fixed || null, req.budget_min || null, req.budget_max || null, req.location, req.deadline, req.deliverables],
        function(err) {
          if (err) {
            console.error('插入需求失败:', err);
            return callback();
          }
          console.log(`✓ 创建需求: ${req.title}`);
          callback(this.lastID);
        }
      );
    };

    let providerIndex = 0;
    const nextProvider = () => {
      if (providerIndex < providers.length) {
        insertProvider(providers[providerIndex], () => {
          providerIndex++;
          nextProvider();
        });
      } else {
        let clientIndex = 0;
        const clientIds = [];
        
        const nextClient = () => {
          if (clientIndex < clients.length) {
            insertClient(clients[clientIndex], (id) => {
              if (id) clientIds.push(id);
              clientIndex++;
              nextClient();
            });
          } else {
            let reqIndex = 0;
            const requirementIds = [];
            
            const nextReq = () => {
              if (reqIndex < requirements.length) {
                const clientId = clientIds[reqIndex % clientIds.length];
                insertRequirement(requirements[reqIndex], clientId, (id) => {
                  if (id) requirementIds.push(id);
                  reqIndex++;
                  nextReq();
                });
              } else {
                createOrders(clientIds, requirementIds);
              }
            };
            nextReq();
          }
        };
        nextClient();
      }
    };

    nextProvider();
  });
};

const createOrders = (clientIds, requirementIds) => {
  console.log('');
  console.log('创建订单流程数据...');
  
  db.all('SELECT id FROM users WHERE role = "provider" ORDER BY id', (err, providerRows) => {
    if (err) {
      console.error('查询服务者失败:', err);
      return finishSeeding(10, 3, 10, 0, 0);
    }
    
    const providerIds = providerRows.map(p => p.id);
    const orderStatuses = ['pending_confirm', 'confirmed', 'in_progress', 'pending_delivery', 'pending_accept', 'completed', 'completed', 'completed'];
    const orderTitles = [
      '日常保洁服务',
      '空调维修保养',
      '衣柜收纳整理',
      '短视频剪辑制作',
      '宠物遛弯服务',
      '钢琴上门教学',
      '企业官网设计',
      '公司搬家服务'
    ];
    
    let orderIndex = 0;
    let completedCount = 0;
    let reviewCount = 0;
    
    const createNextOrder = () => {
      if (orderIndex >= orderTitles.length) {
        finishSeeding(10, 3, 10, orderTitles.length, reviewCount);
        return;
      }
      
      const status = orderStatuses[orderIndex];
      const providerId = providerIds[orderIndex % providerIds.length];
      const clientId = clientIds[orderIndex % clientIds.length];
      const reqId = requirementIds[orderIndex % requirementIds.length];
      const amount = 200 + (orderIndex * 150);
      const daysAgo = orderIndex * 2;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const updatedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      
      db.run(
        `INSERT INTO orders (requirement_id, client_id, provider_id, title, description, total_amount, deposit_amount, status, service_address, service_date, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reqId, clientId, providerId, orderTitles[orderIndex], `${orderTitles[orderIndex]}服务需求`, amount, Math.round(amount * 0.3), status, `北京市朝阳区XX街道${orderIndex}号`, '2026-06-15', createdAt, updatedAt],
        function(err) {
          if (err) {
            console.error('创建订单失败:', err);
          } else {
            const orderId = this.lastID;
            console.log(`✓ 创建订单 [${status}]: ${orderTitles[orderIndex]} - ¥${amount}`);
            
            if (status === 'completed') {
              completedCount++;
              const depositDate = new Date(Date.now() - (orderIndex * 2) * 24 * 60 * 60 * 1000).toISOString();
              const finalDate = new Date(Date.now() - orderIndex * 24 * 60 * 60 * 1000).toISOString();
              const reviewDate = new Date(Date.now() - orderIndex * 24 * 60 * 60 * 1000).toISOString();
              
              db.run(
                `INSERT INTO payments (order_id, user_id, amount, payment_type, status, transaction_id, created_at) 
                 VALUES (?, ?, ?, 'deposit', 'completed', ?, ?)`,
                [orderId, clientId, Math.round(amount * 0.3), `TXN${orderId}001`, depositDate]
              );
              
              db.run(
                `INSERT INTO payments (order_id, user_id, amount, payment_type, status, transaction_id, created_at) 
                 VALUES (?, ?, ?, 'final', 'completed', ?, ?)`,
                [orderId, clientId, Math.round(amount * 0.7), `TXN${orderId}002`, finalDate]
              );
              
              if (orderIndex >= 5) {
                const rating = orderIndex >= 6 ? 5 : 4;
                db.run(
                  `INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, content, is_anonymous, created_at) 
                   VALUES (?, ?, ?, ?, ?, 0, ?)`,
                  [orderId, clientId, providerId, rating, `服务很专业，${orderTitles[orderIndex]}做得很好，值得推荐！`, reviewDate],
                  function(err) {
                    if (!err) {
                      reviewCount++;
                      console.log(`  ↳ 已添加评价: ${rating}星`);
                    }
                  }
                );
              }
            }
            
            if (status === 'in_progress') {
              const depositDate = new Date().toISOString();
              db.run(
                `INSERT INTO payments (order_id, user_id, amount, payment_type, status, transaction_id, created_at) 
                 VALUES (?, ?, ?, 'deposit', 'completed', ?, ?)`,
                [orderId, clientId, Math.round(amount * 0.3), `TXN${orderId}001`, depositDate]
              );
            }
          }
          
          orderIndex++;
          setTimeout(createNextOrder, 50);
        }
      );
    };
    
    createNextOrder();
  });
};

const finishSeeding = (providers, clients, requirements, orders, reviews) => {
  console.log('');
  console.log('========================================');
  console.log('测试数据初始化完成！');
  console.log('========================================');
  console.log(`服务者: ${providers} 个`);
  console.log(`客户: ${clients} 个`);
  console.log(`需求: ${requirements} 个`);
  console.log(`订单: ${orders} 个`);
  console.log(`评价: ${reviews} 条`);
  console.log('');
  console.log('测试账号密码均为: 123456');
  console.log('管理员账号: admin / admin123');
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
