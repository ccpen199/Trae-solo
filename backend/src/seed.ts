import { getDb } from './db';
import { nowTimestamp } from './utils';

const db = getDb();

function seed() {
  console.log('开始初始化种子数据...');

  const now = nowTimestamp();
  const tx = db.transaction(() => {
    const regions = [
      { name: '朝阳区', code: 'bj_cy', lat: 39.9219, lng: 116.4437, radius: 8 },
      { name: '海淀区', code: 'bj_hd', lat: 39.9599, lng: 116.2982, radius: 10 },
      { name: '西城区', code: 'bj_xc', lat: 39.9128, lng: 116.3634, radius: 5 },
    ];

    for (const region of regions) {
      db.prepare(
        `INSERT OR IGNORE INTO regions (name, code, center_lat, center_lng, radius, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`
      ).run(region.name, region.code, region.lat, region.lng, region.radius);
    }

    const riderData = [
      { name: '张伟', type: 'fulltime', status: 'online', credit: 95, battery: 85, willingness: 1.05, fulfillment: 0.96 },
      { name: '王强', type: 'fulltime', status: 'busy', credit: 88, battery: 72, willingness: 0.95, fulfillment: 0.93 },
      { name: '李明', type: 'fulltime', status: 'online', credit: 92, battery: 91, willingness: 1.10, fulfillment: 0.97 },
      { name: '刘洋', type: 'parttime', status: 'online', credit: 78, battery: 55, willingness: 0.75, fulfillment: 0.88 },
      { name: '陈磊', type: 'parttime', status: 'rest', credit: 82, battery: 40, willingness: 0.80, fulfillment: 0.90 },
      { name: '杨超', type: 'fulltime', status: 'busy', credit: 90, battery: 68, willingness: 1.02, fulfillment: 0.95 },
      { name: '赵刚', type: 'fulltime', status: 'online', credit: 65, battery: 33, willingness: 0.60, fulfillment: 0.72 },
      { name: '黄涛', type: 'parttime', status: 'online', credit: 85, battery: 78, willingness: 0.88, fulfillment: 0.91 },
      { name: '周勇', type: 'fulltime', status: 'offline', credit: 55, battery: 15, willingness: 0.45, fulfillment: 0.65 },
      { name: '吴斌', type: 'parttime', status: 'online', credit: 91, battery: 82, willingness: 1.08, fulfillment: 0.94 },
      { name: '徐辉', type: 'fulltime', status: 'busy', credit: 87, battery: 60, willingness: 0.92, fulfillment: 0.89 },
      { name: '孙鹏', type: 'parttime', status: 'online', credit: 76, battery: 50, willingness: 0.70, fulfillment: 0.82 },
      { name: '马超', type: 'parttime', status: 'online', credit: 75, battery: 58, willingness: 0.72, fulfillment: 0.80 },
      { name: '朱杰', type: 'fulltime', status: 'online', credit: 79, battery: 59, willingness: 0.78, fulfillment: 0.85 },
      { name: '郭浩', type: 'parttime', status: 'busy', credit: 95, battery: 71, willingness: 1.03, fulfillment: 0.98 },
    ];

    const centerLat = 39.9219;
    const centerLng = 116.4437;

    for (let i = 0; i < riderData.length; i++) {
      const r = riderData[i];
      const phone = `138${String(10000000 + i * 137).slice(0, 8)}`;
      const lat = centerLat + (Math.random() - 0.5) * 0.1;
      const lng = centerLng + (Math.random() - 0.5) * 0.15;

      db.prepare(
        `INSERT OR IGNORE INTO riders 
         (name, phone, type, status, credit_score, battery, vehicle_type,
          willingness_coefficient, fulfillment_rate, current_lat, current_lng, last_online_at,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'electric', ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        r.name, phone, r.type, r.status, r.credit, r.battery,
        r.willingness, r.fulfillment,
        r.status !== 'offline' ? lat : null,
        r.status !== 'offline' ? lng : null,
        r.status !== 'offline' ? now : now - 86400,
        now - Math.floor(Math.random() * 30) * 86400,
        now
      );
    }

    const merchants = [
      { name: '麦香居快餐店', address: '朝阳区建国路88号', lat: 39.9156, lng: 116.4567 },
      { name: '川味小馆', address: '朝阳区三里屯路19号', lat: 39.9321, lng: 116.4489 },
      { name: '鲜果时间', address: '朝阳区望京街10号', lat: 39.9987, lng: 116.4765 },
      { name: '必胜客(国贸店)', address: '朝阳区建国门外大街1号', lat: 39.9089, lng: 116.4623 },
      { name: '星巴克(悠唐店)', address: '朝阳区朝阳门外大街12号', lat: 39.9234, lng: 116.4321 },
    ];

    const goodsList = [
      { name: '宫保鸡丁套餐', type: 'normal', weight: 0.5, isSpecial: false, note: null },
      { name: '水果拼盘', type: 'perishable', weight: 1.2, isSpecial: false, note: null },
      { name: '奶茶两杯', type: 'normal', weight: 0.8, isSpecial: false, note: null },
      { name: '披萨9寸', type: 'normal', weight: 1.0, isSpecial: false, note: null },
      { name: '生日蛋糕', type: 'fragile', weight: 2.0, isSpecial: true, note: '易碎品·轻拿轻放·不可倒置' },
      { name: '海鲜大餐', type: 'cold', weight: 3.0, isSpecial: true, note: '冷链配送·需0-4°C·限时30分钟' },
      { name: '医用口罩500只', type: 'normal', weight: 2.5, isSpecial: true, note: '大件物品·体积0.08m³·需搬运' },
      { name: '鲜花束·红玫瑰', type: 'fragile', weight: 0.8, isSpecial: true, note: '易损花卉·不可挤压·避光避热' },
      { name: '三文鱼刺身', type: 'cold', weight: 0.6, isSpecial: true, note: '生鲜冷链·-2~2°C·极速达' },
      { name: '冰淇淋蛋糕', type: 'perishable', weight: 1.5, isSpecial: true, note: '冷冻品·-18°C·不可常温超过10分钟' },
    ];

    const platforms = ['self', 'self', 'self', 'meituan', 'eleme'];

    const orderStatuses = [
      'delivered', 'delivered', 'delivered', 'delivered', 'delivered',
      'delivered', 'delivered', 'delivered', 'delivered', 'delivered',
      'delivered', 'delivered', 'delivered', 'delivered', 'delivered',
      'delivered', 'delivered', 'delivered', 'delivered', 'delivered',
      'delivered', 'delivered', 'delivering', 'picking', 'assigned',
      'assigned', 'pending', 'pending', 'pending', 'cancelled',
    ];

    for (let i = 0; i < 30; i++) {
      const orderNo = `DD${now - i * 1800}${String(i).padStart(4, '0')}`;
      const merchant = merchants[i % merchants.length];
      const goods = goodsList[i % goodsList.length];
      const platform = platforms[i % platforms.length];

      const recipientLat = centerLat + (Math.random() - 0.5) * 0.12;
      const recipientLng = centerLng + (Math.random() - 0.5) * 0.18;

      const deliveryFee = 5 + Math.floor(Math.random() * 15);
      const tipAmount = Math.random() > 0.5 ? Math.floor(Math.random() * 8) + 1 : 0;
      const totalAmount = deliveryFee + tipAmount;

      const status = orderStatuses[i];

      const createdAt = now - i * 1800 - Math.floor(Math.random() * 600);
      const assignedAt = status !== 'pending' ? createdAt + 60 : null;
      const pickedAt = ['delivered', 'delivering'].includes(status) ? createdAt + 300 + Math.floor(Math.random() * 300) : null;
      const deliveredAt = status === 'delivered' ? createdAt + 1800 + Math.floor(Math.random() * 900) : null;
      const cancelledAt = status === 'cancelled' ? createdAt + 600 : null;

      const riderId = status !== 'pending' && status !== 'cancelled' ? (i % 10) + 1 : null;

      const distance = 2 + Math.random() * 6;

      const isSpecial = goods.isSpecial ? 1 : 0;
      const specialNote = goods.note;

      db.prepare(
        `INSERT OR IGNORE INTO orders 
         (order_no, platform, merchant_name, merchant_address, merchant_lat, merchant_lng,
          recipient_name, recipient_phone, recipient_address, recipient_lat, recipient_lng,
          goods_type, goods_name, weight, volume, is_special, special_note,
          pickup_time_start, pickup_time_end,
          delivery_time_start, delivery_time_end,
          delivery_fee, tip_amount, total_amount, status,
          assigned_rider_id, assigned_at, picked_at, delivered_at, cancelled_at,
          estimated_distance, estimated_duration, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        orderNo, platform,
        merchant.name, merchant.address, merchant.lat, merchant.lng,
        `客户${i + 1}`, `139${String(i).padStart(8, '0')}`,
        `朝阳区客户地址${i + 1}号`, recipientLat, recipientLng,
        goods.type, goods.name, goods.weight, goods.weight * 0.5,
        isSpecial, specialNote,
        createdAt + 600, createdAt + 1200,
        createdAt + 1800, createdAt + 3600,
        deliveryFee, tipAmount, totalAmount, status,
        riderId, assignedAt, pickedAt, deliveredAt, cancelledAt,
        distance, Math.ceil(distance * 12),
        createdAt, createdAt
      );

      if (riderId && status !== 'cancelled') {
        const assignScore = 0.5 + Math.random() * 0.5;
        const assignDistance = distance * (0.3 + Math.random() * 0.7);
        const assignStatus = status === 'pending' ? 'pending' :
                            status === 'assigned' ? 'accepted' :
                            status === 'picking' ? 'accepted' :
                            status === 'delivering' ? 'accepted' :
                            'accepted';

        db.prepare(
          `INSERT INTO order_assignments 
           (order_id, rider_id, status, score, distance, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          i + 1, riderId, assignStatus, assignScore, assignDistance, createdAt + 30
        );

        if (status === 'assigned' || status === 'picking' || status === 'delivering') {
          const altRiderId = ((riderId + 3) % 10) + 1;
          db.prepare(
            `INSERT INTO order_assignments 
             (order_id, rider_id, status, score, distance, created_at)
             VALUES (?, ?, 'timeout', ?, ?, ?)`
          ).run(
            i + 1, altRiderId, assignScore * 0.8, assignDistance * 1.2, createdAt + 30
          );
        }
      }

      if (status === 'delivered' && riderId) {
        const commission = deliveryFee * 0.2;
        const insurance = 0.5;
        const earning = deliveryFee - commission - insurance + tipAmount;

        const lastBalance = db.prepare(
          'SELECT balance FROM income_details WHERE rider_id = ? ORDER BY id DESC LIMIT 1'
        ).get(riderId) as { balance: number } | undefined;
        const balance = (lastBalance?.balance || 0) + earning;

        db.prepare(
          `INSERT INTO income_details 
           (rider_id, order_id, type, amount, balance, description, platform_commission, insurance_fee, created_at)
           VALUES (?, ?, 'delivery_fee', ?, ?, ?, ?, ?, ?)`
        ).run(
          riderId, i + 1, earning, balance,
          `订单配送费 - ${orderNo}`,
          commission, insurance,
          deliveredAt || createdAt + 2000
        );

        if (tipAmount > 0) {
          const lastBal2 = db.prepare(
            'SELECT balance FROM income_details WHERE rider_id = ? ORDER BY id DESC LIMIT 1'
          ).get(riderId) as { balance: number };

          db.prepare(
            `INSERT INTO income_details 
             (rider_id, order_id, type, amount, balance, description, created_at)
             VALUES (?, ?, 'tip', ?, ?, ?, ?)`
          ).run(
            riderId, i + 1, tipAmount, lastBal2.balance + tipAmount,
            `订单小费 - ${orderNo}`,
            deliveredAt || createdAt + 2000
          );
        }

        if (i % 5 === 0) {
          const lastBal3 = db.prepare(
            'SELECT balance FROM income_details WHERE rider_id = ? ORDER BY id DESC LIMIT 1'
          ).get(riderId) as { balance: number };

          db.prepare(
            `INSERT INTO income_details 
             (rider_id, order_id, type, amount, balance, description, platform_commission, insurance_fee, reward_type, created_at)
             VALUES (?, ?, 'reward', ?, ?, ?, 0, 0, ?, ?)`
          ).run(
            riderId, i + 1, 3, lastBal3.balance + 3,
            `高峰期配送奖励`,
            'peak_hour_bonus',
            deliveredAt || createdAt + 2000
          );
        }

        if (i % 8 === 0) {
          const lastBal4 = db.prepare(
            'SELECT balance FROM income_details WHERE rider_id = ? ORDER BY id DESC LIMIT 1'
          ).get(riderId) as { balance: number };

          db.prepare(
            `INSERT INTO income_details 
             (rider_id, order_id, type, amount, balance, description, platform_commission, insurance_fee, created_at)
             VALUES (?, ?, 'penalty', ?, ?, ?, 0, 0, ?)`
          ).run(
            riderId, i + 1, -5, lastBal4.balance - 5,
            `配送超时处罚`,
            deliveredAt || createdAt + 2000
          );
        }
      }

      if (status === 'delivered' && i % 7 === 0) {
        const complaintTypes: Array<{ type: string; reason: string; penalty: number }> = [
          { type: 'timeout', reason: '配送超时30分钟', penalty: 5 },
          { type: 'bad_review', reason: '服务态度不好', penalty: 3 },
          { type: 'service', reason: '餐品有撒漏', penalty: 8 },
        ];
        const cType = complaintTypes[i % 3];
        const cStatus = i < 14 ? 'resolved' : 'pending';

        db.prepare(
          `INSERT OR IGNORE INTO complaints 
           (order_id, rider_id, type, reason, status, complainant_type, has_video_evidence, video_url, 
            penalty_amount, result, handler_note, created_at, handled_at)
           VALUES (?, ?, ?, ?, ?, 'customer', 1, ?, ?, ?, ?, ?, ?)`
        ).run(
          i + 1, riderId, cType.type, cType.reason,
          cStatus,
          `/videos/quality/${orderNo}.mp4`,
          cStatus === 'resolved' ? cType.penalty : 0,
          cStatus === 'resolved' ? '成立' : null,
          cStatus === 'resolved' ? '经核实，情况属实，已扣减信用分并处罚金' : null,
          createdAt + 3600,
          cStatus === 'resolved' ? createdAt + 7200 : null
        );
      }

      if (i % 4 === 0 && status === 'delivered') {
        const complaintTypes2: Array<{ type: string; reason: string }> = [
          { type: 'lost', reason: '配送途中物品丢失' },
          { type: 'timeout', reason: '高峰期配送延迟45分钟' },
          { type: 'bad_review', reason: '骑士送达后态度恶劣' },
        ];
        const cType2 = complaintTypes2[i % 3];

        db.prepare(
          `INSERT OR IGNORE INTO complaints 
           (order_id, rider_id, type, reason, status, complainant_type, has_video_evidence, video_url, 
            penalty_amount, result, handler_note, created_at, handled_at)
           VALUES (?, ?, ?, ?, 'reviewing', 'system', 1, ?, 0, ?, ?, ?, ?)`
        ).run(
          i + 1, riderId, cType2.type, cType2.reason,
          `/videos/quality/${orderNo}_auto.mp4`,
          null,
          '系统自动触发·待人工复核',
          createdAt + 3600,
          null
        );
      }
    }

    const riderIds = [1, 2, 3, 5, 8];
    for (const riderId of riderIds) {
      const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(riderId) as any;
      if (!rider || !rider.current_lat || !rider.current_lng) continue;

      for (let i = 0; i < 20; i++) {
        const timestamp = now - (20 - i) * 900;
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.015;

        db.prepare(
          `INSERT INTO rider_locations 
           (rider_id, lat, lng, speed, heading, accuracy, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          riderId,
          rider.current_lat + latOffset * (i / 20),
          rider.current_lng + lngOffset * (i / 20),
          Math.random() * 30,
          Math.random() * 360,
          5 + Math.random() * 10,
          timestamp
        );
      }
    }

    for (let h = 0; h < 24; h++) {
      const baseOrders = 10 + Math.floor(
        Math.sin(((h - 6) / 24) * Math.PI * 2) * 20 + 25
      );

      db.prepare(
        `INSERT INTO region_order_stats 
         (region_id, date, hour, order_count, rider_count, avg_delivery_time, 
          weather, temperature, is_holiday, has_promotion, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
      ).run(
        1,
        new Date().toISOString().slice(0, 10),
        h,
        baseOrders,
        Math.floor(baseOrders / 4) + 3,
        25 + Math.random() * 15,
        'sunny',
        20 + Math.random() * 10,
        h >= 11 && h <= 13 ? 1 : 0,
        now - (24 - h) * 3600
      );
    }

    const allRiderIds = Array.from({ length: 15 }, (_, i) => i + 1);
    for (const riderId of allRiderIds) {
      const changeRecords = [
        { type: 'on_time_delivery', amount: 2, reason: '准时送达奖励' },
        { type: 'good_review', amount: 1, reason: '客户好评奖励' },
        { type: 'on_time_delivery', amount: 2, reason: '准时送达奖励' },
        { type: 'complaint', amount: -5, reason: '配送超时·客户投诉扣减' },
        { type: 'reward', amount: 3, reason: '高峰期配送奖励' },
      ];

      for (let j = 0; j < changeRecords.length; j++) {
        const change = changeRecords[j];
        const rider = db.prepare('SELECT credit_score FROM riders WHERE id = ?').get(riderId) as any;
        const beforeScore = rider?.credit_score || 80;
        const afterScore = Math.max(0, Math.min(100, beforeScore + change.amount));

        if (beforeScore === afterScore) continue;

        db.prepare(
          `INSERT INTO credit_score_records 
           (rider_id, change_type, change_amount, before_score, after_score, reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          riderId, change.type, change.amount, beforeScore, afterScore, change.reason,
          now - j * 86400 - riderId * 3600
        );

        db.prepare('UPDATE riders SET credit_score = ? WHERE id = ?').run(afterScore, riderId);
      }
    }

    const offlineRiders = [4, 7, 9];
    for (const riderId of offlineRiders) {
      const cachedOrders = [
        { orderId: riderId * 2, action: 'accept' },
        { orderId: riderId * 2 + 1, action: 'reject' },
      ];

      for (const cache of cachedOrders) {
        if (cache.orderId > 30) continue;

        const exists = db.prepare('SELECT id FROM orders WHERE id = ?').get(cache.orderId);
        if (!exists) continue;

        db.prepare(
          `INSERT INTO offline_orders_cache 
           (rider_id, order_id, action, data, synced, created_at)
           VALUES (?, ?, ?, ?, 0, ?)`
        ).run(
          riderId, cache.orderId, cache.action,
          JSON.stringify({ rider_id: riderId, timestamp: now - 300 }),
          now - 300
        );
      }
    }
  });

  tx();
  console.log('种子数据初始化完成！');

  const riderCount = (db.prepare('SELECT COUNT(*) as c FROM riders').get() as any).c;
  const orderCount = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c;
  const complaintCount = (db.prepare('SELECT COUNT(*) as c FROM complaints').get() as any).c;
  const incomeCount = (db.prepare('SELECT COUNT(*) as c FROM income_details').get() as any).c;
  const assignmentCount = (db.prepare('SELECT COUNT(*) as c FROM order_assignments').get() as any).c;
  const creditCount = (db.prepare('SELECT COUNT(*) as c FROM credit_score_records').get() as any).c;
  const offlineCount = (db.prepare('SELECT COUNT(*) as c FROM offline_orders_cache').get() as any).c;

  console.log(`骑士: ${riderCount}, 订单: ${orderCount}, 申诉: ${complaintCount}`);
  console.log(`收入明细: ${incomeCount}, 派单记录: ${assignmentCount}`);
  console.log(`信用分记录: ${creditCount}, 离线缓存: ${offlineCount}`);
}

seed();
