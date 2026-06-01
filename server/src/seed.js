const { initDb, getDb, logAction } = require('./db');

function seed() {
  const dbPath = process.env.DB_PATH || './data/warning.db';
  initDb(require('path').resolve(__dirname, '..', dbPath));
  const db = getDb();

  const count = db.prepare('SELECT COUNT(*) as c FROM stations').get().c;
  if (count > 0) {
    console.log('[seed] Data already exists, skipping.');
    return;
  }

  const tx = db.transaction(() => {
    const insertStation = db.prepare(
      'INSERT INTO stations (name, code, type, location, lat, lng, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const stations = [
      ['城区降雨站', 'RAIN-001', 'rainfall', '市中心', 30.6598, 104.0657, 'online'],
      ['东河雨量站', 'RAIN-002', 'rainfall', '东河区', 30.6700, 104.0800, 'online'],
      ['西山风速站', 'WIND-001', 'wind', '西山区', 30.6400, 104.0500, 'online'],
      ['北区温度站', 'TEMP-001', 'temperature', '北城区', 30.6800, 104.0600, 'online'],
      ['雷达站A', 'RADAR-001', 'radar', '南郊', 30.6000, 104.0700, 'online'],
      ['综合站点1', 'STA-001', 'station', '工业园区', 30.6600, 104.0680, 'online'],
      ['综合站点2', 'STA-002', 'station', '港区', 30.6500, 104.0900, 'online'],
    ];
    stations.forEach(s => insertStation.run(...s));

    const now = new Date();
    const insertMonitor = db.prepare(
      'INSERT INTO monitor_data (station_id, value, data_type, recorded_at, threshold_hit) VALUES (?, ?, ?, ?, ?)'
    );
    for (let i = 0; i < 48; i++) {
      const t = new Date(now.getTime() - (47 - i) * 30 * 60 * 1000);
      const ts = t.toISOString().slice(0, 19).replace('T', ' ');
      const rain1 = +(Math.random() * 50).toFixed(1);
      const rain2 = +(Math.random() * 30).toFixed(1);
      const wind3 = +(Math.random() * 25 + 5).toFixed(1);
      const temp4 = +(Math.random() * 15 + 20).toFixed(1);
      const radar5 = +(Math.random() * 60).toFixed(1);
      insertMonitor.run(1, rain1, 'rainfall', ts, rain1 >= 10 ? 1 : 0);
      insertMonitor.run(2, rain2, 'rainfall', ts, rain2 >= 10 ? 1 : 0);
      insertMonitor.run(3, wind3, 'wind', ts, wind3 >= 12 ? 1 : 0);
      insertMonitor.run(4, temp4, 'temperature', ts, temp4 >= 35 ? 1 : 0);
      insertMonitor.run(5, radar5, 'radar', ts, radar5 >= 45 ? 1 : 0);
      insertMonitor.run(6, +(Math.random() * 20 + 10).toFixed(1), 'station', ts, 0);
      insertMonitor.run(7, +(Math.random() * 15 + 5).toFixed(1), 'station', ts, 0);
    }

    const insertThreshold = db.prepare(
      'INSERT INTO thresholds (data_type, warning_level, threshold_value, comparison, description) VALUES (?, ?, ?, ?, ?)'
    );
    const thresholds = [
      ['rainfall', 'blue', 10, '>=', '12小时降雨10毫米以上'],
      ['rainfall', 'yellow', 25, '>=', '6小时降雨25毫米以上'],
      ['rainfall', 'orange', 50, '>=', '6小时降雨50毫米以上'],
      ['rainfall', 'red', 100, '>=', '6小时降雨100毫米以上'],
      ['wind', 'blue', 12, '>=', '平均风力6级以上'],
      ['wind', 'yellow', 17, '>=', '平均风力8级以上'],
      ['wind', 'orange', 24, '>=', '平均风力10级以上'],
      ['wind', 'red', 32, '>=', '平均风力12级以上'],
      ['temperature', 'yellow', 35, '>=', '24小时最高气温35度以上'],
      ['temperature', 'orange', 37, '>=', '24小时最高气温37度以上'],
      ['temperature', 'red', 40, '>=', '24小时最高气温40度以上'],
      ['radar', 'yellow', 45, '>=', '雷达回波强度45dBZ以上'],
    ];
    thresholds.forEach(t => insertThreshold.run(...t));

    const insertTemplate = db.prepare(
      'INSERT INTO warning_templates (name, type, level, content, suggested_measures) VALUES (?, ?, ?, ?, ?)'
    );
    const templates = [
      ['暴雨蓝色预警模板', '暴雨', 'blue',
        '预计未来12小时内，{area}降雨量将达10毫米以上，请注意防范。',
        '1.政府及相关部门做好防暴雨准备工作；2.学校、幼儿园采取适当措施，保证学生和幼儿安全；3.驾驶人员注意道路积水和交通阻塞。'],
      ['暴雨黄色预警模板', '暴雨', 'yellow',
        '预计未来6小时内，{area}降雨量将达25毫米以上，请注意防范。',
        '1.政府及相关部门做好防暴雨工作；2.交通管理部门根据路况在强降雨路段采取交通管制措施；3.切断低洼地带有危险的室外电源。'],
      ['暴雨橙色预警模板', '暴雨', 'orange',
        '预计未来3小时内，{area}降雨量将达50毫米以上，请注意防范。',
        '1.政府及相关部门做好防暴雨应急工作；2.切断有危险的室外电源，暂停户外作业；3.处于危险地带的单位应当停课、停业。'],
      ['暴雨红色预警模板', '暴雨', 'red',
        '预计未来3小时内，{area}降雨量将达100毫米以上，请注意防范。',
        '1.政府及相关部门做好防暴雨应急和抢险工作；2.停止集会、停课、停业；3.做好山洪、滑坡、泥石流等灾害的防御和抢险工作。'],
      ['大风蓝色预警模板', '大风', 'blue',
        '预计未来24小时内，{area}平均风力达6级以上，请注意防范。',
        '1.政府及相关部门做好防大风工作；2.关好门窗，加固易被风吹动的搭建物；3.相关水域水上作业和过往船舶采取积极的应对措施。'],
      ['大风黄色预警模板', '大风', 'yellow',
        '预计未来12小时内，{area}平均风力达8级以上，请注意防范。',
        '1.政府及相关部门做好防大风应急工作；2.停止露天活动和高空等户外危险作业；3.相关水域水上作业和过往船舶采取积极的应对措施。'],
      ['高温黄色预警模板', '高温', 'yellow',
        '预计未来24小时内，{area}最高气温将达35℃以上，请注意防范。',
        '1.有关部门和单位做好防暑降温准备工作；2.午后尽量减少户外活动；3.对老、弱、病、幼人群提供防暑降温指导。'],
    ];
    templates.forEach(t => insertTemplate.run(...t));

    const insertChannel = db.prepare(
      'INSERT INTO channels (name, channel_type, config, status) VALUES (?, ?, ?, ?)'
    );
    const channels = [
      ['短信网关', 'sms', JSON.stringify({ gateway: 'http://sms.example.com', apiKey: 'demo-key' }), 'active'],
      ['站内公告系统', 'announcement', JSON.stringify({ url: 'http://notice.example.com/api' }), 'active'],
      ['外部接口推送', 'api', JSON.stringify({ endpoints: ['http://api1.example.com/webhook', 'http://api2.example.com/webhook'] }), 'active'],
      ['基层通知平台', 'grassroots', JSON.stringify({ platform: 'grid-notify' }), 'active'],
    ];
    channels.forEach(c => insertChannel.run(...c));

    const insertTarget = db.prepare(
      'INSERT INTO targets (name, target_type, contact, parent_id) VALUES (?, ?, ?, ?)'
    );
    const targets = [
      ['东河镇政府', 'township', '13800000001', null],
      ['西山镇政府', 'township', '13800000002', null],
      ['北区街道办', 'township', '13800000003', null],
      ['应急管理局', 'department', '13900000001', null],
      ['气象局', 'department', '13900000002', null],
      ['消防大队', 'department', '13900000003', null],
      ['东区网格1', 'grid', '13700000001', null],
      ['东区网格2', 'grid', '13700000002', null],
      ['西区网格1', 'grid', '13700000003', null],
      ['公众服务号', 'public', 'https://mp.example.com', null],
    ];
    targets.forEach(t => insertTarget.run(...t));

    const insertWarning = db.prepare(
      'INSERT INTO warnings (type, level, affected_area, suggested_measures, valid_from, valid_to, issuer, content, status, template_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const nowStr = now.toISOString().slice(0, 19).replace('T', ' ');
    const future = new Date(now.getTime() + 6 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const past = new Date(now.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const future12 = new Date(now.getTime() + 12 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    insertWarning.run('暴雨', 'yellow', '全市范围', '1.做好防暴雨工作；2.交通管理部门采取管制措施；3.切断低洼地带危险电源', nowStr, future, '张值班员',
      '预计未来6小时内，全市降雨量将达25毫米以上，请注意防范。', 'published', 2);
    insertWarning.run('大风', 'blue', '西山区、北城区', '1.关好门窗，加固搭建物；2.水上作业船舶注意安全', past, future12, '李值班员',
      '预计未来24小时内，西山区、北城区平均风力达6级以上，请注意防范。', 'draft', 5);
    insertWarning.run('暴雨', 'orange', '东河区、工业园区', '1.做好防暴雨应急工作；2.切断危险室外电源；3.危险地带停课停业', past, nowStr, '王值班员',
      '预计未来3小时内，东河区降雨量将达50毫米以上，请注意防范。', 'cancelled', 3);

    const insertPublish = db.prepare(
      'INSERT INTO publish_records (warning_id, channel_id, batch_no, total_count, success_count, fail_count, status, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertFail = db.prepare(
      'INSERT INTO publish_failures (publish_record_id, target_id, error_message, retry_count, last_attempt_at) VALUES (?, ?, ?, ?, ?)'
    );
    const ts = nowStr.replace(/[-: ]/g, '').slice(0, 14);
    const batches = [
      { w: 1, ch: 1, total: 10, ok: 8, fail: 2, status: 'completed', offset: 0, failIds: [8, 9] },
      { w: 1, ch: 2, total: 8, ok: 8, fail: 0, status: 'completed', offset: 5, failIds: [] },
      { w: 1, ch: 3, total: 5, ok: 4, fail: 1, status: 'completed', offset: 10, failIds: [4] },
      { w: 1, ch: 4, total: 10, ok: 7, fail: 3, status: 'completed', offset: 15, failIds: [7, 8, 9] },
    ];
    const pubIds = [];
    batches.forEach((b, i) => {
      const t0 = new Date(now.getTime() + b.offset * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      const t1 = new Date(now.getTime() + (b.offset + 2) * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      const info = insertPublish.run(b.w, b.ch, `PUB-${ts}${String(i + 1).padStart(2, '0')}`, b.total, b.ok, b.fail, b.status, t0, t1);
      const pubId = Number(info.lastInsertRowid);
      pubIds.push(pubId);
      b.failIds.forEach(tid => {
        insertFail.run(pubId, tid, '网络超时或服务不可用', 1, t1);
      });
    });

    const insertReceipt = db.prepare(
      'INSERT INTO receipts (publish_record_id, target_id, confirm_status, confirm_time, forward_to, action_measures) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const receiptData = [];
    pubIds.forEach((pubId, idx) => {
      const base = idx * 3;
      const t = new Date(now.getTime() + base * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      const statuses = ['confirmed', 'confirmed', 'forwarded', 'acted', 'pending', 'no_response'];
      const actions = [null, null, idx === 0 ? '应急管理局' : '网格中心', '已落实相关处置措施', null, null];
      for (let i = 0; i < 6; i++) {
        if (i + idx + 1 <= 10) {
          receiptData.push([pubId, i + idx + 1, statuses[i], statuses[i] !== 'pending' && statuses[i] !== 'no_response' ? t : null, actions[i], statuses[i] === 'acted' ? '已落实' + (idx === 0 ? '防汛' : '应急') + '处置措施' : null]);
        }
      }
    });
    receiptData.forEach(r => insertReceipt.run(...r));

    logAction('seed', 'system', 0, 'system', { action: 'seed_data_inserted' });
    console.log('[seed] Seed data inserted successfully.');
  });

  tx();
}

if (require.main === module) {
  seed();
}

module.exports = { seed };