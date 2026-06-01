const axios = require('axios');

const BACKEND = 'http://127.0.0.1:54443/api';

async function testFlow() {
  console.log('=== 消防接处警系统 - 完整业务链路测试 ===\n');

  try {
    console.log('1. 创建接警记录...');
    const alarmRes = await axios.post(`${BACKEND}/alarms`, {
      caller_name: '张三',
      caller_phone: '13800138000',
      location: '市中心人民路100号城市中心广场',
      lng: 116.403874,
      lat: 39.916666,
      disaster_type: '火灾',
      disaster_level: '较大',
      people_trapped: 2,
      building_type: '高层建筑',
      hazardous_materials: '无',
      recording_index: 'REC20260528001',
      receiver: '接警员小李',
      notes: '广场南侧商铺起火，有人员被困'
    });
    console.log('   成功！警情ID:', alarmRes.data.id, '警情号:', alarmRes.data.alarm_no);
    const alarmId = alarmRes.data.id;

    console.log('\n2. 获取力量推荐...');
    const recRes = await axios.post(`${BACKEND}/alarms/${alarmId}/recommend`, {});
    console.log('   推荐理由:', recRes.data.recommend_reason);
    console.log('   推荐车辆:', recRes.data.vehicles.length, '辆');
    console.log('   推荐人员:', recRes.data.firefighters.length, '人');
    const vehicleIds = recRes.data.vehicles.map(v => v.id);
    const ffIds = recRes.data.firefighters.map(f => f.id);

    console.log('\n3. 创建派警...');
    const dpRes = await axios.post(`${BACKEND}/dispatches`, {
      alarm_id: alarmId,
      commander: '张建国',
      recommend_reason: '按系统推荐调派',
      adjust_reason: '',
      vehicle_ids: vehicleIds,
      firefighter_ids: ffIds
    });
    console.log('   成功！派警ID:', dpRes.data.id, '派警号:', dpRes.data.dispatch_no);
    const dpId = dpRes.data.id;

    console.log('\n4. 标记到场...');
    await axios.post(`${BACKEND}/dispatches/${dpId}/arrive`, { reporter: '张建国' });
    console.log('   成功！');

    console.log('\n5. 现场回传 - 火势报告...');
    await axios.post(`${BACKEND}/scene-updates`, {
      alarm_id: alarmId,
      dispatch_id: dpId,
      update_type: '火势报告',
      fire_intensity: '猛烈燃烧，约200平米过火面积',
      rescue_progress: '正在疏散楼内人员',
      reporter: '张建国'
    });
    console.log('   成功！');

    console.log('\n6. 现场回传 - 救援进展...');
    await axios.post(`${BACKEND}/scene-updates`, {
      alarm_id: alarmId,
      dispatch_id: dpId,
      update_type: '救援进展',
      rescue_progress: '已成功疏散15人，救出2名被困人员',
      reporter: '张建国'
    });
    console.log('   成功！');

    console.log('\n7. 处置结束...');
    await axios.post(`${BACKEND}/scene-updates`, {
      alarm_id: alarmId,
      dispatch_id: dpId,
      update_type: '处置结束',
      notes: '火势已完全扑灭，无人员伤亡，移交辖区派出所',
      reporter: '张建国'
    });
    console.log('   成功！');

    console.log('\n8. 查看警情详情（含时间线）...');
    const detailRes = await axios.get(`${BACKEND}/alarms/${alarmId}`);
    const d = detailRes.data;
    console.log('   警情号:', d.alarm_no);
    console.log('   状态:', d.status);
    console.log('   地点:', d.location);
    console.log('   派警数:', d.dispatches.length);
    console.log('   现场更新数:', d.updates.length);
    console.log('\n   时间线:');
    d.timeline.forEach(t => {
      console.log(`     ${t.event_time.slice(0, 19)} - ${t.event_type}: ${t.event_content.slice(0, 60)}`);
    });

    console.log('\n9. 查看报表统计...');
    const reportRes = await axios.get(`${BACKEND}/reports/summary`);
    const r = reportRes.data;
    console.log('   总警情数:', r.total_alarms);
    console.log('   活跃警情:', r.active_alarms);
    console.log('   已结束:', r.completed_alarms);
    console.log('   误报率:', r.false_alarm_rate);
    console.log('   平均响应时间:', r.avg_response_minutes, '分钟');

    console.log('\n=== 测试完成！所有业务链路正常 ===');
    console.log('\n前端访问地址: http://127.0.0.1:44443');
    console.log('后端API地址: http://127.0.0.1:54443/api');

  } catch (err) {
    console.error('测试失败:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

testFlow();
