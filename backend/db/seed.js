function seedData(db) {
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM brands').get().cnt;
  if (count > 0) return;

  const insertBrand = db.prepare(
    `INSERT INTO brands (name, contact_name, contact_phone) VALUES (?, ?, ?)`
  );
  const insertCenter = db.prepare(
    `INSERT INTO service_centers (name, address, brand_id, manager_name, manager_phone) VALUES (?, ?, ?, ?, ?)`
  );
  const insertTech = db.prepare(
    `INSERT INTO technicians (name, phone, skills, service_area, brand_authorizations, status, service_center_id) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertOrder = db.prepare(
    `INSERT INTO orders (order_no, consumer_name, consumer_phone, product_model, purchase_channel, install_address, appointment_time, parts_requirements, warranty_status, status, brand_id, service_center_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertDispatch = db.prepare(
    `INSERT INTO dispatches (order_id, technician_id, service_center_id, dispatch_type, status, dispatch_time, accept_time, reject_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertOnSite = db.prepare(
    `INSERT INTO on_site_records (order_id, technician_id, latitude, longitude, unboxing_photos, install_steps, auxiliary_charges, user_signature, exception_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertTicket = db.prepare(
    `INSERT INTO service_tickets (order_id, type, description, status, handler_name, resolution, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertSettlement = db.prepare(
    `INSERT INTO settlements (order_id, brand_id, service_center_id, technician_id, service_fee, auxiliary_fee, total_fee, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    const brand1 = insertBrand.run('格力', '张明', '010-88881234');
    const brand2 = insertBrand.run('美的', '李华', '021-66665678');
    const brand3 = insertBrand.run('海尔', '王强', '0532-77779012');

    const center1 = insertCenter.run('格力北京朝阳服务中心', '北京市朝阳区建国路88号', brand1.lastInsertRowid, '赵建国', '13800001111');
    const center2 = insertCenter.run('格力北京海淀服务中心', '北京市海淀区中关村大街66号', brand1.lastInsertRowid, '钱卫东', '13800002222');
    const center3 = insertCenter.run('美的上海浦东服务中心', '上海市浦东新区陆家嘴环路100号', brand2.lastInsertRowid, '孙丽华', '13800003333');
    const center4 = insertCenter.run('海尔广州天河服务中心', '广州市天河区体育西路50号', brand3.lastInsertRowid, '周明远', '13800004444');

    const tech1 = insertTech.run('陈志强', '13900001111', JSON.stringify(['空调', '洗衣机']), '北京朝阳区', JSON.stringify([String(brand1.lastInsertRowid)]), 'available', center1.lastInsertRowid);
    const tech2 = insertTech.run('刘伟', '13900002222', JSON.stringify(['空调', '冰箱']), '北京海淀区', JSON.stringify([String(brand1.lastInsertRowid)]), 'available', center2.lastInsertRowid);
    const tech3 = insertTech.run('杨秀英', '13900003333', JSON.stringify(['空调', '热水器', '洗衣机']), '上海浦东新区', JSON.stringify([String(brand2.lastInsertRowid)]), 'busy', center3.lastInsertRowid);
    const tech4 = insertTech.run('黄大勇', '13900004444', JSON.stringify(['冰箱', '洗衣机']), '上海浦东新区', JSON.stringify([String(brand2.lastInsertRowid)]), 'available', center3.lastInsertRowid);
    const tech5 = insertTech.run('吴小芳', '13900005555', JSON.stringify(['空调', '冰箱', '热水器']), '广州天河区', JSON.stringify([String(brand3.lastInsertRowid)]), 'available', center4.lastInsertRowid);
    const tech6 = insertTech.run('郑国栋', '13900006666', JSON.stringify(['洗衣机', '热水器']), '广州天河区', JSON.stringify([String(brand3.lastInsertRowid)]), 'off_duty', center4.lastInsertRowid);

    const order1 = insertOrder.run('INS20260001', '王丽', '13600001111', '格力空调 KFR-35GW', '京东', '北京市朝阳区望京西园2区3号楼501', '2026-05-28 09:00:00', null, 'in_warranty', 'completed', brand1.lastInsertRowid, center1.lastInsertRowid);
    const order2 = insertOrder.run('INS20260002', '张伟', '13600002222', '格力空调 KFR-72LW', '天猫', '北京市海淀区万柳中路1号院2号楼301', '2026-05-29 10:00:00', '需要加长铜管3米', 'in_warranty', 'completed', brand1.lastInsertRowid, center2.lastInsertRowid);
    const order3 = insertOrder.run('INS20260003', '陈明', '13600003333', '美的洗衣机 MG100V70WD5', '苏宁', '上海市浦东新区张杨路1088号15栋602', '2026-05-30 14:00:00', null, 'in_warranty', 'completed', brand2.lastInsertRowid, center3.lastInsertRowid);
    const order4 = insertOrder.run('INS20260004', '李娟', '13600004444', '美的空调 KFR-26GW/N8MHA1', '京东', '上海市浦东新区金桥路999号8栋1201', '2026-05-31 09:30:00', null, 'in_warranty', 'installing', brand2.lastInsertRowid, center3.lastInsertRowid);
    const order5 = insertOrder.run('INS20260005', '赵刚', '13600005555', '海尔冰箱 BCD-470WDPG', '国美', '广州市天河区天河北路233号华景新城A栋801', '2026-06-01 10:00:00', null, 'in_warranty', 'dispatched', brand3.lastInsertRowid, center4.lastInsertRowid);
    const order6 = insertOrder.run('INS20260006', '周敏', '13600006666', '海尔热水器 EC6003-JT1', '天猫', '广州市天河区龙口西路100号天惠大厦1503', '2026-06-01 14:00:00', '需要安装混水阀', 'in_warranty', 'dispatched', brand3.lastInsertRowid, center4.lastInsertRowid);
    const order7 = insertOrder.run('INS20260007', '孙磊', '13600007777', '格力洗衣机 XQG100-B1401Ab1', '京东', '北京市朝阳区大望路SOHO现代城A座2201', '2026-06-02 09:00:00', null, 'out_of_warranty', 'pending', brand1.lastInsertRowid, center1.lastInsertRowid);
    const order8 = insertOrder.run('INS20260008', '吴芳', '13600008888', '美的冰箱 BCD-536WKPZM', '苏宁', '上海市浦东新区世纪大道1号东方明珠公寓3301', '2026-06-02 11:00:00', null, 'in_warranty', 'pending', brand2.lastInsertRowid, center3.lastInsertRowid);

    insertDispatch.run(order1.lastInsertRowid, tech1.lastInsertRowid, center1.lastInsertRowid, 'auto', 'completed', '2026-05-27 15:00:00', '2026-05-27 15:30:00', null);
    insertDispatch.run(order2.lastInsertRowid, tech2.lastInsertRowid, center2.lastInsertRowid, 'auto', 'completed', '2026-05-28 10:00:00', '2026-05-28 10:20:00', null);
    insertDispatch.run(order3.lastInsertRowid, tech3.lastInsertRowid, center3.lastInsertRowid, 'auto', 'completed', '2026-05-29 11:00:00', '2026-05-29 11:15:00', null);
    insertDispatch.run(order4.lastInsertRowid, tech4.lastInsertRowid, center3.lastInsertRowid, 'auto', 'accepted', '2026-05-30 16:00:00', '2026-05-30 16:30:00', null);
    insertDispatch.run(order5.lastInsertRowid, tech5.lastInsertRowid, center4.lastInsertRowid, 'auto', 'assigned', '2026-05-30 17:00:00', null, null);
    insertDispatch.run(order6.lastInsertRowid, tech5.lastInsertRowid, center4.lastInsertRowid, 'manual', 'assigned', '2026-05-30 17:30:00', null, null);

    insertOnSite.run(order1.lastInsertRowid, tech1.lastInsertRowid, 39.9087, 116.4605, JSON.stringify(['https://img.example.com/unbox1.jpg', 'https://img.example.com/unbox2.jpg']), JSON.stringify([{ step: 1, description: '确认安装位置', photo: 'https://img.example.com/step1.jpg' }, { step: 2, description: '固定室内机', photo: 'https://img.example.com/step2.jpg' }, { step: 3, description: '连接铜管', photo: 'https://img.example.com/step3.jpg' }, { step: 4, description: '安装室外机', photo: 'https://img.example.com/step4.jpg' }, { step: 5, description: '抽真空并调试', photo: 'https://img.example.com/step5.jpg' }]), JSON.stringify([]), 'https://img.example.com/sign_wangli.png', null, 'completed');
    insertOnSite.run(order2.lastInsertRowid, tech2.lastInsertRowid, 39.9590, 116.3158, JSON.stringify(['https://img.example.com/unbox3.jpg']), JSON.stringify([{ step: 1, description: '确认安装位置', photo: 'https://img.example.com/step6.jpg' }, { step: 2, description: '固定室内机', photo: 'https://img.example.com/step7.jpg' }, { step: 3, description: '加长铜管3米', photo: 'https://img.example.com/step8.jpg' }, { step: 4, description: '安装室外机', photo: 'https://img.example.com/step9.jpg' }, { step: 5, description: '抽真空并调试', photo: 'https://img.example.com/step10.jpg' }]), JSON.stringify([{ item: '铜管加长3米', quantity: 1, unit_price: 150 }, { item: '保温管', quantity: 3, unit_price: 20 }]), 'https://img.example.com/sign_zhangwei.png', null, 'completed');
    insertOnSite.run(order3.lastInsertRowid, tech3.lastInsertRowid, 31.2354, 121.5087, JSON.stringify(['https://img.example.com/unbox4.jpg']), JSON.stringify([{ step: 1, description: '拆除包装', photo: 'https://img.example.com/step11.jpg' }, { step: 2, description: '连接进水管', photo: 'https://img.example.com/step12.jpg' }, { step: 3, description: '连接排水管', photo: 'https://img.example.com/step13.jpg' }, { step: 4, description: '调平并通电测试', photo: 'https://img.example.com/step14.jpg' }]), JSON.stringify([]), 'https://img.example.com/sign_chenming.png', null, 'completed');
    insertOnSite.run(order4.lastInsertRowid, tech4.lastInsertRowid, 31.2404, 121.5587, JSON.stringify(['https://img.example.com/unbox5.jpg']), JSON.stringify([{ step: 1, description: '确认安装位置', photo: 'https://img.example.com/step15.jpg' }, { step: 2, description: '固定挂板', photo: 'https://img.example.com/step16.jpg' }]), JSON.stringify([]), null, null, 'in_progress');

    insertTicket.run(order2.lastInsertRowid, 'charge_dispute', '用户对加长铜管费用有疑问，认为150元/米价格过高', 'in_progress', '赵建国', null, '2026-05-29 16:00:00', '2026-05-29 16:00:00');
    insertTicket.run(order7.lastInsertRowid, 'reschedule', '用户希望将安装时间从6月2日调整到6月5日上午', 'open', null, null, '2026-05-30 09:00:00', '2026-05-30 09:00:00');

    insertSettlement.run(order1.lastInsertRowid, brand1.lastInsertRowid, center1.lastInsertRowid, tech1.lastInsertRowid, 200, 0, 200, 'paid', '2026-05-28 18:00:00', '2026-05-30 10:00:00');
    insertSettlement.run(order2.lastInsertRowid, brand1.lastInsertRowid, center2.lastInsertRowid, tech2.lastInsertRowid, 200, 210, 410, 'approved', '2026-05-29 18:00:00', '2026-05-31 10:00:00');
    insertSettlement.run(order3.lastInsertRowid, brand2.lastInsertRowid, center3.lastInsertRowid, tech3.lastInsertRowid, 180, 0, 180, 'pending', '2026-05-30 18:00:00', '2026-05-30 18:00:00');
  });

  transaction();
}

module.exports = { seedData };
