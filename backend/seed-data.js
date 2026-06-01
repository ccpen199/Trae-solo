const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

console.log('开始插入演示数据...\n');

const insertFamilyProfile = db.prepare(`
  INSERT INTO family_profiles (
    child_name, child_age, child_grade, main_problems, parent_demands,
    previous_consultation, confidentiality_authorized, parent_id, consultant_id,
    status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const insertAssessment = db.prepare(`
  INSERT INTO assessments (
    family_id, consultant_id, questionnaire_results, interview_notes,
    behavior_records, risk_level, consultation_goals, report_content,
    reviewed_by, review_status, review_notes, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const insertConsultationPlan = db.prepare(`
  INSERT INTO consultation_plans (
    family_id, assessment_id, consultant_id, supervisor_id,
    cycle_weeks, service_package, phase_goals, homework,
    supervisor_review_status, supervisor_notes, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const insertFollowUpRecord = db.prepare(`
  INSERT INTO follow_up_records (
    family_id, plan_id, consultant_id, session_date,
    session_content, parent_feedback, homework_completion, risk_change,
    next_steps, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const insertSatisfaction = db.prepare(`
  INSERT INTO satisfaction_surveys (
    family_id, follow_up_id, score, feedback, created_at, updated_at
  ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const insertRenewal = db.prepare(`
  INSERT INTO renewals (
    family_id, plan_id, renewal_date, amount, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const families = [
  {
    child: { name: '小明', age: 8, grade: '二年级' },
    problems: '注意力不集中，学习困难，与同学冲突频繁',
    demands: '家长希望提升孩子注意力，改善同伴关系，提高学习成绩',
    history: '2023年曾在儿童医院做过注意力测评，显示多动倾向',
    risk: 'medium',
    parentId: 4,
    consultantId: 2,
    supervisorId: 3,
  },
  {
    child: { name: '小红', age: 12, grade: '六年级' },
    problems: '青春期叛逆，与父母沟通困难，沉迷手机游戏',
    demands: '家长担心影响升初中考试，希望改善亲子关系和手机使用习惯',
    history: '无既往咨询史',
    risk: 'high',
    parentId: 4,
    consultantId: 2,
    supervisorId: 3,
  },
  {
    child: { name: '小刚', age: 15, grade: '初三' },
    problems: '考试焦虑，睡眠障碍，成绩下滑明显，有时有自残想法',
    demands: '面临中考压力，家长非常焦虑，希望缓解考试焦虑，恢复正常睡眠',
    history: '初二时曾有过厌学情绪，持续2周未上学',
    risk: 'very_high',
    parentId: 4,
    consultantId: 2,
    supervisorId: 3,
  },
  {
    child: { name: '小丽', age: 6, grade: '一年级' },
    problems: '入园适应困难，分离焦虑，每天上学前哭闹不止',
    demands: '家长担心影响孩子心理健康发展，希望帮助孩子适应学校生活',
    history: '无既往咨询史',
    risk: 'low',
    parentId: 4,
    consultantId: 2,
    supervisorId: 3,
  },
  {
    child: { name: '小强', age: 10, grade: '四年级' },
    problems: '作业拖延，时间管理差，家庭作业经常做到深夜11点以后',
    demands: '家长希望培养良好的学习习惯，提高学习效率',
    history: '无既往咨询史',
    risk: 'medium',
    parentId: 4,
    consultantId: 2,
    supervisorId: 3,
  },
];

const riskLabels = {
  low: '低',
  medium: '中',
  high: '高',
  very_high: '极高',
};

const packageTypes = ['基础服务包', '标准服务包', '深度服务包', 'VIP服务包'];
const reviewStatuses = ['approved', 'pending', 'rejected'];
const reviewLabels = { approved: '已通过', pending: '待审核', rejected: '已驳回' };

families.forEach((family, index) => {
  const fpResult = insertFamilyProfile.run(
    family.child.name,
    family.child.age,
    family.child.grade,
    family.problems,
    family.demands,
    family.history,
    1,
    family.parentId,
    family.consultantId,
    index < 4 ? 'active' : 'completed'
  );

  const familyId = fpResult.lastInsertRowid;
  console.log(`✅ 家庭档案 ${index + 1}: ${family.child.name} (ID: ${familyId})`);

  const assessmentResult = insertAssessment.run(
    familyId,
    family.consultantId,
    `注意力测评得分: ${65 + index * 8}\n行为量表得分: ${58 + index * 6}\n情绪量表得分: ${70 + index * 5}\n学习动机得分: ${62 + index * 7}`,
    `访谈显示${family.child.name}在课堂上难以保持专注，经常打断老师讲课。\n家长反映在家写作业时频繁起身，每天作业需要家长反复催促才能完成。\n与同伴关系紧张，曾因小事与同学发生肢体冲突。\n家长管教方式以打骂为主，亲子沟通存在障碍。`,
    `观察到孩子在15分钟内起身7次，注意力集中时间约3-5分钟。\n对感兴趣的事物（如游戏）可以保持较长时间专注。\n与咨询师互动时表现出较强的防御心理，不易敞开心扉。`,
    family.risk,
    `1. 提升注意力维持时间至15分钟以上\n2. 改善同伴交往方式，减少冲突次数\n3. 培养自主完成作业的习惯和时间管理能力\n4. 帮助家长建立有效的亲子沟通模式，减少打骂\n5. 提升孩子自信心和自我价值感`,
    `综合评估显示${family.child.name}存在注意力缺陷症状，同时伴随行为和情绪问题。\n风险等级${riskLabels[family.risk]}，需要立即干预。\n建议进行每周2次的个体心理咨询，配合家庭行为训练。\n家长需同步参加亲子沟通辅导。`,
    family.supervisorId,
    index % 2 === 0 ? 'approved' : 'pending',
    index % 2 === 0 ? '评估结果准确，建议按计划执行。注意家长同步辅导的重要性。' : null
  );
  const assessmentId = assessmentResult.lastInsertRowid;
  console.log(`   ↳ 初评 ID: ${assessmentId}, 风险: ${riskLabels[family.risk]}, 复核: ${index % 2 === 0 ? '✅已复核' : '⏳待复核'}`);

  const planStatus = reviewStatuses[index % 3];
  const planResult = insertConsultationPlan.run(
    familyId,
    assessmentId,
    family.consultantId,
    family.supervisorId,
    [8, 12, 16, 24][index % 4],
    packageTypes[index % 4],
    `第一阶段(1-4周): 建立咨询关系，进行注意力训练和情绪识别\n第二阶段(5-8周): 行为矫正，同伴交往角色扮演，家长辅导\n第三阶段(9-12周): 家庭系统干预，巩固效果，预防复发\n第四阶段(13-16周): 社会技能拓展，学习策略训练`,
    `1. 每日注意力训练游戏（舒尔特方格）15分钟\n2. 家庭行为积分表，每日评分，每周兑换奖励\n3. 每周亲子沟通时间不少于5小时，使用"我语句"表达\n4. 家长阅读《如何说孩子才会听》并完成读书笔记\n5. 每日户外活动30分钟，保证充足睡眠`,
    planStatus,
    planStatus === 'approved' ? '方案设计合理，各阶段目标明确。执行中注意根据孩子实际情况灵活调整。' : planStatus === 'rejected' ? '建议增加针对家长的系统辅导内容，作业可适当简化以便坚持。' : null,
    index < 3 ? 'in_progress' : 'completed'
  );
  const planId = planResult.lastInsertRowid;
  console.log(`   ↳ 方案 ID: ${planId}, 周期: ${[8, 12, 16, 24][index % 4]}周, 审核: ${reviewLabels[planStatus]}`);

  const followUpCount = 2 + (index % 3);
  for (let i = 0; i < followUpCount; i++) {
    const homeworkStatus = i === followUpCount - 1 ? 'partial' : 'completed';
    const riskChange = family.risk === 'low' ? 'improved' : (i >= followUpCount - 1 ? 'stable' : 'unchanged');
    const followUpResult = insertFollowUpRecord.run(
      familyId,
      planId,
      family.consultantId,
      `2026-05-${10 + i * 3}`,
      `第${i + 1}次咨询（${family.child.name}）：\n• 进行了舒尔特方格注意力训练，成绩从18秒提升到15秒\n• 讨论了课堂上如何举手发言，而不是打断老师\n• 角色扮演练习：如何友好地向同学借东西\n• 情绪识别练习：识别自己和他人的情绪表情\n• ${i > 0 ? '回顾上周家庭作业完成情况，肯定孩子的努力' : '说明咨询设置，建立安全信任的关系'}`,
      `家长反映本周孩子写作业时起身次数明显减少，从每天7-8次减少到3-4次。\n孩子主动分享了学校发生的事情，沟通意愿明显增强。\n本周未发生与同学的冲突事件，老师反映课堂表现有进步。\n家长开始尝试使用"我语句"表达，亲子冲突有所减少。`,
      homeworkStatus,
      riskChange,
      `下周继续注意力训练，时间增加到20分钟。\n家长需要配合完成家庭行为积分表，每日记录。\n建议安排一次家庭联合咨询，讨论亲子沟通模式。\n预约下次咨询：2026-05-${13 + i * 3} 下午3点。`
    );
    const hwLabel = homeworkStatus === 'completed' ? '✅已完成' : '⏳部分完成';
    const rcLabel = riskChange === 'improved' ? '📈改善' : riskChange === 'stable' ? '➡️稳定' : '➖无变化';
    console.log(`   ↳ 跟进 ${i + 1}: 作业${hwLabel}, 风险${rcLabel}`);
  }

  if (index % 2 === 0) {
    const score = [4, 5, 5, 4][index % 4];
    insertSatisfaction.run(
      familyId,
      null,
      score,
      '咨询师非常专业，能够理解孩子和家长的困扰。孩子有明显进步，每周都能看到变化。感谢老师的耐心指导！希望继续保持这种良好的咨询关系。'
    );
    console.log(`   ↳ 满意度: ${score}分 ⭐`);
  }

  if (index === 1 || index === 3) {
    insertRenewal.run(
      familyId,
      planId,
      '2026-07-10',
      [4800, 6800, 9600, 12800][index % 4],
      'completed'
    );
    console.log(`   ↳ 续费: ¥${[4800, 6800, 9600, 12800][index % 4]} 💰`);
  }

  console.log('');
});

const stats = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM family_profiles) as families,
    (SELECT COUNT(*) FROM assessments) as assessments,
    (SELECT COUNT(*) FROM consultation_plans) as plans,
    (SELECT COUNT(*) FROM follow_up_records) as followups,
    (SELECT COUNT(*) FROM assessments WHERE risk_level IN ('high', 'very_high')) as high_risk
`).get();

console.log('════════════════════════════════════════');
console.log('📊 演示数据统计');
console.log('════════════════════════════════════════');
console.log(`👨‍👩‍👧 家庭档案: ${stats.families} 个`);
console.log(`📋 初评报告: ${stats.assessments} 份`);
console.log(`📝 咨询方案: ${stats.plans} 个`);
console.log(`📅 跟进记录: ${stats.followups} 条`);
console.log(`⚠️  高风险个案: ${stats.high_risk} 个`);
console.log('════════════════════════════════════════');
console.log('\n✅ 演示数据插入完成！');
console.log('\n业务状态流转说明：');
console.log('  • 小明：初评已复核 ✅  方案已审核 ✅  进行中');
console.log('  • 小红：初评已复核 ✅  方案已驳回 ❌  进行中');
console.log('  • 小刚：初评待复核 ⏳  方案待审核 ⏳  进行中');
console.log('  • 小丽：初评已复核 ✅  方案已审核 ✅  已完成');
console.log('  • 小强：初评待复核 ⏳  方案已驳回 ❌  已完成');

db.close();
