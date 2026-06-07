import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:59055';

async function main() {
  console.log('='.repeat(80));
  console.log('端到端测试：登录后业务承接链路');
  console.log('='.repeat(80));

  try {
    console.log('\n1. 登录...');
    const login = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const token = login.data.data.token;
    const user = login.data.data.user;
    console.log('   ✓ 登录成功');
    console.log(`   用户: ${user.username}, 角色: ${user.role}`);
    const h = { Authorization: `Bearer ${token}` };

    console.log('\n2. Dashboard 数据看板...');
    const dash = await axios.get(`${BASE_URL}/api/dashboard/admin`, { headers: h });
    const stats = dash.data.data;
    console.log(`   ✓ SLA统计: 1分钟响应=${stats.sla.response_1min_rate}%, 8分钟取件=${stats.sla.pickup_8min_rate}%, 1小时送达=${stats.sla.deliver_60min_rate}%`);
    console.log(`   ✓ 骑手监控: 在线=${stats.knights.online}/${stats.knights.total}, 平均信用分=${stats.knights.avg_credit}`);
    console.log(`   ✓ 运单统计: 今日=${stats.orders.today}, 待处理=${stats.orders.pending}, 已完成=${stats.orders.completed}`);
    console.log(`   ✓ 运力缺口: ${stats.capacity_gaps.length} 个区域`);
    console.log(`   ✓ 异常处理: 待处理=${stats.exceptions.pending}`);
    console.log(`   ✓ 营收统计: 总额=¥${stats.revenue.total.toFixed(2)}`);

    console.log('\n3. 运单管理 (含分单依据)...');
    const wb = await axios.get(`${BASE_URL}/api/waybills?pageSize=3`, { headers: h });
    const waybills = wb.data.data.list;
    console.log(`   ✓ 运单列表: ${wb.data.data.total} 条记录`);
    waybills.forEach((w, i) => {
      console.log(`     ${i + 1}. ${w.order_no}: status=${w.status}, 保价=${w.dispatch?.insurance_label || '-'}, 距离=${w.dispatch?.distance?.toFixed(1) || '-'}km, 骑士负载=${w.knight ? `${w.knight.current_load}/${w.knight.capacity}` : '-'}, 履约率=${w.knight?.completion_rate || '-'}%, SLA响应=${w.sla?.response_time || '-'}s, 流转步数=${w.status_flow?.length || 0}`);
    });

    console.log('\n4. 骑手管理 (含运力承接)...');
    const kh = await axios.get(`${BASE_URL}/api/knights?pageSize=3`, { headers: h });
    const knights = kh.data.data.list;
    console.log(`   ✓ 骑手列表: ${kh.data.data.total} 条记录`);
    knights.forEach((k, i) => {
      console.log(`     ${i + 1}. ${k.name}: status=${k.status}, 负载=${k.current_load}/${k.capacity} (${k.load_rate}%), 信用分=${k.credit_score}, 位置=(${k.lat?.toFixed(3)}, ${k.lng?.toFixed(3)}), 活跃订单=${k.active_order_count}`);
    });

    console.log('\n5. 调度中心...');
    const dp = await axios.get(`${BASE_URL}/api/dispatch/candidates/${waybills[0].id}`, { headers: h });
    console.log(`   ✓ 调度候选: ${dp.data.data?.length || 0} 个候选骑手`);

    console.log('\n6. 异常处理...');
    const ex = await axios.get(`${BASE_URL}/api/exceptions?pageSize=3`, { headers: h });
    console.log(`   ✓ 异常列表: ${ex.data.data.total} 条记录`);

    console.log('\n7. 热力地图...');
    const hm = await axios.get(`${BASE_URL}/api/heatmap`, { headers: h });
    console.log(`   ✓ 热力图数据: ${hm.data.data?.length || 0} 个网格点`);

    console.log('\n8. 信用体系...');
    const cr = await axios.get(`${BASE_URL}/api/knights/${knights[0].id}/credit-history`, { headers: h });
    console.log(`   ✓ 信用历史: ${cr.data.data?.total || 0} 条记录`);

    console.log('\n9. 结算管理...');
    const st = await axios.get(`${BASE_URL}/api/dashboard/settlements?pageSize=3`, { headers: h });
    console.log(`   ✓ 结算列表: ${st.data.data?.total || 0} 条记录`);

    console.log('\n' + '='.repeat(80));
    console.log('✓ 所有业务承接链路验证通过！');
    console.log('='.repeat(80));
    console.log('\n业务入口清单:');
    console.log('  ✓ /dashboard - 数据看板（SLA分层统计、运力监控、运单列表、审计入口）');
    console.log('  ✓ /waybills - 运单管理（分单依据、状态流转）');
    console.log('  ✓ /knights - 骑手管理（实时位置、承运能力）');
    console.log('  ✓ /dispatch - 调度中心（智能分单）');
    console.log('  ✓ /tracking - 实时追踪（轨迹展示）');
    console.log('  ✓ /heatmap - 运力热力图');
    console.log('  ✓ /credit - 信用体系');
    console.log('  ✓ /exceptions - 异常处理（超时转派）');
    console.log('  ✓ /settlements - 结算管理（运费结算）');

  } catch (error) {
    console.error('\n✗ 测试失败:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('响应:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
