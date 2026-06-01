const db = require('../db')

console.log('开始插入测试数据...')

db.exec(`
  INSERT INTO earthquakes (magnitude, latitude, longitude, depth, location, occurred_at, intensity_estimate, affected_radius)
  VALUES 
    (7.8, 31.015, 103.365, 15.0, '四川省阿坝州汶川县', DATETIME('now', '-2 hours'), 'XI', 100.5),
    (6.5, 30.980, 103.420, 12.0, '四川省成都市彭州市', DATETIME('now', '-1 hour'), 'VIII', 60.0);

  INSERT INTO aftershocks (earthquake_id, magnitude, latitude, longitude, depth, occurred_at)
  VALUES 
    (1, 5.2, 31.020, 103.370, 10.0, DATETIME('now', '-1 hour')),
    (1, 4.8, 31.010, 103.355, 8.0, DATETIME('now', '-30 minutes'));

  INSERT INTO key_areas (earthquake_id, name, latitude, longitude, risk_level, population, description)
  VALUES 
    (1, '汶川县映秀镇', 31.035, 103.486, 'extreme', 12000, '重灾区，救援重点'),
    (1, '汶川县威州镇', 31.481, 103.588, 'high', 35000, '县城所在地'),
    (1, '茂县凤仪镇', 31.678, 103.856, 'high', 28000, '受灾严重'),
    (1, '彭州市龙门山镇', 31.198, 103.837, 'medium', 8000, '部分房屋受损');

  INSERT INTO rescue_teams (team_code, team_name, team_type, person_count, leader_name, leader_phone, base_location, status)
  VALUES 
    ('RT001', '国家救援队第一大队', 'national', 120, '张伟', '13800138001', '北京', 'assigned'),
    ('RT002', '四川省消防救援总队', 'provincial', 85, '李强', '13800138002', '成都', 'working'),
    ('RT003', '成都军区某部', 'military', 200, '王军', '13800138003', '成都', 'standby'),
    ('RT004', '蓝天救援队四川分队', 'civil', 45, '刘洋', '13800138004', '绵阳', 'standby');

  INSERT INTO vehicles (plate_no, vehicle_type, capacity, team_id, current_location, status)
  VALUES 
    ('京A12345', 'rescue_truck', 10, 1, '成都双流机场', 'available'),
    ('京A12346', 'ambulance', 3, 1, '成都双流机场', 'available'),
    ('川A88888', 'rescue_truck', 8, 2, '映秀镇灾区', 'in_use'),
    ('川A88889', 'crane', 1, 2, '映秀镇灾区', 'in_use'),
    ('军B00101', 'transport', 30, 3, '成都军区', 'available');

  INSERT INTO material_items (item_code, item_name, category, unit, total_stock, unit_price, specifications)
  VALUES 
    ('MAT001', '矿泉水', 'water', '箱', 5000, 28.00, '500ml*24瓶'),
    ('MAT002', '方便面', 'food', '箱', 3000, 45.00, '12桶'),
    ('MAT003', '急救包', 'medical', '个', 2000, 85.00, '标准配置'),
    ('MAT004', '帐篷', 'shelter', '顶', 1500, 680.00, '12平米'),
    ('MAT005', '棉被', 'shelter', '床', 8000, 120.00, '4斤'),
    ('MAT006', '手电筒', 'equipment', '个', 3000, 35.00, 'LED'),
    ('MAT007', '发电机', 'equipment', '台', 200, 3500.00, '5KW');

  INSERT INTO disaster_reports (report_no, report_type, location, deaths, injuries, missing, trapped, buildings_destroyed, buildings_damaged, communication_status, reporter_unit, reporter_name, description, status)
  VALUES 
    ('DR20260528001', 'comprehensive', '汶川县映秀镇', 50, 200, 30, 100, 500, 1200, 'down', '映秀镇政府', '李明', '全镇房屋大量倒塌，通信中断，急需救援', 'processing'),
    ('DR20260528002', 'building', '汶川县威州镇', 10, 50, 5, 20, 200, 500, 'partial', '威州镇政府', '王芳', '老旧房屋倒塌严重，部分人员被困', 'pending'),
    ('DR20260528003', 'casualty', '茂县凤仪镇', 5, 30, 2, 10, 50, 150, 'normal', '凤仪镇卫生院', '张华', '有人员伤亡需要救护车和医疗物资', 'pending');

  INSERT INTO missions (mission_no, mission_type, description, target_location, latitude, longitude, priority, team_id, assigned_resources, created_by, status, departure_time, arrival_time)
  VALUES 
    ('MS20260528001', 'search_rescue', '映秀镇中心小学搜救任务', '汶川县映秀镇中心小学', 31.035, 103.486, 'urgent', 1, '搜救犬5只，生命探测仪2台', '指挥中心', 'departed', DATETIME('now', '-30 minutes'), NULL),
    ('MS20260528002', 'medical', '映秀镇医疗救助', '汶川县映秀镇卫生院', 31.032, 103.488, 'urgent', 2, '救护车3辆，医护人员15人', '指挥中心', 'arrived', DATETIME('now', '-1 hour'), DATETIME('now', '-15 minutes')),
    ('MS20260528003', 'supply', '运送应急物资到威州镇', '汶川县威州镇政府', 31.481, 103.588, 'normal', NULL, '卡车5辆', '指挥中心', 'assigned', NULL, NULL);

  INSERT INTO mission_tracks (mission_id, old_status, new_status, old_team_id, new_team_id, change_reason, operator)
  VALUES 
    (2, 'assigned', 'departed', NULL, 2, '队伍集结完毕出发', '调度员A'),
    (2, 'departed', 'arrived', NULL, NULL, '到达灾区现场', '队长李强');

  INSERT INTO material_demands (demand_no, item_id, quantity, demand_location, requester_unit, urgency, description, status, allocated_quantity)
  VALUES 
    ('DEM20260528001', 1, 500, '汶川县映秀镇', '映秀镇抗震救灾指挥部', 'urgent', '受灾群众饮用水需求', 'partial', 200),
    ('DEM20260528002', 4, 300, '汶川县威州镇', '威州镇政府', 'urgent', '临时安置点需要帐篷', 'pending', 0),
    ('DEM20260528003', 3, 100, '茂县凤仪镇', '凤仪镇卫生院', 'normal', '医疗急救包补充', 'pending', 0);

  INSERT INTO material_allocations (allocation_no, demand_id, item_id, quantity, from_location, to_location, transporter, dispatch_time, estimated_arrival, actual_arrival, receiver, signoff_time, status)
  VALUES 
    ('ALC20260528001', 1, 1, 200, '成都中央仓库', '汶川县映秀镇', '省应急厅运输队', DATETIME('now', '-2 hour'), DATETIME('now', '+1 hour'), NULL, NULL, NULL, 'dispatched'),
    ('ALC20260528002', 1, 1, 300, '德阳仓库', '汶川县映秀镇', '市民兵运输队', NULL, NULL, NULL, NULL, NULL, 'pending');

  INSERT INTO operation_logs (module, action, record_id, operator, ip_address, details)
  VALUES 
    ('disaster', 'create', 1, '李明', '192.168.1.10', '映秀镇政府上报综合灾情'),
    ('disaster', 'update', 1, '指挥中心', '192.168.1.1', '灾情状态更新为处理中'),
    ('rescue', 'create_mission', 1, '调度员A', '192.168.1.1', '创建映秀镇搜救任务'),
    ('rescue', 'create_mission', 2, '调度员A', '192.168.1.1', '创建映秀镇医疗任务'),
    ('materials', 'create_demand', 1, '王主任', '192.168.1.20', '映秀镇申请饮用水500箱');
`)

console.log('测试数据插入完成！')

const stats = db.prepare(`
  SELECT 
    (SELECT COUNT(*) FROM earthquakes) as eq_count,
    (SELECT COUNT(*) FROM rescue_teams) as team_count,
    (SELECT COUNT(*) FROM vehicles) as vehicle_count,
    (SELECT COUNT(*) FROM material_items) as item_count,
    (SELECT COUNT(*) FROM disaster_reports) as report_count,
    (SELECT COUNT(*) FROM missions) as mission_count,
    (SELECT COUNT(*) FROM material_demands) as demand_count,
    (SELECT COUNT(*) FROM material_allocations) as allocation_count
`).get()

console.log('数据统计:', stats)
