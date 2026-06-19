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

    const riderNames = [
      '张伟', '王强', '李明', '刘洋', '陈磊',
      '杨超', '赵刚', '黄涛', '周勇', '吴斌',
      '徐辉', '孙鹏', '马超', '朱杰', '郭浩',
    ];

    const riderTypes = ['fulltime', 'fulltime', 'fulltime', 'parttime', 'parttime'];
    const statuses = ['online', 'online', 'busy', 'online', 'rest', 'offline'];

    const centerLat = 39.9219;
    const centerLng = 116.4437;

    for (let i = 0; i < 15; i++) {
      const name = riderNames[i];
      const phone = `138${String(10000000 + i * 137).slice(0, 8)}`;
      const type = riderTypes[i % riderTypes.length];
      const status = statuses[i % statuses.length];
      const lat = centerLat + (Math.random() - 0.5) * 0.1;
      const lng = centerLng + (Math.random() - 0.5) * 0.15;
      const battery = Math.floor(Math.random() * 60) + 40;
      const creditScore = Math.floor(Math.random() * 30) + 70;
      const willingness = 0.7 + Math.random() * 0.5;
      const fulfillment = 0.85 + Math.random() * 0.15;

      db.prepare(
        `INSERT OR IGNORE INTO riders 
         (name, phone, type, status, credit_score, battery, vehicle_type,
          willingness_coefficient, fulfillment_rate, current_lat, current_lng, last_online_at,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'electric', ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        name, phone, type, status, creditScore, battery,
        willingness, fulfillment,
        status !== 'offline' ? lat : null,
        status !== 'offline' ? lng : null,
        status !== 'offline' ? now : now - 86400,
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
      { name: '宫保鸡丁套餐', type: 'normal', weight: 0.5 },
      { name: '水果拼盘', type: 'perishable', weight: 1.2 },
      { name: '奶茶两杯', type: 'normal', weight: 0.8 },
      { name: '披萨9寸', type: 'normal', weight: 1.0 },
      { name: '生日蛋糕', type: 'fragile', weight: 2.0 },
      { name: '海鲜大餐', type: 'cold', weight: 3.0 },
    ];

    const platforms = ['self', 'self', 'self', 'meituan', 'eleme'];

    for (let i = 0; i < 30; i++) {
      const orderNo = `DD${now - i * 1800}${String(i).padStart(4, '0')}`;
      const merchant = merchants[i % merchants.length];
      const goods = goodsList[i % goodsList.length];
      const platform = platforms[i % platforms.length];

      const recipientLat = centerLat + (Math.random() - 0.5) * 0.12;
      const recipientLng = centerLng + (Math.random() - 0.5) * 0.18;

      const deliveryFee = 5 + Math.floor(Math.random() * 15);
      const tipAmount = Math.random() > 0.6 ? Math.floor(Math.random() * 5) + 1 : 0;
      const totalAmount = deliveryFee + tipAmount;

      const statuses = ['delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'pending', 'assigned'];
      const status = i < 24 ? 'delivered' : statuses[i % statuses.length];

      const createdAt = now - i * 1800 - Math.floor(Math.random() * 600);
      const assignedAt = status !== 'pending' ? createdAt + 60 : null;
      const pickedAt = status === 'delivered' || status === 'delivering' ? createdAt + 300 + Math.floor(Math.random() * 300) : null;
      const deliveredAt = status === 'delivered' ? createdAt + 1800 + Math.floor(Math.random() * 900) : null;

      const riderId = status !== 'pending' ? (i % 10) + 1 : null;

      const distance = 2 + Math.random() * 6;

      db.prepare(
        `INSERT OR IGNORE INTO orders 
         (order_no, platform, merchant_name, merchant_address, merchant_lat, merchant_lng,
          recipient_name, recipient_phone, recipient_address, recipient_lat, recipient_lng,
          goods_type, goods_name, weight, volume, is_special, pickup_time_start, pickup_time_end,
          delivery_time_start, delivery_time_end,
          delivery_fee, tip_amount, total_amount, status,
          assigned_rider_id, assigned_at, picked_at, delivered_at,
          estimated_distance, estimated_duration, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        orderNo, platform,
        merchant.name, merchant.address, merchant.lat, merchant.lng,
        `客户${i + 1}`, `139${String(i).padStart(8, '0')}`,
        `朝阳区客户地址${i + 1}号`, recipientLat, recipientLng,
        goods.type, goods.name, goods.weight, goods.weight * 0.5,
        createdAt + 600, createdAt + 1200,
        createdAt + 1800, createdAt + 3600,
        deliveryFee, tipAmount, totalAmount, status,
        riderId, assignedAt, pickedAt, deliveredAt,
        distance, Math.ceil(distance * 12),
        createdAt, createdAt
      );

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
      }

      if (status === 'delivered' && i % 7 === 0) {
        const types: any = ['timeout', 'bad_review', 'service'];
        const type = types[i % 3];
        db.prepare(
          `INSERT OR IGNORE INTO complaints 
           (order_id, rider_id, type, reason, status, complainant_type, has_video_evidence, video_url, penalty_amount, created_at)
           VALUES (?, ?, ?, ?, ?, 'customer', 1, ?, 0, ?)`
        ).run(
          i + 1, riderId, type,
          type === 'timeout' ? '配送超时30分钟' : type === 'bad_review' ? '服务态度不好' : '餐品有撒漏',
          i < 18 ? 'resolved' : 'pending',
          `/videos/quality/${orderNo}.mp4`,
          createdAt + 3600
        );
      }
    }

    const riderIds = [1, 2, 3, 5, 8];
    const baseTimes = [now - 7200, now - 3600, now];

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

    for (let i = 0; i < 10; i++) {
      const riderId = (i % 8) + 1;
      const changeTypes = ['on_time_delivery', 'good_review', 'complaint', 'reward'];
      const changeType = changeTypes[i % changeTypes.length];
      const changeAmount = changeType.includes('complaint') ? -(3 + i % 10) : 1 + (i % 3);

      const rider = db.prepare('SELECT credit_score FROM riders WHERE id = ?').get(riderId) as any;
      const beforeScore = rider?.credit_score || 100;
      const afterScore = Math.max(0, Math.min(100, beforeScore + changeAmount));

      db.prepare(
        `INSERT INTO credit_score_records 
         (rider_id, change_type, change_amount, before_score, after_score, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        riderId, changeType, changeAmount, beforeScore, afterScore,
        changeType === 'on_time_delivery' ? '准时送达奖励' :
        changeType === 'good_review' ? '好评奖励' :
        changeType === 'complaint' ? '申诉扣减' : '活动奖励',
        now - i * 86400
      );
    }
  });

  tx();
  console.log('种子数据初始化完成！');
  console.log('骑士数量: 15');
  console.log('订单数量: 30');
  console.log('申诉工单: 若干');
}

seed();
