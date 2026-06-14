import db from '../database';
import { hashPassword, generateRequestNo, generateTransactionNo, generateEvidenceHash, stringifyJsonField } from '../utils/common';

export const runSeeders = async () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('数据库已存在数据，跳过种子数据初始化');
    return;
  }

  console.log('开始初始化种子数据...');

  const insertUserStmt = db.prepare(`
    INSERT INTO users (email, password, name, avatar, phone, userType, status, realNameVerified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProviderStmt = db.prepare(`
    INSERT INTO providers (userId, categoryId, bio, skills, rating, level, completedTasks, totalEarnings, location, verificationStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCategoryStmt = db.prepare(`
    INSERT INTO categories (name, icon, description, sortOrder)
    VALUES (?, ?, ?, ?)
  `);

  const insertTaskStmt = db.prepare(`
    INSERT INTO tasks (requestNo, title, description, categoryId, employerId, providerId, budgetMin, budgetMax, deadline, status, skillsRequired, attachments, reviewRemark, reviewBy, reviewAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBidStmt = db.prepare(`
    INSERT INTO bids (taskId, providerId, bidAmount, deliveryDays, proposal, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertSubmissionStmt = db.prepare(`
    INSERT INTO submissions (taskId, providerId, version, title, description, files, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReviewStmt = db.prepare(`
    INSERT INTO review_comments (taskId, submissionId, reviewerId, content, rating, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertPaymentStmt = db.prepare(`
    INSERT INTO payments (transactionNo, taskId, payerId, payeeId, amount, type, status, milestone, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertIpStmt = db.prepare(`
    INSERT INTO ip_certificates (submissionId, taskId, providerId, hash, type, title, description, registrationNo, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPortfolioStmt = db.prepare(`
    INSERT INTO portfolio_items (providerId, title, description, categoryId, images, files, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRatingStmt = db.prepare(`
    INSERT INTO ratings (taskId, raterId, rateeId, score, content)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAuditStmt = db.prepare(`
    INSERT INTO audit_logs (userId, module, action, targetId, targetType, details, ip, userAgent, riskLevel)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVerificationDocStmt = db.prepare(`
    INSERT INTO verification_docs (providerId, type, title, fileUrl, status, verifiedBy, verifiedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    const adminId = insertUserStmt.run(
      'admin@example.com',
      hashPassword('admin123456'),
      '平台管理员',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      '13800000000',
      'admin',
      'active',
      1
    ).lastInsertRowid as number;

    const employerId = insertUserStmt.run(
      'platform@example.com',
      hashPassword('123456'),
      '平台运营',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=platform',
      '13800000001',
      'platform',
      'active',
      1
    ).lastInsertRowid as number;

    const providerUserId = insertUserStmt.run(
      'ops@example.com',
      hashPassword('123456'),
      '运维专员',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=ops',
      '13800000002',
      'ops',
      'active',
      1
    ).lastInsertRowid as number;

    const categories = [
      { name: '政务办事', icon: '�️', description: '行政审批、许可办理、证照申领等政务服务', sortOrder: 1 },
      { name: '民生服务', icon: '�', description: '社保医保、公积金、教育卫生等民生保障', sortOrder: 2 },
      { name: '社区治理', icon: '�️', description: '物业管理、社区活动、志愿参与等基层治理', sortOrder: 3 },
      { name: '市场监管', icon: '�', description: '企业注册、商标专利、质量监管等市场服务', sortOrder: 4 },
      { name: '公共安全', icon: '🛡️', description: '应急响应、安全预警、消防交管等安全保障', sortOrder: 5 },
      { name: '数据分析', icon: '📈', description: '政务数据、热力报表、趋势分析等数据服务', sortOrder: 6 }
    ];

    const categoryIds: number[] = [];
    categories.forEach(cat => {
      categoryIds.push(insertCategoryStmt.run(cat.name, cat.icon, cat.description, cat.sortOrder).lastInsertRowid as number);
    });

    const providerSkills = [
      ['行政审批', '电子证照', '一网通办', '政务公开'],
      ['社保经办', '医保服务', '公积金管理', '救助发放'],
      ['网格管理', '物业协调', '矛盾调解', '智慧社区'],
      ['企业登记', '商标注册', '质量检测', '信用监管'],
      ['应急管理', '消防监管', '交通安全', '治安防控'],
      ['数据治理', 'BI分析', '热力图', '趋势预测']
    ];

    const providerNames = [
      '政务服务窗口',
      '民生保障中心',
      '社区治理工作站',
      '市场监管所',
      '公共安全指挥中心',
      '政务数据分析科'
    ];

    const providerLocations = ['常州市天宁区', '常州市钟楼区', '常州市武进区', '常州市新北区', '常州市金坛区', '常州市溧阳市'];

    const providerIds: number[] = [];
    for (let i = 0; i < 4; i++) {
      const userId = insertUserStmt.run(
        `ops${i + 2}@example.com`,
        hashPassword('123456'),
        `${providerNames[i]}`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=ops${i + 2}`,
        `1380000001${i + 3}`,
        'ops',
        'active',
        1
      ).lastInsertRowid as number;

      const providerId = insertProviderStmt.run(
        userId,
        categoryIds[i],
        `专业的${providerNames[i]}，拥有10年行业经验，服务超过500家客户。`,
        stringifyJsonField(providerSkills[i]),
        4.5 + Math.random() * 0.5,
        i + 1,
        10 + i * 5,
        50000 + i * 20000,
        providerLocations[i],
        'verified'
      ).lastInsertRowid as number;

      providerIds.push(providerId);

      insertVerificationDocStmt.run(
        providerId,
        'business_license',
        '营业执照',
        `/uploads/docs/license-${i}.jpg`,
        'verified',
        adminId,
        new Date().toISOString()
      );
    }

    const mainProviderId = insertProviderStmt.run(
      providerUserId,
      categoryIds[0],
      '资深政务服务专员，8年政务窗口服务经验，擅长行政审批流程优化和电子证照办理，注重服务效率和群众满意度。',
      stringifyJsonField(providerSkills[0]),
      4.8,
      3,
      25,
      150000,
      '常州市天宁区',
      'verified'
    ).lastInsertRowid as number;

    providerIds.unshift(mainProviderId);

    const taskTemplates = [
      {
        title: '企业开办一网通办',
        description: '为新开办企业提供营业执照、刻章、税务登记、社保开户等全流程在线办理服务，实现一次提交、并联审批。',
        categoryIndex: 0,
        budgetMin: 0,
        budgetMax: 0,
        deadlineDays: 5,
        status: 'published',
        skills: ['行政审批', '一网通办', '证照联办']
      },
      {
        title: '医保异地就医备案',
        description: '为常州市参保人员提供异地就医备案线上办理服务，含跨省异地就医直接结算、转诊备案等业务。',
        categoryIndex: 1,
        budgetMin: 0,
        budgetMax: 0,
        deadlineDays: 3,
        status: 'bidding',
        skills: ['医保服务', '异地就医', '直接结算']
      },
      {
        title: '智慧社区网格化管理',
        description: '推进社区网格化治理，整合物业报修、矛盾调解、安全巡查、居民议事等功能，建设智慧社区综合服务平台。',
        categoryIndex: 2,
        budgetMin: 50000,
        budgetMax: 120000,
        deadlineDays: 60,
        status: 'in_progress',
        skills: ['网格管理', '智慧社区', '物业协调']
      },
      {
        title: '企业信用监管审查',
        description: '对辖区企业进行信用等级评定和专项审查，包含经营异常名录管理、严重违法失信名单核查、双随机一公开抽查。',
        categoryIndex: 3,
        budgetMin: 0,
        budgetMax: 0,
        deadlineDays: 15,
        status: 'reviewing',
        skills: ['信用监管', '双随机', '企业审查']
      },
      {
        title: '消防安全应急演练',
        description: '组织重点区域消防安全应急演练和隐患排查，完善应急响应预案，提升公共安全防控能力。',
        categoryIndex: 4,
        budgetMin: 30000,
        budgetMax: 80000,
        deadlineDays: 30,
        status: 'completed',
        skills: ['应急管理', '消防演练', '安全排查']
      },
      {
        title: '政务服务热力分析报表',
        description: '对全市政务服务事项办理量、满意度、等待时长等维度进行热力分析，生成可视化报表辅助决策优化。',
        categoryIndex: 5,
        budgetMin: 20000,
        budgetMax: 50000,
        deadlineDays: 20,
        status: 'completed',
        skills: ['数据分析', '热力图', 'BI报表']
      }
    ];

    const taskIds: number[] = [];
    taskTemplates.forEach((template, index) => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + template.deadlineDays);

      const providerId = template.status === 'published' || template.status === 'bidding' ? null :
        template.status === 'completed' && index === 4 ? providerIds[3] :
        template.status === 'completed' && index === 5 ? providerIds[4] :
        providerIds[index % providerIds.length];

      const reviewBy = template.status === 'completed' ? adminId : null;
      const reviewAt = template.status === 'completed' ? new Date().toISOString() : null;
      const reviewRemark = template.status === 'completed' ? '审核通过，任务完成' : null;

      const taskId = insertTaskStmt.run(
        generateRequestNo(),
        template.title,
        template.description,
        categoryIds[template.categoryIndex],
        employerId,
        providerId,
        template.budgetMin,
        template.budgetMax,
        deadline.toISOString(),
        template.status,
        stringifyJsonField(template.skills),
        stringifyJsonField([`/uploads/attachments/task-${index + 1}.pdf`]),
        reviewRemark,
        reviewBy,
        reviewAt
      ).lastInsertRowid as number;

      taskIds.push(taskId);
    });

    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i];
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;

      if (task.status === 'bidding' || task.status === 'published') {
        const numBids = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numBids; j++) {
          const providerId = providerIds[j % providerIds.length];
          if (task.providerId && task.providerId === providerId) continue;

          const bidAmount = task.budgetMin + Math.random() * (task.budgetMax - task.budgetMin);
          const deliveryDays = Math.floor(task.budgetMin / 1000) + 5;

          insertBidStmt.run(
            taskId,
            providerId,
            Math.round(bidAmount),
            deliveryDays,
            `本部门具有丰富的${task.title}经验，能够高效完成此项服务。我们将安排专员全程跟进，确保按时办结、群众满意。`,
            'pending'
          );
        }
      }

      if (task.status === 'in_progress' || task.status === 'reviewing' || task.status === 'completed') {
        const submissionId = insertSubmissionStmt.run(
          taskId,
          task.providerId,
          1,
          `${task.title} - 初稿`,
          '根据服务需求完成的第一版办理方案，请审阅。包含所有核心流程的服务方案。',
          stringifyJsonField([`/uploads/submissions/${taskId}/v1/design.psd`, `/uploads/submissions/${taskId}/v1/preview.pdf`]),
          generateEvidenceHash({ taskId, version: 1, timestamp: Date.now() })
        ).lastInsertRowid as number;

        insertIpStmt.run(
          submissionId,
          taskId,
          task.providerId,
          generateEvidenceHash({ submissionId, type: 'submission' }),
          'submission',
          `${task.title} - 第一版稿件存证`,
          '自动生成的知识产权存证',
          null,
          'registered'
        );

        if (task.status === 'reviewing') {
          insertReviewStmt.run(
            taskId,
            submissionId,
            employerId,
            '整体办理流程正确，但部分环节还需优化。材料审核环节需要更高效，信息采集区域可以更精简。',
            4,
            'comment'
          );

          const v2SubmissionId = insertSubmissionStmt.run(
            taskId,
            task.providerId,
            2,
            `${task.title} - 修改稿`,
                    '根据反馈意见进行了优化：1. 简化了材料提交流程，减少重复填报；2. 优化了信息采集表单；3. 增加了办理进度实时查询功能。',
            stringifyJsonField([`/uploads/submissions/${taskId}/v2/design.psd`, `/uploads/submissions/${taskId}/v2/preview.pdf`]),
            generateEvidenceHash({ taskId, version: 2, timestamp: Date.now() })
          ).lastInsertRowid as number;

          insertIpStmt.run(
            v2SubmissionId,
            taskId,
            task.providerId,
            generateEvidenceHash({ submissionId: v2SubmissionId, type: 'submission' }),
            'submission',
            `${task.title} - 第二版稿件存证`,
            '自动生成的知识产权存证',
            null,
            'registered'
          );
        }

        if (task.status === 'completed') {
          insertReviewStmt.run(
            taskId,
            submissionId,
            employerId,
            '服务质量很高，完全符合办理要求。工作人员沟通顺畅，处理响应及时。非常满意！',
            5,
            'accepted'
          );

          const providerRecord = db.prepare('SELECT userId FROM providers WHERE id = ?').get(task.providerId) as { userId: number };

          insertRatingStmt.run(
            taskId,
            employerId,
            providerRecord.userId,
            5,
            '专业、高效、沟通顺畅，强烈推荐！'
          );

          const transactionNo = generateTransactionNo();

          insertPaymentStmt.run(
            transactionNo,
            taskId,
            employerId,
            providerRecord.userId,
            task.budgetMax,
            'release',
            'completed',
            '项目验收完成',
            '项目验收完成，款项已打款'
          );

          insertPaymentStmt.run(
            generateTransactionNo(),
            taskId,
            employerId,
            providerRecord.userId,
            task.budgetMax * 0.3,
            'escrow',
            'completed',
            '项目启动款',
            null
          );

          if (task.budgetMax > 20000) {
            insertPaymentStmt.run(
              generateTransactionNo(),
              taskId,
              employerId,
              providerRecord.userId,
              task.budgetMax * 0.3,
              'milestone',
              'completed',
              '流程确认',
              null
            );
          }
        }
      }
    }

    for (let i = 0; i < providerIds.length; i++) {
      const providerId = providerIds[i];
      const numWorks = 3 + Math.floor(Math.random() * 3);

      for (let j = 0; j < numWorks; j++) {
        const workTitles = [
          '企业开办一站式服务',
          '医保异地就医备案系统',
          '智慧社区综合管理平台',
          '市民服务卡集成应用',
          '政务移动端办事大厅',
          '营商环境优化方案',
          '公共安全应急指挥系统',
          '政务服务门户改版'
        ];

        insertPortfolioStmt.run(
          providerId,
          `${workTitles[(i + j) % workTitles.length]} - 案例${j + 1}`,
          `这是一个专业的${workTitles[(i + j) % workTitles.length]}项目，我们从需求梳理到最终上线全程把控，确保服务质量。项目获得了群众的高度认可。`,
          categoryIds[(i + j) % categoryIds.length],
          stringifyJsonField([
            `/uploads/portfolio/${providerId}/${j + 1}/cover.jpg`,
            `/uploads/portfolio/${providerId}/${j + 1}/detail1.jpg`,
            `/uploads/portfolio/${providerId}/${j + 1}/detail2.jpg`
          ]),
          stringifyJsonField([`/uploads/portfolio/${providerId}/${j + 1}/source.zip`]),
          stringifyJsonField(['政务服务', '民生保障', '智慧治理'])
        );
      }
    }

    for (let i = 0; i < 3; i++) {
      insertIpStmt.run(
        null,
        taskIds[i % taskIds.length],
        providerIds[i % providerIds.length],
        generateEvidenceHash({ type: 'copyright', index: i }),
        'copyright',
        `版权登记 - 政务服务系统${i + 1}`,
        `政务服务系统版权登记，包含系统设计文档和开发过程记录。`,
        `CR${Date.now()}${i}`,
        'registered'
      );
    }

    const auditActions = [
      { module: 'auth', action: 'login_success', riskLevel: 'low' },
      { module: 'task', action: 'create', riskLevel: 'low' },
      { module: 'task', action: 'submit_review', riskLevel: 'medium' },
      { module: 'task', action: 'status_change', riskLevel: 'medium' },
      { module: 'bid', action: 'create', riskLevel: 'low' },
      { module: 'bid', action: 'accept', riskLevel: 'high' },
      { module: 'submission', action: 'create', riskLevel: 'medium' },
      { module: 'review', action: 'accept', riskLevel: 'high' },
      { module: 'payment', action: 'release', riskLevel: 'high' },
      { module: 'ip', action: 'deposit', riskLevel: 'medium' },
      { module: 'provider', action: 'update', riskLevel: 'low' },
      { module: 'user', action: 'update_profile', riskLevel: 'low' }
    ];

    for (let i = 0; i < 50; i++) {
      const action = auditActions[i % auditActions.length];
      const userIds = [adminId, employerId, providerUserId];

      insertAuditStmt.run(
        userIds[i % userIds.length],
        action.module,
        action.action,
        i,
        ['task', 'provider', 'payment', 'ip'][i % 4],
        JSON.stringify({ detail: `模拟审计日志记录 ${i + 1}` }),
        '127.0.0.1',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        action.riskLevel
      );
    }

    for (let i = 0; i < 5; i++) {
      const convId = `conv_${Math.min(employerId, providerUserId)}_${Math.max(employerId, providerUserId)}`;
      db.prepare(`
        INSERT INTO messages (conversationId, senderId, receiverId, content, type, isRead)
        VALUES (?, ?, ?, ?, 'text', ?)
      `).run(
        convId,
        i % 2 === 0 ? employerId : providerUserId,
        i % 2 === 0 ? providerUserId : employerId,
        i === 0 ? '您好，我想咨询一下公积金提取的办理流程和所需材料。' :
        i === 1 ? '好的，公积金提取需要提供身份证、购房合同或租赁合同，我帮您查一下具体流程...' :
        i === 2 ? '了解了，请问办理周期大概多长时间？' :
        i === 3 ? '一般3-5个工作日可以完成，紧急情况可以走绿色通道' : '好的，那我明天去窗口办理，需要带什么证件吗？',
        i < 4 ? 1 : 0
      );
    }
  });

  seedTransaction();

  console.log('种子数据初始化完成！');
  console.log('测试账号：');
  console.log('  管理员：admin@example.com / admin123456');
  console.log('  平台运营：platform@example.com / 123456');
  console.log('  运维专员：ops@example.com / 123456');
};

if (require.main === module) {
  runSeeders().then(() => {
    console.log('种子数据脚本执行完成');
    process.exit(0);
  }).catch(err => {
    console.error('种子数据初始化失败：', err);
    process.exit(1);
  });
}

export default runSeeders;
