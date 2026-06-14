const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:59080/api' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, error: e.message, raw: data }); }
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('='.repeat(70));
  console.log('🏗️ 建筑业劳务供需智能撮合平台 - 完整功能验证');
  console.log('='.repeat(70));

  let allPassed = true;

  // 1. 数据看板 - 核心模块
  console.log('\n📊 1. 数据看板核心模块');
  console.log('-'.repeat(70));

  const region = await get('/analytics/region-heatmap');
  if (region.status === 200 && region.data?.data?.length > 0) {
    console.log('✅ 区域用工热力图:', region.data.data.length, '个区域数据');
    region.data.data.slice(0, 3).forEach(r => {
      console.log(`   • ${r.region}: 工人${r.worker_count}人, 招工${r.job_count}人, 供需比${r.demand_ratio}`);
    });
  } else {
    console.log('❌ 区域用工热力图失败');
    allPassed = false;
  }

  const shortage = await get('/analytics/trade-shortage');
  if (shortage.status === 200 && shortage.data?.data?.length > 0) {
    console.log('✅ 工种紧缺指数:', shortage.data.data.length, '个工种数据');
    shortage.data.data.slice(0, 5).forEach((t, i) => {
      const flag = t.shortage_index > 2 ? '🔴' : t.shortage_index > 1 ? '🟡' : '🟢';
      console.log(`   ${flag} ${i+1}. ${t.trade_name}: 紧缺指数${t.shortage_index.toFixed(2)}`);
    });
  } else {
    console.log('❌ 工种紧缺指数失败');
    allPassed = false;
  }

  const credit = await get('/analytics/team-credit');
  if (credit.status === 200 && credit.data?.data?.length > 0) {
    console.log('✅ 班组信用评级:', credit.data.data.length, '个班组数据');
    credit.data.data.slice(0, 3).forEach(t => {
      console.log(`   • [${t.rating}级] ${t.team_name}: 信用${t.credit_score}分`);
    });
  } else {
    console.log('❌ 班组信用评级失败');
    allPassed = false;
  }

  const risk = await get('/analytics/wage-arrears-risk');
  if (risk.status === 200 && risk.data?.data?.length > 0) {
    console.log('✅ 欠薪风险预警:', risk.data.data.length, '条风险记录');
    risk.data.data.forEach(r => {
      const level = r.risk_level === 'critical' ? '🔴严重' : r.risk_level === 'high' ? '🟠高' : r.risk_level === 'medium' ? '🟡中' : '🟢低';
      console.log(`   ${level}: ${r.company_name}, 逾期${r.overdue_count}次, ¥${r.total_overdue_amount.toLocaleString()}`);
      console.log(`      处置措施: ${r.measures}`);
    });
  } else {
    console.log('❌ 欠薪风险预警失败');
    allPassed = false;
  }

  const dashboard = await get('/analytics/dashboard-stats');
  if (dashboard.status === 200 && dashboard.data?.data) {
    const d = dashboard.data.data;
    console.log('✅ 看板统计数据完整');
    console.log(`   • 工人${d.total_workers}人, 雇主${d.total_employers}家, 招工${d.total_jobs}条`);
    console.log(`   • 合同${d.total_contracts}份, 支付${d.total_payments}笔, 匹配${d.total_matches}次`);
  } else {
    console.log('❌ 看板统计数据失败');
    allPassed = false;
  }

  // 2. 工人管理 - 核心字段
  console.log('\n👷 2. 工人管理 - 核心业务字段');
  console.log('-'.repeat(70));

  const workers = await get('/workers?pageSize=3');
  if (workers.status === 200 && workers.data?.data?.list?.length > 0) {
    console.log('✅ 工人列表:', workers.data.data.total, '个工人');
    workers.data.data.list.forEach(w => {
      const health = w.health_status === 'green' ? '🟢绿码' : w.health_status === 'yellow' ? '🟡黄码' : '🔴红码';
      console.log(`   • ${w.name}: ${health}, 证书${w.certificate_count}本, 培训${w.training_count}次, 评价${w.review_count}条`);
    });

    // 检查工人详情 - 健康码字段
    const workerId = workers.data.data.list[0].id;
    const workerDetail = await get(`/workers/${workerId}`);
    if (workerDetail.status === 200 && workerDetail.data?.data) {
      const wd = workerDetail.data.data;
      console.log('✅ 工人详情完整字段:');
      console.log(`   • 健康码来源: ${wd.health_code_source || 'N/A'}`);
      console.log(`   • 健康码更新时间: ${wd.health_code_updated_at || 'N/A'}`);
      console.log(`   • 核酸检测状态: ${wd.nucleic_acid_status || 'N/A'}`);
      console.log(`   • 疫苗接种情况: ${wd.vaccination_status || 'N/A'}`);

      // 检查证书、评价、培训、匹配记录
      const certs = await get(`/workers/${workerId}/certificates`);
      const reviews = await get(`/workers/${workerId}/reviews`);
      const trainings = await get(`/workers/${workerId}/trainings`);
      console.log(`   • 技能证书: ${certs.data?.data?.length || 0}条`);
      console.log(`   • 履约评价: ${reviews.data?.data?.length || 0}条`);
      console.log(`   • 安全培训: ${trainings.data?.data?.length || 0}条`);
    }
  } else {
    console.log('❌ 工人列表失败');
    allPassed = false;
  }

  // 3. 招工需求 - 三级审核流转
  console.log('\n📋 3. 招工需求 - 三级审核流转');
  console.log('-'.repeat(70));

  const jobs = await get('/jobs?pageSize=3');
  if (jobs.status === 200 && jobs.data?.data?.list?.length > 0) {
    console.log('✅ 招工列表:', jobs.data.data.total, '条招工');
    jobs.data.data.list.forEach(j => {
      const statusMap = {
        draft: '📝草稿', pending_review: '⏳待审核', ai_reviewed: '🤖AI审核',
        manual_reviewed: '👨‍💼人工复核', verified: '✅已核验', published: '📢已发布',
        filled: '👥已招满', closed: '🔒已关闭'
      };
      console.log(`   • ${j.project_name || j.project_name}: ${statusMap[j.status] || j.status}`);
      console.log(`     AI: ${j.ai_review_status || 'N/A'} by ${j.ai_reviewer || 'N/A'}`);
      console.log(`     人工: ${j.manual_review_status || 'N/A'} by ${j.manual_reviewer || 'N/A'}`);
      console.log(`     工地: ${j.site_review_status || 'N/A'} by ${j.site_reviewer || 'N/A'}`);
      if (j.manual_review_comment) console.log(`     驳回原因: ${j.manual_review_comment}`);
    });

    // 检查审核记录
    const jobId = jobs.data.data.list[0].id;
    const reviews = await get(`/jobs/${jobId}/reviews`);
    if (reviews.status === 200 && reviews.data?.data?.length > 0) {
      console.log('✅ 审核记录完整:', reviews.data.data.length, '条');
      reviews.data.data.forEach(r => {
        const level = r.review_level === 'ai' ? '🤖AI' : r.review_level === 'manual' ? '👨‍💼人工' : '🏗️工地';
        const result = r.result === 'pass' ? '✅通过' : r.result === 'fail' ? '❌驳回' : '⏳待审';
        console.log(`   ${level} ${result} | ${r.reviewer} | ${r.review_date}`);
        console.log(`     意见: ${r.comment}`);
      });
    }
  } else {
    console.log('❌ 招工列表失败');
    allPassed = false;
  }

  // 4. 合同管理和工资支付
  console.log('\n📄 4. 合同管理和工资支付');
  console.log('-'.repeat(70));

  const contracts = await get('/contracts?pageSize=3');
  if (contracts.status === 200 && contracts.data?.data?.list?.length > 0) {
    console.log('✅ 合同列表:', contracts.data.data.total, '份合同');
    contracts.data.data.list.forEach(c => {
      const statusMap = {
        draft: '📝草稿', signed_by_worker: '✍️工人已签', signed_by_employer: '✍️雇主已签',
        fully_signed: '✅已签署', completed: '🎉已完成', terminated: '❌已终止'
      };
      console.log(`   • ${c.contract_number}: ${c.employer_name} ↔ ${c.worker_name}`);
      console.log(`     工种: ${c.trade_name}, 日薪¥${c.daily_wage}, 总额¥${c.total_amount.toLocaleString()}`);
      console.log(`     状态: ${statusMap[c.status] || c.status}`);
    });
  } else {
    console.log('❌ 合同列表失败');
    allPassed = false;
  }

  const payments = await get('/wage-payments?pageSize=3');
  if (payments.status === 200 && payments.data?.data?.list?.length > 0) {
    console.log('✅ 工资支付:', payments.data.data.total, '条记录');
    payments.data.data.list.forEach(p => {
      const statusMap = {
        pending: '⏳待支付', paid: '✅已支付', overdue: '🔴已逾期', disputed: '🟡有争议'
      };
      const sup = p.supervisory_recorded === 1 ? '🏛️已监管' : '⚠️未监管';
      console.log(`   • ¥${p.amount.toLocaleString()} (${p.work_days}天): ${statusMap[p.status]} ${sup}`);
      if (p.remark) console.log(`     备注: ${p.remark}`);
    });
  } else {
    console.log('❌ 工资支付失败');
    allPassed = false;
  }

  // 5. 工种颗粒度管理
  console.log('\n🔨 5. 工种颗粒度管理');
  console.log('-'.repeat(70));

  const trades = await get('/trades?pageSize=5');
  if (trades.status === 200 && trades.data?.data?.list?.length > 0) {
    console.log('✅ 工种列表:', trades.data.data.total, '类工种');
    trades.data.data.list.forEach(t => {
      const stars = '⭐'.repeat(t.skill_level || 1);
      console.log(`   • ${t.name} (${t.category}): ${stars} 等级${t.skill_level}`);
      console.log(`     工人${t.worker_count || 0}人, 需求${t.job_count || 0}条, 平均日薪¥${t.avg_wage || 'N/A'}`);
    });

    // 检查工种详情
    const tradeId = trades.data.data.list[0].id;
    const tradeDetail = await get(`/trades/${tradeId}`);
    if (tradeDetail.status === 200 && tradeDetail.data?.data) {
      const td = tradeDetail.data.data;
      console.log('✅ 工种详情完整:');
      console.log(`   • 基本信息: ${td.name}, ${td.category}, 等级${td.skill_level}`);
      console.log(`   • 工人列表: ${td.workers?.length || 0}人`);
      console.log(`   • 需求列表: ${td.jobs?.length || 0}条`);
      console.log(`   • 薪资趋势: ${td.wage_trend?.length || 0}个月数据`);
    }
  } else {
    console.log('❌ 工种列表失败');
    allPassed = false;
  }

  // 6. 智能匹配
  console.log('\n🤝 6. 智能匹配');
  console.log('-'.repeat(70));

  const matches = await get('/matches?pageSize=5');
  if (matches.status === 200 && matches.data?.data?.list?.length > 0) {
    console.log('✅ 智能匹配:', matches.data.data.total, '条匹配');
    matches.data.data.list.slice(0, 3).forEach(m => {
      const statusMap = {
        pending: '⏳待确认', accepted: '👍已接受', rejected: '👎已拒绝', hired: '✅已录用'
      };
      console.log(`   • ${m.worker_name} ↔ ${m.project_name || '项目' + m.job_id}`);
      console.log(`     总分${m.match_score}分 (技能${m.skill_match_score} + 位置${m.location_match_score} + 履约${m.performance_match_score})`);
      console.log(`     状态: ${statusMap[m.status] || m.status}`);
    });
  } else {
    console.log('❌ 智能匹配失败');
    allPassed = false;
  }

  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('✅ 所有功能验证通过！');
  } else {
    console.log('⚠️  部分功能验证失败，请检查日志');
  }
  console.log('='.repeat(70));
  console.log('\n🌐 前端访问: http://127.0.0.1:49080/');
  console.log('🔌 后端API: http://127.0.0.1:59080/api');
})();
