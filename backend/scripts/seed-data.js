const { db, initDatabase } = require('../database');

function seedData() {
  initDatabase();

  const farmers = db.prepare('SELECT * FROM farmers').all();
  const users = db.prepare('SELECT * FROM users').all();
  const farmer1 = farmers[0];
  const insurer = users.find(u => u.role === 'insurer');
  const surveyor = users.find(u => u.role === 'surveyor');
  const regulator = users.find(u => u.role === 'regulator');
  const township = users.find(u => u.role === 'township');

  console.log('Seeding test data...');

  const insertPolicy = db.prepare(`
    INSERT INTO policies (
      policy_no, farmer_id, crop_type, crop_variety, plot_location, plot_latitude, plot_longitude,
      area, area_unit, insurance_amount, premium, start_date, end_date,
      deductible_clause, deductible_ratio, payment_status, status, insurer_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const policies = [
    {
      policy_no: 'POL202605010001', farmer_id: farmer1.id, crop_type: 'RICE', crop_variety: '超级稻',
      plot_location: '北京市大兴区大兴镇幸福村一组东地块', plot_latitude: 39.7, plot_longitude: 116.3,
      area: 50, area_unit: 'mu', insurance_amount: 40000, premium: 800,
      start_date: today.toISOString().split('T')[0], end_date: oneYearLater.toISOString().split('T')[0],
      deductible_clause: '损失比例低于10%不予赔付', deductible_ratio: 0.1,
      payment_status: 'paid', status: 'active', insurer_id: insurer.id,
      payment_time: oneMonthAgo.toISOString()
    },
    {
      policy_no: 'POL202605010002', farmer_id: farmer1.id, crop_type: 'CORN', crop_variety: '先玉335',
      plot_location: '北京市大兴区大兴镇幸福村一组西地块', plot_latitude: 39.71, plot_longitude: 116.31,
      area: 30, area_unit: 'mu', insurance_amount: 21000, premium: 420,
      start_date: today.toISOString().split('T')[0], end_date: oneYearLater.toISOString().split('T')[0],
      deductible_clause: '损失比例低于10%不予赔付', deductible_ratio: 0.1,
      payment_status: 'paid', status: 'active', insurer_id: insurer.id,
      payment_time: oneMonthAgo.toISOString()
    },
    {
      policy_no: 'POL202605010003', farmer_id: farmer1.id, crop_type: 'WHEAT', crop_variety: '济麦22',
      plot_location: '北京市大兴区大兴镇幸福村二组南地块', plot_latitude: 39.69, plot_longitude: 116.29,
      area: 20, area_unit: 'mu', insurance_amount: 12000, premium: 240,
      start_date: today.toISOString().split('T')[0], end_date: oneYearLater.toISOString().split('T')[0],
      deductible_clause: '损失比例低于10%不予赔付', deductible_ratio: 0.1,
      payment_status: 'unpaid', status: 'active', insurer_id: insurer.id
    },
    {
      policy_no: 'POL202605010004', farmer_id: farmer1.id, crop_type: 'VEGETABLE', crop_variety: '西红柿',
      plot_location: '北京市大兴区大兴镇幸福村大棚区', plot_latitude: 39.72, plot_longitude: 116.32,
      area: 10, area_unit: 'mu', insurance_amount: 20000, premium: 600,
      start_date: today.toISOString().split('T')[0], end_date: oneYearLater.toISOString().split('T')[0],
      deductible_clause: '损失比例低于10%不予赔付', deductible_ratio: 0.1,
      payment_status: 'paid', status: 'active', insurer_id: insurer.id,
      payment_time: oneMonthAgo.toISOString()
    }
  ];

  const policyIds = [];
  policies.forEach(p => {
    const info = insertPolicy.run(
      p.policy_no, p.farmer_id, p.crop_type, p.crop_variety, p.plot_location,
      p.plot_latitude, p.plot_longitude, p.area, p.area_unit, p.insurance_amount,
      p.premium, p.start_date, p.end_date, p.deductible_clause, p.deductible_ratio,
      p.payment_status, p.status, p.insurer_id
    );
    policyIds.push(info.lastInsertRowid);
    console.log(`  Created policy: ${p.policy_no}`);
  });

  db.prepare('UPDATE policies SET payment_time = ? WHERE policy_no = ?').run(oneMonthAgo.toISOString(), 'POL202605010001');
  db.prepare('UPDATE policies SET payment_time = ? WHERE policy_no = ?').run(oneMonthAgo.toISOString(), 'POL202605010002');
  db.prepare('UPDATE policies SET payment_time = ? WHERE policy_no = ?').run(oneMonthAgo.toISOString(), 'POL202605010004');

  const insertReport = db.prepare(`
    INSERT INTO reports (
      report_no, policy_id, farmer_id, disaster_type, disaster_time, photos, location,
      latitude, longitude, damaged_area, emergency_contact, emergency_phone,
      description, status, reported_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const oneDayAgo = new Date(today);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const reports = [
    {
      report_no: 'RPT202605260001', policy_id: policyIds[0], farmer_id: farmer1.id,
      disaster_type: 'FLOOD', disaster_time: twoDaysAgo.toISOString(),
      photos: JSON.stringify(['/uploads/flood1.jpg', '/uploads/flood2.jpg']),
      location: '北京市大兴区大兴镇幸福村一组东地块', latitude: 39.7, longitude: 116.3,
      damaged_area: 30, emergency_contact: '赵农户', emergency_phone: '13800000004',
      description: '连续暴雨导致稻田积水严重，约30亩水稻被淹',
      status: 'surveyed', reported_by: farmer1.user_id
    },
    {
      report_no: 'RPT202605270001', policy_id: policyIds[1], farmer_id: farmer1.id,
      disaster_type: 'HAIL', disaster_time: oneDayAgo.toISOString(),
      photos: JSON.stringify(['/uploads/hail1.jpg']),
      location: '北京市大兴区大兴镇幸福村一组西地块', latitude: 39.71, longitude: 116.31,
      damaged_area: 15, emergency_contact: '赵农户', emergency_phone: '13800000004',
      description: '突降冰雹，玉米叶片被打烂，部分倒伏',
      status: 'pending', reported_by: farmer1.user_id
    },
    {
      report_no: 'RPT202605280001', policy_id: policyIds[3], farmer_id: farmer1.id,
      disaster_type: 'PEST', disaster_time: today.toISOString(),
      photos: JSON.stringify(['/uploads/pest1.jpg']),
      location: '北京市大兴区大兴镇幸福村大棚区', latitude: 39.72, longitude: 116.32,
      damaged_area: 5, emergency_contact: '赵农户', emergency_phone: '13800000004',
      description: '西红柿大棚发现大面积虫害，叶片出现孔洞',
      status: 'pending', reported_by: farmer1.user_id
    }
  ];

  const reportIds = [];
  reports.forEach(r => {
    const info = insertReport.run(
      r.report_no, r.policy_id, r.farmer_id, r.disaster_type, r.disaster_time,
      r.photos, r.location, r.latitude, r.longitude, r.damaged_area,
      r.emergency_contact, r.emergency_phone, r.description, r.status, r.reported_by
    );
    reportIds.push(info.lastInsertRowid);
    console.log(`  Created report: ${r.report_no}`);
  });

  const insertSurvey = db.prepare(`
    INSERT INTO surveys (
      survey_no, report_id, policy_id, surveyor_id, survey_time,
      field_records, sampling_method, sampling_count, sample_loss_ratio,
      satellite_reference, weather_reference, loss_ratio, estimated_loss,
      survey_opinion, photos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const survey = {
    survey_no: 'SRV202605270001', report_id: reportIds[0], policy_id: policyIds[0],
    surveyor_id: surveyor.id, survey_time: oneDayAgo.toISOString(),
    field_records: '现场查勘：东地块积水深度约20cm，水稻植株大部分被淹，部分已倒伏。积水已开始退去，但根部浸泡时间较长。',
    sampling_method: '五点取样法', sampling_count: 5, sample_loss_ratio: 0.6,
    satellite_reference: '哨兵2号卫星影像显示该区域5月26日出现大面积水体覆盖',
    weather_reference: '气象站数据显示5月25-26日累计降雨量达180mm，超历史同期3倍',
    loss_ratio: 0.6, estimated_loss: 14400,
    survey_opinion: '经现场查勘，结合卫星影像和气象数据，认定本次洪涝灾害属实，损失比例约60%，建议赔付。',
    photos: JSON.stringify(['/uploads/survey1.jpg', '/uploads/survey2.jpg', '/uploads/survey3.jpg'])
  };

  const surveyInfo = insertSurvey.run(
    survey.survey_no, survey.report_id, survey.policy_id, survey.surveyor_id, survey.survey_time,
    survey.field_records, survey.sampling_method, survey.sampling_count, survey.sample_loss_ratio,
    survey.satellite_reference, survey.weather_reference, survey.loss_ratio, survey.estimated_loss,
    survey.survey_opinion, survey.photos
  );
  console.log(`  Created survey: ${survey.survey_no}`);

  const insertClaim = db.prepare(`
    INSERT INTO claims (
      claim_no, report_id, policy_id, policy_valid, deductible_applied,
      duplicate_report, materials_complete, missing_materials,
      compensation_amount, review_opinion, status, reviewer_id, review_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const claim = {
    claim_no: 'CLM202605270001', report_id: reportIds[0], policy_id: policyIds[0],
    policy_valid: 1, deductible_applied: 1440,
    duplicate_report: 0, materials_complete: 1, missing_materials: null,
    compensation_amount: 12960, review_opinion: '经审核，保单有效，报案真实，查勘数据完整，同意赔付。',
    status: 'approved', reviewer_id: insurer.id, review_time: today.toISOString()
  };

  const claimInfo = insertClaim.run(
    claim.claim_no, claim.report_id, claim.policy_id, claim.policy_valid, claim.deductible_applied,
    claim.duplicate_report, claim.materials_complete, claim.missing_materials,
    claim.compensation_amount, claim.review_opinion, claim.status, claim.reviewer_id, claim.review_time
  );
  console.log(`  Created claim: ${claim.claim_no}`);

  const insertApproval = db.prepare(`
    INSERT INTO claim_approvals (claim_id, approver_id, approver_role, approval_status, approval_opinion, approval_time, step)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const approvals = [
    { claim_id: claimInfo.lastInsertRowid, approver_id: insurer.id, approver_role: 'insurer',
      approval_status: 'approved', approval_opinion: '保险公司审核通过，材料齐全，损失认定准确',
      approval_time: today.toISOString(), step: 1 },
    { claim_id: claimInfo.lastInsertRowid, approver_id: township.id, approver_role: 'township',
      approval_status: 'approved', approval_opinion: '乡镇核实，情况属实，同意赔付',
      approval_time: today.toISOString(), step: 2 },
    { claim_id: claimInfo.lastInsertRowid, approver_id: regulator.id, approver_role: 'regulator',
      approval_status: 'approved', approval_opinion: '监管复核通过，符合理赔条件',
      approval_time: today.toISOString(), step: 3 }
  ];

  approvals.forEach(a => {
    insertApproval.run(
      a.claim_id, a.approver_id, a.approver_role, a.approval_status, a.approval_opinion, a.approval_time, a.step
    );
    console.log(`  Created approval: ${a.approver_role} - ${a.approval_status}`);
  });

  db.prepare(`UPDATE reports SET status = 'approved' WHERE id = ?`).run(reportIds[0]);

  console.log('\nTest data seeded successfully!');
  console.log('\n=== Test Cases Summary ===');
  console.log('\n1. 正常样例（已完成全流程）:');
  console.log(`   - 保单: ${policies[0].policy_no} (水稻50亩, 已支付)`);
  console.log(`   - 报案: ${reports[0].report_no} (洪涝灾害, 已查勘)`);
  console.log(`   - 查勘: ${survey.survey_no} (损失比例60%)`);
  console.log(`   - 理赔: ${claim.claim_no} (赔付金额12960元, 已通过三级审批)`);
  
  console.log('\n2. 边界样例（待查勘）:');
  console.log(`   - 保单: ${policies[1].policy_no} (玉米30亩, 已支付)`);
  console.log(`   - 报案: ${reports[1].report_no} (冰雹灾害, 待查勘)`);
  
  console.log('\n3. 冲突样例（保费未支付）:');
  console.log(`   - 保单: ${policies[2].policy_no} (小麦20亩, 未支付)`);
  console.log('   - 该保单无法报案，因为保费未支付');
  
  console.log('\n4. 失败样例（待处理）:');
  console.log(`   - 保单: ${policies[3].policy_no} (蔬菜10亩, 已支付)`);
  console.log(`   - 报案: ${reports[2].report_no} (病虫害, 待处理)`);
  console.log('   - 可测试拒赔场景：损失比例低于免赔额或材料不全');
  
  console.log('\n=== Test Accounts ===');
  console.log(' 监管方: admin / 系统管理员 (regulator)');
  console.log(' 保险公司: insurer1 / 张保险 (insurer)');
  console.log(' 查勘员: surveyor1 / 李查勘 (surveyor)');
  console.log(' 乡镇: township1 / 王乡镇 (township)');
  console.log(' 农户: farmer1 / 赵农户 (farmer)');

  db.close();
}

seedData();
