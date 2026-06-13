import db from './db.js'
import { randomUUID } from 'crypto'

export function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) {
    console.log('Database already seeded, skipping...')
    return
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, name, role) VALUES (?, ?, ?, ?)
  `)

  const users = [
    { id: 'u1', phone: '13800138001', name: '张伟', role: 'user' },
    { id: 'u2', phone: '13800138002', name: '王芳', role: 'user' },
    { id: 'u3', phone: '13800138003', name: '李娜', role: 'user' },
    { id: 'u4', phone: '13800138004', name: '刘洋', role: 'user' },
    { id: 'u5', phone: '13800138005', name: '陈静', role: 'user' },
    { id: 'u6', phone: '13800138006', name: '杨帆', role: 'user' },
    { id: 'u7', phone: '13800138007', name: '黄磊', role: 'user' },
    { id: 'u8', phone: '13800138008', name: '周敏', role: 'user' },
    { id: 'u9', phone: '13800138009', name: '吴强', role: 'user' },
    { id: 'u10', phone: '13800138010', name: '赵雪', role: 'user' },
    { id: 'u11', phone: '13800138011', name: '孙磊', role: 'user' },
    { id: 'u12', phone: '13800138012', name: '马丽', role: 'user' },
    { id: 'u13', phone: '13800138013', name: '朱杰', role: 'user' },
    { id: 'u14', phone: '13800138014', name: '胡婷', role: 'user' },
    { id: 'u15', phone: '13800138015', name: '郭鹏', role: 'user' },
    { id: 'u16', phone: '13800138016', name: '何晶', role: 'user' },
    { id: 'u17', phone: '13800138017', name: '罗勇', role: 'user' },
    { id: 'u18', phone: '13800138018', name: '梁霞', role: 'user' },
    { id: 'u19', phone: '13800138019', name: '宋涛', role: 'user' },
    { id: 'u20', phone: '13800138020', name: '林燕', role: 'user' },
    { id: 'u21', phone: '13900139001', name: '李运营', role: 'operator' },
    { id: 'u22', phone: '13900139002', name: '王管理', role: 'admin' },
  ]
  for (const u of users) {
    insertUser.run(u.id, u.phone, u.name, u.role)
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, user_id, waybill_no, status, service_type, weight, volume, fee, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, package_category, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const orders = [
    { id: 'ord1', user_id: 'u1', waybill_no: 'YT20260601001', status: 'delivered', service_type: 'standard', weight: 2.5, volume: 0.02, fee: 18.0, sender_name: '张伟', sender_phone: '13800138001', sender_address: '上海市浦东新区陆家嘴环路1000号', receiver_name: '王芳', receiver_phone: '13800138002', receiver_address: '北京市朝阳区建国门外大街1号', package_category: '电子产品', remark: '易碎品请轻放' },
    { id: 'ord2', user_id: 'u1', waybill_no: 'YT20260602002', status: 'in_transit', service_type: 'express', weight: 0.8, volume: 0.005, fee: 25.0, sender_name: '张伟', sender_phone: '13800138001', sender_address: '上海市徐汇区漕溪北路398号', receiver_name: '李娜', receiver_phone: '13800138003', receiver_address: '广州市天河区天河路385号', package_category: '文件', remark: '' },
    { id: 'ord3', user_id: 'u2', waybill_no: 'YT20260603003', status: 'exception', service_type: 'economy', weight: 5.0, volume: 0.08, fee: 15.0, sender_name: '王芳', sender_phone: '13800138002', sender_address: '北京市海淀区中关村大街1号', receiver_name: '刘洋', receiver_phone: '13800138004', receiver_address: '成都市武侯区人民南路四段1号', package_category: '日用品', remark: '大件物品' },
    { id: 'ord4', user_id: 'u3', waybill_no: 'YT20260604004', status: 'picked_up', service_type: 'standard', weight: 1.2, volume: 0.01, fee: 18.0, sender_name: '李娜', sender_phone: '13800138003', sender_address: '广州市越秀区北京路100号', receiver_name: '陈静', receiver_phone: '13800138005', receiver_address: '杭州市西湖区文三路478号', package_category: '食品', remark: '冷藏品' },
    { id: 'ord5', user_id: 'u4', waybill_no: 'YT20260605005', status: 'in_transit', service_type: 'express', weight: 3.0, volume: 0.04, fee: 32.0, sender_name: '刘洋', sender_phone: '13800138004', sender_address: '成都市锦江区春熙路88号', receiver_name: '杨帆', receiver_phone: '13800138006', receiver_address: '深圳市南山区科技南路18号', package_category: '服装', remark: '' },
    { id: 'ord6', user_id: 'u5', waybill_no: 'YT20260606006', status: 'delivered', service_type: 'economy', weight: 1.5, volume: 0.015, fee: 12.0, sender_name: '陈静', sender_phone: '13800138005', sender_address: '杭州市上城区延安路200号', receiver_name: '黄磊', receiver_phone: '13800138007', receiver_address: '南京市鼓楼区中山路100号', package_category: '书籍', remark: '' },
    { id: 'ord7', user_id: 'u6', waybill_no: 'YT20260607007', status: 'out_for_delivery', service_type: 'standard', weight: 2.0, volume: 0.025, fee: 20.0, sender_name: '杨帆', sender_phone: '13800138006', sender_address: '深圳市福田区深南大道6011号', receiver_name: '周敏', receiver_phone: '13800138008', receiver_address: '武汉市江汉区解放大道1000号', package_category: '化妆品', remark: '小心轻放' },
    { id: 'ord8', user_id: 'u7', waybill_no: 'YT20260608008', status: 'pending', service_type: 'standard', weight: 0.5, volume: 0.003, fee: 15.0, sender_name: '黄磊', sender_phone: '13800138007', sender_address: '南京市玄武区珠江路300号', receiver_name: '吴强', receiver_phone: '13800138009', receiver_address: '西安市碑林区长安北路1号', package_category: '文件', remark: '急件' },
    { id: 'ord9', user_id: 'u8', waybill_no: 'YT20260609009', status: 'in_transit', service_type: 'express', weight: 4.0, volume: 0.06, fee: 38.0, sender_name: '周敏', sender_phone: '13800138008', sender_address: '武汉市武昌区东湖路100号', receiver_name: '赵雪', receiver_phone: '13800138010', receiver_address: '重庆市渝中区解放碑步行街88号', package_category: '家电', remark: '' },
    { id: 'ord10', user_id: 'u9', waybill_no: 'YT20260610010', status: 'delivered', service_type: 'economy', weight: 3.5, volume: 0.05, fee: 18.0, sender_name: '吴强', sender_phone: '13800138009', sender_address: '西安市雁塔区高新路50号', receiver_name: '孙磊', receiver_phone: '13800138011', receiver_address: '苏州市工业园区星海街100号', package_category: '日用品', remark: '' },
    { id: 'ord11', user_id: 'u10', waybill_no: 'YT20260611011', status: 'exception', service_type: 'standard', weight: 1.8, volume: 0.02, fee: 22.0, sender_name: '赵雪', sender_phone: '13800138010', sender_address: '重庆市江北区观音桥步行街50号', receiver_name: '马丽', receiver_phone: '13800138012', receiver_address: '天津市和平区南京路100号', package_category: '服装', remark: '' },
    { id: 'ord12', user_id: 'u11', waybill_no: 'YT20260612012', status: 'in_transit', service_type: 'standard', weight: 2.2, volume: 0.03, fee: 24.0, sender_name: '孙磊', sender_phone: '13800138011', sender_address: '苏州市姑苏区观前街100号', receiver_name: '朱杰', receiver_phone: '13800138013', receiver_address: '青岛市市南区香港中路88号', package_category: '食品', remark: '' },
    { id: 'ord13', user_id: 'u12', waybill_no: 'YT20260613013', status: 'picked_up', service_type: 'express', weight: 0.6, volume: 0.004, fee: 28.0, sender_name: '马丽', sender_phone: '13800138012', sender_address: '天津市河西区友谊路30号', receiver_name: '胡婷', receiver_phone: '13800138014', receiver_address: '长沙市天心区芙蓉南路100号', package_category: '文件', remark: '合同文件' },
    { id: 'ord14', user_id: 'u13', waybill_no: 'YT20260614014', status: 'delivered', service_type: 'economy', weight: 6.0, volume: 0.1, fee: 25.0, sender_name: '朱杰', sender_phone: '13800138013', sender_address: '青岛市崂山区海尔路50号', receiver_name: '郭鹏', receiver_phone: '13800138015', receiver_address: '沈阳市和平区青年大街100号', package_category: '家居', remark: '大件' },
    { id: 'ord15', user_id: 'u14', waybill_no: 'YT20260615015', status: 'out_for_delivery', service_type: 'standard', weight: 1.0, volume: 0.008, fee: 16.0, sender_name: '胡婷', sender_phone: '13800138014', sender_address: '长沙市岳麓区麓山南路100号', receiver_name: '何晶', receiver_phone: '13800138016', receiver_address: '济南市历下区泉城路100号', package_category: '化妆品', remark: '' },
    { id: 'ord16', user_id: 'u15', waybill_no: 'YT20260616016', status: 'in_transit', service_type: 'standard', weight: 2.8, volume: 0.035, fee: 26.0, sender_name: '郭鹏', sender_phone: '13800138015', sender_address: '沈阳市沈河区中街路100号', receiver_name: '罗勇', receiver_phone: '13800138017', receiver_address: '郑州市金水区花园路100号', package_category: '电子产品', remark: '' },
    { id: 'ord17', user_id: 'u16', waybill_no: 'YT20260617017', status: 'pending', service_type: 'economy', weight: 4.5, volume: 0.07, fee: 22.0, sender_name: '何晶', sender_phone: '13800138016', sender_address: '济南市天桥区无影山路50号', receiver_name: '梁霞', receiver_phone: '13800138018', receiver_address: '西安市未央区未央路100号', package_category: '日用品', remark: '' },
    { id: 'ord18', user_id: 'u17', waybill_no: 'YT20260618018', status: 'delivered', service_type: 'express', weight: 1.5, volume: 0.015, fee: 30.0, sender_name: '罗勇', sender_phone: '13800138017', sender_address: '郑州市二七区大学路100号', receiver_name: '宋涛', receiver_phone: '13800138019', receiver_address: '昆明市五华区青年路100号', package_category: '文件', remark: '加急' },
    { id: 'ord19', user_id: 'u18', waybill_no: 'YT20260619019', status: 'in_transit', service_type: 'standard', weight: 3.2, volume: 0.045, fee: 28.0, sender_name: '梁霞', sender_phone: '13800138018', sender_address: '西安市新城区解放路100号', receiver_name: '林燕', receiver_phone: '13800138020', receiver_address: '厦门市思明区中山路100号', package_category: '服装', remark: '' },
    { id: 'ord20', user_id: 'u19', waybill_no: 'YT20260620020', status: 'exception', service_type: 'economy', weight: 2.0, volume: 0.025, fee: 14.0, sender_name: '宋涛', sender_phone: '13800138019', sender_address: '昆明市盘龙区北京路100号', receiver_name: '张伟', receiver_phone: '13800138001', receiver_address: '上海市浦东新区张江高科技园区', package_category: '书籍', remark: '' },
    { id: 'ord21', user_id: 'u20', waybill_no: 'YT20260621021', status: 'out_for_delivery', service_type: 'standard', weight: 0.9, volume: 0.006, fee: 17.0, sender_name: '林燕', sender_phone: '13800138020', sender_address: '厦门市湖里区嘉禾路100号', receiver_name: '王芳', receiver_phone: '13800138002', receiver_address: '北京市海淀区学院路100号', package_category: '食品', remark: '' },
    { id: 'ord22', user_id: 'u1', waybill_no: 'YT20260622022', status: 'in_transit', service_type: 'express', weight: 5.5, volume: 0.09, fee: 45.0, sender_name: '张伟', sender_phone: '13800138001', sender_address: '上海市静安区南京西路1266号', receiver_name: '李娜', receiver_phone: '13800138003', receiver_address: '广州市海珠区新港东路100号', package_category: '家电', remark: '小心轻放' },
  ]
  for (const o of orders) {
    insertOrder.run(o.id, o.user_id, o.waybill_no, o.status, o.service_type, o.weight, o.volume, o.fee, o.sender_name, o.sender_phone, o.sender_address, o.receiver_name, o.receiver_phone, o.receiver_address, o.package_category, o.remark)
  }

  const insertTracking = db.prepare(`
    INSERT INTO tracking (id, order_id, waybill_no, status, nodes, current_position, estimated_delivery, exception_type, exception_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const generateNodes = (waybillNo: string, status: string, startCity: string, endCity: string) => {
    const nodes: any[] = []
    const baseTime = '2026-06-' + String(Math.floor(Math.random() * 10) + 3).padStart(2, '0')
    nodes.push({ time: baseTime + ' 09:00', location: startCity + '揽收点', status: 'picked_up', description: '快件已揽收' })
    
    if (status !== 'picked_up') {
      nodes.push({ time: baseTime + ' 14:30', location: startCity + '集散中心', status: 'in_transit', description: '快件已发出，下一站' + endCity })
    }
    if (status === 'in_transit' || status === 'out_for_delivery' || status === 'delivered' || status === 'exception') {
      nodes.push({ time: baseTime + ' 22:00', location: endCity + '中转中心', status: 'in_transit', description: '快件已到达' + endCity + '中转中心' })
    }
    if (status === 'out_for_delivery' || status === 'delivered') {
      nodes.push({ time: baseTime + ' 08:00', location: endCity + '派送站', status: 'out_for_delivery', description: '快递员正在派送中' })
    }
    if (status === 'delivered') {
      nodes.push({ time: baseTime + ' 14:00', location: endCity + '派送站', status: 'delivered', description: '快件已签收' })
    }
    if (status === 'exception') {
      nodes.push({ time: baseTime + ' 12:00', location: endCity + '分拣中心', status: 'exception', description: '快件异常：地址不详' })
    }
    return JSON.stringify(nodes)
  }

  const cities = ['上海', '北京', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆']
  const positions: Record<string, { lat: number; lng: number }> = {
    '上海': { lat: 31.2304, lng: 121.4737 },
    '北京': { lat: 39.9042, lng: 116.4074 },
    '广州': { lat: 23.1291, lng: 113.2644 },
    '深圳': { lat: 22.5431, lng: 114.0579 },
    '杭州': { lat: 30.2741, lng: 120.1551 },
    '成都': { lat: 30.5728, lng: 104.0668 },
    '武汉': { lat: 30.5928, lng: 114.3055 },
    '南京': { lat: 32.0603, lng: 118.7969 },
    '西安': { lat: 34.3416, lng: 108.9398 },
    '重庆': { lat: 29.5630, lng: 106.5516 },
  }

  const trackings = [
    { id: 'trk1', order_id: 'ord1', waybill_no: 'YT20260601001', status: 'delivered', startCity: '上海', endCity: '北京' },
    { id: 'trk2', order_id: 'ord2', waybill_no: 'YT20260602002', status: 'in_transit', startCity: '上海', endCity: '广州' },
    { id: 'trk3', order_id: 'ord3', waybill_no: 'YT20260603003', status: 'exception', startCity: '北京', endCity: '成都' },
    { id: 'trk4', order_id: 'ord4', waybill_no: 'YT20260604004', status: 'picked_up', startCity: '广州', endCity: '杭州' },
    { id: 'trk5', order_id: 'ord5', waybill_no: 'YT20260605005', status: 'in_transit', startCity: '成都', endCity: '深圳' },
    { id: 'trk6', order_id: 'ord6', waybill_no: 'YT20260606006', status: 'delivered', startCity: '杭州', endCity: '南京' },
    { id: 'trk7', order_id: 'ord7', waybill_no: 'YT20260607007', status: 'out_for_delivery', startCity: '深圳', endCity: '武汉' },
    { id: 'trk8', order_id: 'ord8', waybill_no: 'YT20260608008', status: 'pending', startCity: '南京', endCity: '西安' },
    { id: 'trk9', order_id: 'ord9', waybill_no: 'YT20260609009', status: 'in_transit', startCity: '武汉', endCity: '重庆' },
    { id: 'trk10', order_id: 'ord10', waybill_no: 'YT20260610010', status: 'delivered', startCity: '西安', endCity: '上海' },
    { id: 'trk11', order_id: 'ord11', waybill_no: 'YT20260611011', status: 'exception', startCity: '重庆', endCity: '北京' },
    { id: 'trk12', order_id: 'ord12', waybill_no: 'YT20260612012', status: 'in_transit', startCity: '上海', endCity: '广州' },
    { id: 'trk13', order_id: 'ord13', waybill_no: 'YT20260613013', status: 'picked_up', startCity: '北京', endCity: '长沙' },
    { id: 'trk14', order_id: 'ord14', waybill_no: 'YT20260614014', status: 'delivered', startCity: '广州', endCity: '沈阳' },
    { id: 'trk15', order_id: 'ord15', waybill_no: 'YT20260615015', status: 'out_for_delivery', startCity: '成都', endCity: '济南' },
    { id: 'trk16', order_id: 'ord16', waybill_no: 'YT20260616016', status: 'in_transit', startCity: '杭州', endCity: '郑州' },
    { id: 'trk17', order_id: 'ord17', waybill_no: 'YT20260617017', status: 'pending', startCity: '武汉', endCity: '西安' },
    { id: 'trk18', order_id: 'ord18', waybill_no: 'YT20260618018', status: 'delivered', startCity: '南京', endCity: '昆明' },
    { id: 'trk19', order_id: 'ord19', waybill_no: 'YT20260619019', status: 'in_transit', startCity: '西安', endCity: '厦门' },
    { id: 'trk20', order_id: 'ord20', waybill_no: 'YT20260620020', status: 'exception', startCity: '昆明', endCity: '上海' },
    { id: 'trk21', order_id: 'ord21', waybill_no: 'YT20260621021', status: 'out_for_delivery', startCity: '厦门', endCity: '北京' },
    { id: 'trk22', order_id: 'ord22', waybill_no: 'YT20260622022', status: 'in_transit', startCity: '上海', endCity: '广州' },
  ]

  for (const t of trackings) {
    const pos = positions[t.endCity] || { lat: 31.2304, lng: 121.4737 }
    const exceptionType = t.status === 'exception' ? 'stagnant' : null
    const exceptionMsg = t.status === 'exception' ? '快件滞留超过24小时，请尽快处理' : null
    const estDelivery = t.status === 'delivered' ? null : '2026-06-' + String(Math.floor(Math.random() * 5) + 15).padStart(2, '0')
    insertTracking.run(t.id, t.order_id, t.waybill_no, t.status, generateNodes(t.waybill_no, t.status, t.startCity, t.endCity), JSON.stringify(pos), estDelivery, exceptionType, exceptionMsg)
  }

  const insertAddress = db.prepare(`
    INSERT INTO address_book (id, user_id, name, phone, province, city, district, address, is_default, tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const addresses = [
    { id: 'addr1', user_id: 'u1', name: '张伟', phone: '13800138001', province: '上海市', city: '上海市', district: '浦东新区', address: '陆家嘴环路1000号恒生银行大厦', is_default: 1, tag: 'office' },
    { id: 'addr2', user_id: 'u1', name: '张伟', phone: '13800138001', province: '上海市', city: '上海市', district: '徐汇区', address: '漕溪北路398号汇智大厦', is_default: 0, tag: 'home' },
    { id: 'addr3', user_id: 'u1', name: '张伟妈妈', phone: '13800138001', province: '上海市', city: '上海市', district: '静安区', address: '南京西路1266号恒隆广场', is_default: 0, tag: 'other' },
    { id: 'addr4', user_id: 'u2', name: '王芳', phone: '13800138002', province: '北京市', city: '北京市', district: '朝阳区', address: '建国门外大街1号国贸大厦', is_default: 1, tag: 'office' },
    { id: 'addr5', user_id: 'u2', name: '王芳', phone: '13800138002', province: '北京市', city: '北京市', district: '海淀区', address: '中关村大街1号海龙大厦', is_default: 0, tag: 'home' },
    { id: 'addr6', user_id: 'u3', name: '李娜', phone: '13800138003', province: '广东省', city: '广州市', district: '天河区', address: '天河路385号太古汇', is_default: 1, tag: 'home' },
    { id: 'addr7', user_id: 'u3', name: '李娜', phone: '13800138003', province: '广东省', city: '广州市', district: '越秀区', address: '北京路100号名盛广场', is_default: 0, tag: 'office' },
    { id: 'addr8', user_id: 'u4', name: '刘洋', phone: '13800138004', province: '四川省', city: '成都市', district: '武侯区', address: '人民南路四段1号来福士广场', is_default: 1, tag: 'home' },
    { id: 'addr9', user_id: 'u4', name: '刘洋', phone: '13800138004', province: '四川省', city: '成都市', district: '锦江区', address: '春熙路88号IFS国际金融中心', is_default: 0, tag: 'office' },
    { id: 'addr10', user_id: 'u5', name: '陈静', phone: '13800138005', province: '浙江省', city: '杭州市', district: '西湖区', address: '文三路478号华星时代广场', is_default: 1, tag: 'office' },
    { id: 'addr11', user_id: 'u5', name: '陈静', phone: '13800138005', province: '浙江省', city: '杭州市', district: '上城区', address: '延安路200号银泰百货', is_default: 0, tag: 'home' },
    { id: 'addr12', user_id: 'u6', name: '杨帆', phone: '13800138006', province: '广东省', city: '深圳市', district: '南山区', address: '科技南路18号深圳湾科技生态园', is_default: 1, tag: 'office' },
    { id: 'addr13', user_id: 'u6', name: '杨帆', phone: '13800138006', province: '广东省', city: '深圳市', district: '福田区', address: '深南大道6011号NEO企业大道', is_default: 0, tag: 'home' },
    { id: 'addr14', user_id: 'u7', name: '黄磊', phone: '13800138007', province: '江苏省', city: '南京市', district: '鼓楼区', address: '中山路100号德基广场', is_default: 1, tag: 'home' },
    { id: 'addr15', user_id: 'u7', name: '黄磊', phone: '13800138007', province: '江苏省', city: '南京市', district: '玄武区', address: '珠江路300号华海3C广场', is_default: 0, tag: 'office' },
    { id: 'addr16', user_id: 'u8', name: '周敏', phone: '13800138008', province: '湖北省', city: '武汉市', district: '江汉区', address: '解放大道1000号武汉国际广场', is_default: 1, tag: 'home' },
    { id: 'addr17', user_id: 'u8', name: '周敏', phone: '13800138008', province: '湖北省', city: '武汉市', district: '武昌区', address: '东湖路100号楚天传媒大厦', is_default: 0, tag: 'office' },
    { id: 'addr18', user_id: 'u9', name: '吴强', phone: '13800138009', province: '陕西省', city: '西安市', district: '碑林区', address: '长安北路1号陕西国际会展中心', is_default: 1, tag: 'office' },
    { id: 'addr19', user_id: 'u9', name: '吴强', phone: '13800138009', province: '陕西省', city: '西安市', district: '雁塔区', address: '高新路50号南洋国际', is_default: 0, tag: 'home' },
    { id: 'addr20', user_id: 'u10', name: '赵雪', phone: '13800138010', province: '重庆市', city: '重庆市', district: '渝中区', address: '解放碑步行街88号环球金融中心', is_default: 1, tag: 'home' },
    { id: 'addr21', user_id: 'u10', name: '赵雪', phone: '13800138010', province: '重庆市', city: '重庆市', district: '江北区', address: '观音桥步行街50号北城天街', is_default: 0, tag: 'office' },
    { id: 'addr22', user_id: 'u11', name: '孙磊', phone: '13800138011', province: '江苏省', city: '苏州市', district: '工业园区', address: '星海街100号星海广场', is_default: 1, tag: 'home' },
  ]
  for (const a of addresses) {
    insertAddress.run(a.id, a.user_id, a.name, a.phone, a.province, a.city, a.district, a.address, a.is_default, a.tag)
  }

  const insertAlert = db.prepare(`
    INSERT INTO alerts (id, order_id, waybill_no, type, level, stagnant_hours, status, assignee, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const alerts = [
    { id: 'alert1', order_id: 'ord3', waybill_no: 'YT20260603003', type: 'stagnant', level: 'high', stagnant_hours: 48, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert2', order_id: 'ord11', waybill_no: 'YT20260611011', type: 'stagnant', level: 'high', stagnant_hours: 36, status: 'processing', assignee: '李运营', remarks: JSON.stringify([{ author: '李运营', content: '已联系收件人确认地址', time: '2026-06-05 10:00' }]) },
    { id: 'alert3', order_id: 'ord20', waybill_no: 'YT20260620020', type: 'stagnant', level: 'medium', stagnant_hours: 24, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert4', order_id: 'ord2', waybill_no: 'YT20260602002', type: 'stagnant', level: 'medium', stagnant_hours: 12, status: 'resolved', assignee: '李运营', remarks: JSON.stringify([{ author: '李运营', content: '快件已恢复正常运输', time: '2026-06-04 16:00' }]) },
    { id: 'alert5', order_id: 'ord5', waybill_no: 'YT20260605005', type: 'stagnant', level: 'low', stagnant_hours: 8, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert6', order_id: 'ord7', waybill_no: 'YT20260607007', type: 'delivery_delay', level: 'medium', stagnant_hours: 0, status: 'processing', assignee: '王管理', remarks: JSON.stringify([{ author: '王管理', content: '正在协调派送资源', time: '2026-06-05 09:00' }]) },
    { id: 'alert7', order_id: 'ord9', waybill_no: 'YT20260609009', type: 'stagnant', level: 'low', stagnant_hours: 6, status: 'resolved', assignee: '李运营', remarks: JSON.stringify([{ author: '李运营', content: '已解决', time: '2026-06-04 14:00' }]) },
    { id: 'alert8', order_id: 'ord12', waybill_no: 'YT20260612012', type: 'stagnant', level: 'low', stagnant_hours: 5, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert9', order_id: 'ord16', waybill_no: 'YT20260616016', type: 'delivery_delay', level: 'low', stagnant_hours: 0, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert10', order_id: 'ord19', waybill_no: 'YT20260619019', type: 'stagnant', level: 'medium', stagnant_hours: 18, status: 'processing', assignee: '李运营', remarks: JSON.stringify([{ author: '李运营', content: '正在处理中', time: '2026-06-06 10:00' }]) },
    { id: 'alert11', order_id: 'ord1', waybill_no: 'YT20260601001', type: 'complaint', level: 'high', stagnant_hours: 0, status: 'resolved', assignee: '王管理', remarks: JSON.stringify([{ author: '王管理', content: '已妥善处理用户投诉', time: '2026-06-03 15:00' }]) },
    { id: 'alert12', order_id: 'ord6', waybill_no: 'YT20260606006', type: 'damage', level: 'high', stagnant_hours: 0, status: 'processing', assignee: '李运营', remarks: JSON.stringify([{ author: '李运营', content: '正在核实损坏情况', time: '2026-06-05 11:00' }]) },
    { id: 'alert13', order_id: 'ord10', waybill_no: 'YT20260610010', type: 'stagnant', level: 'low', stagnant_hours: 4, status: 'resolved', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert14', order_id: 'ord14', waybill_no: 'YT20260614014', type: 'complaint', level: 'medium', stagnant_hours: 0, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert15', order_id: 'ord15', waybill_no: 'YT20260615015', type: 'stagnant', level: 'low', stagnant_hours: 3, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert16', order_id: 'ord18', waybill_no: 'YT20260618018', type: 'damage', level: 'medium', stagnant_hours: 0, status: 'resolved', assignee: '王管理', remarks: JSON.stringify([{ author: '王管理', content: '已完成赔偿处理', time: '2026-06-04 17:00' }]) },
    { id: 'alert17', order_id: 'ord21', waybill_no: 'YT20260621021', type: 'delivery_delay', level: 'medium', stagnant_hours: 0, status: 'processing', assignee: '李运营', remarks: JSON.stringify([{ author: '李运营', content: '已联系快递员', time: '2026-06-06 14:00' }]) },
    { id: 'alert18', order_id: 'ord22', waybill_no: 'YT20260622022', type: 'stagnant', level: 'low', stagnant_hours: 2, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert19', order_id: 'ord4', waybill_no: 'YT20260604004', type: 'pickup_delay', level: 'low', stagnant_hours: 0, status: 'resolved', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert20', order_id: 'ord8', waybill_no: 'YT20260608008', type: 'pickup_delay', level: 'medium', stagnant_hours: 0, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
    { id: 'alert21', order_id: 'ord13', waybill_no: 'YT20260613013', type: 'pickup_delay', level: 'low', stagnant_hours: 0, status: 'processing', assignee: '李运营', remarks: JSON.stringify([{ author: '李运营', content: '已安排快递员上门', time: '2026-06-06 09:00' }]) },
    { id: 'alert22', order_id: 'ord17', waybill_no: 'YT20260617017', type: 'stagnant', level: 'low', stagnant_hours: 1, status: 'pending', assignee: null, remarks: JSON.stringify([]) },
  ]
  for (const a of alerts) {
    insertAlert.run(a.id, a.order_id, a.waybill_no, a.type, a.level, a.stagnant_hours, a.status, a.assignee, a.remarks)
  }

  const insertNetwork = db.prepare(`
    INSERT INTO network_points (id, name, address, phone, business_hours, lat, lng, service_radius, coverage_polygon, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const networks = [
    { id: 'net1', name: '圆通浦东陆家嘴网点', address: '上海市浦东新区陆家嘴环路1088号', phone: '021-58881001', business_hours: '08:00-20:00', lat: 31.2397, lng: 121.4998, service_radius: 3.0, status: 'active' },
    { id: 'net2', name: '圆通徐汇漕溪网点', address: '上海市徐汇区漕溪北路41号', phone: '021-54882002', business_hours: '08:00-20:00', lat: 31.1875, lng: 121.4417, service_radius: 3.5, status: 'active' },
    { id: 'net3', name: '圆通黄浦南京路网点', address: '上海市黄浦区南京东路350号', phone: '021-63223003', business_hours: '08:30-19:30', lat: 31.2349, lng: 121.4747, service_radius: 2.5, status: 'active' },
    { id: 'net4', name: '圆通静安寺网点', address: '上海市静安区南京西路1618号', phone: '021-62884004', business_hours: '08:00-20:00', lat: 31.2244, lng: 121.4477, service_radius: 3.0, status: 'active' },
    { id: 'net5', name: '圆通杨浦五角场网点', address: '上海市杨浦区淞沪路151号', phone: '021-65885005', business_hours: '08:30-19:00', lat: 31.2994, lng: 121.5147, service_radius: 4.0, status: 'active' },
    { id: 'net6', name: '圆通长宁中山网点', address: '上海市长宁区长宁路1018号', phone: '021-52886006', business_hours: '09:00-18:00', lat: 31.2198, lng: 121.4175, service_radius: 2.8, status: 'inactive' },
    { id: 'net7', name: '圆通虹口足球场网点', address: '上海市虹口区东江湾路444号', phone: '021-65887007', business_hours: '08:00-20:00', lat: 31.2647, lng: 121.4733, service_radius: 3.2, status: 'active' },
    { id: 'net8', name: '圆通闵行莘庄网点', address: '上海市闵行区莘建东路58号', phone: '021-54888008', business_hours: '08:30-19:30', lat: 31.1130, lng: 121.3818, service_radius: 5.0, status: 'active' },
    { id: 'net9', name: '圆通北京朝阳网点', address: '北京市朝阳区建国路88号', phone: '010-65881001', business_hours: '08:00-20:00', lat: 39.9087, lng: 116.4605, service_radius: 3.5, status: 'active' },
    { id: 'net10', name: '圆通北京海淀网点', address: '北京市海淀区中关村大街27号', phone: '010-62882002', business_hours: '08:30-19:30', lat: 39.9847, lng: 116.3046, service_radius: 4.0, status: 'active' },
    { id: 'net11', name: '圆通广州天河网点', address: '广州市天河区天河路208号', phone: '020-38881001', business_hours: '08:00-20:00', lat: 23.1367, lng: 113.3250, service_radius: 3.0, status: 'active' },
    { id: 'net12', name: '圆通广州越秀网点', address: '广州市越秀区北京路238号', phone: '020-38882002', business_hours: '09:00-18:00', lat: 23.1291, lng: 113.2644, service_radius: 2.5, status: 'active' },
    { id: 'net13', name: '圆通深圳南山网点', address: '深圳市南山区科技园路1号', phone: '0755-86881001', business_hours: '08:00-20:00', lat: 22.5431, lng: 114.0579, service_radius: 3.5, status: 'active' },
    { id: 'net14', name: '圆通深圳福田网点', address: '深圳市福田区深南中路1002号', phone: '0755-86882002', business_hours: '08:30-19:30', lat: 22.5431, lng: 114.0859, service_radius: 3.0, status: 'active' },
    { id: 'net15', name: '圆通杭州西湖网点', address: '杭州市西湖区文三路398号', phone: '0571-88881001', business_hours: '08:00-20:00', lat: 30.2741, lng: 120.1551, service_radius: 3.0, status: 'active' },
    { id: 'net16', name: '圆通成都武侯网点', address: '成都市武侯区人民南路四段1号', phone: '028-68881001', business_hours: '08:30-19:30', lat: 30.5728, lng: 104.0668, service_radius: 3.5, status: 'active' },
    { id: 'net17', name: '圆通武汉江汉网点', address: '武汉市江汉区解放大道128号', phone: '027-68881001', business_hours: '08:00-20:00', lat: 30.5928, lng: 114.3055, service_radius: 3.0, status: 'active' },
    { id: 'net18', name: '圆通南京鼓楼网点', address: '南京市鼓楼区中山路100号', phone: '025-68881001', business_hours: '08:30-19:00', lat: 32.0603, lng: 118.7969, service_radius: 3.2, status: 'active' },
    { id: 'net19', name: '圆通西安雁塔网点', address: '西安市雁塔区高新路25号', phone: '029-68881001', business_hours: '09:00-18:00', lat: 34.3416, lng: 108.9398, service_radius: 4.0, status: 'inactive' },
    { id: 'net20', name: '圆通重庆渝中网点', address: '重庆市渝中区解放碑步行街1号', phone: '023-68881001', business_hours: '08:00-20:00', lat: 29.5630, lng: 106.5516, service_radius: 2.8, status: 'active' },
    { id: 'net21', name: '圆通商丘姑苏网点', address: '苏州市姑苏区观前街100号', phone: '0512-68881001', business_hours: '08:30-19:30', lat: 31.3000, lng: 120.6200, service_radius: 3.5, status: 'active' },
    { id: 'net22', name: '圆通青岛市南网点', address: '青岛市市南区香港中路10号', phone: '0532-68881001', business_hours: '08:00-19:00', lat: 36.0671, lng: 120.3826, service_radius: 3.0, status: 'active' },
  ]
  for (const n of networks) {
    insertNetwork.run(n.id, n.name, n.address, n.phone, n.business_hours, n.lat, n.lng, n.service_radius, JSON.stringify([]), n.status)
  }

  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_items (id, question, answer, category, keywords, hit_count, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const knowledgeItems = [
    { id: 'k1', question: '如何查询运单状态？', answer: '您可以通过运单号或手机号在首页或运单追踪页查询物流状态，输入运单号（YT开头）或收/寄件手机号即可实时查看。', category: '运单查询', keywords: JSON.stringify(['查询', '运单', '物流', '状态']), hit_count: 1560, enabled: 1 },
    { id: 'k2', question: '运费如何计算？', answer: '运费根据重量、体积和寄送距离综合计算，提供经济件、标准件和急件三种服务类型。经济件首重12元/kg，标准件首重18元/kg，急件首重25元/kg，续重另计。', category: '运费说明', keywords: JSON.stringify(['运费', '价格', '计费', '重量']), hit_count: 2300, enabled: 1 },
    { id: 'k3', question: '快递一般几天能到？', answer: '经济件3-5个工作日，标准件2-3个工作日，急件1-2个工作日。偏远地区可能延长1-2天。具体时效可在下单时查看预计送达时间。', category: '时效说明', keywords: JSON.stringify(['时效', '几天', '送达', '工作日']), hit_count: 1980, enabled: 1 },
    { id: 'k4', question: '如何修改收件地址？', answer: '快件发出前可联系客服修改收件地址，快件发出后如需修改地址可能产生额外费用。请拨打客服热线或通过APP在线客服进行修改。', category: '订单修改', keywords: JSON.stringify(['修改', '地址', '收件', '变更']), hit_count: 870, enabled: 1 },
    { id: 'k5', question: '快件丢失如何处理？', answer: '如确认快件丢失，请提供运单号联系客服进行登记，我们将在24小时内启动调查程序。根据调查结果进行赔偿，保价快件按保价金额赔偿，未保价快件按运费的3-5倍赔偿。', category: '异常处理', keywords: JSON.stringify(['丢失', '赔偿', '异常', '保价']), hit_count: 650, enabled: 1 },
    { id: 'k6', question: '哪些物品不能寄递？', answer: '禁止寄递物品包括：易燃易爆品、腐蚀性物品、毒性物品、放射性物品、国家法律法规禁止流通的物品等。具体禁寄清单请查看快递服务协议。', category: '禁寄物品', keywords: JSON.stringify(['禁止', '禁寄', '物品', '危险品']), hit_count: 1120, enabled: 1 },
    { id: 'k7', question: '如何申请保价服务？', answer: '下单时可选择保价服务，填写保价金额并支付保价费（保价金额的千分之五）。保价最高金额为5万元。保价快件如发生丢失或损坏，将按保价金额全额赔偿。', category: '保价服务', keywords: JSON.stringify(['保价', '赔偿', '损坏', '金额']), hit_count: 450, enabled: 1 },
    { id: 'k8', question: '可以指定送货时间吗？', answer: '标准件和急件支持预约送货时间，可在下单时选择送货时间段（上午8-12点、下午12-18点、晚间18-20点）。经济件暂不支持预约。', category: '配送服务', keywords: JSON.stringify(['预约', '送货', '时间', '指定']), hit_count: 780, enabled: 1 },
    { id: 'k9', question: '如何使用优惠券？', answer: '在下单确认页面，点击"使用优惠券"按钮，选择可用的优惠券即可抵扣相应金额。每笔订单只能使用一张优惠券，优惠券不可叠加使用。', category: '优惠活动', keywords: JSON.stringify(['优惠券', '抵扣', '折扣', '活动']), hit_count: 1340, enabled: 1 },
    { id: 'k10', question: '网点营业时间是什么？', answer: '大部分网点营业时间为08:00-20:00，部分网点可能有所不同。您可以在网点查询页面查看具体网点的营业时间，也可以拨打网点电话咨询。', category: '网点服务', keywords: JSON.stringify(['网点', '营业时间', '服务', '自寄']), hit_count: 560, enabled: 1 },
    { id: 'k11', question: '如何申请退款？', answer: '未揽收的订单可在订单详情页直接申请退款，已揽收的订单请联系客服处理。退款将在1-3个工作日内原路返回。', category: '退款服务', keywords: JSON.stringify(['退款', '退单', '取消', '费用']), hit_count: 890, enabled: 1 },
    { id: 'k12', question: '快递员什么时候上门取件？', answer: '下单成功后，快递员一般会在2小时内上门取件（工作时间内）。您也可以预约具体的取件时间段。', category: '上门取件', keywords: JSON.stringify(['取件', '上门', '快递员', '时间']), hit_count: 720, enabled: 1 },
    { id: 'k13', question: '如何联系客服？', answer: '您可以通过APP在线客服、客服热线400-888-8888、微信公众号等多种渠道联系我们的客服团队，我们将竭诚为您服务。', category: '客服服务', keywords: JSON.stringify(['客服', '联系', '电话', '咨询']), hit_count: 1200, enabled: 1 },
    { id: 'k14', question: '可以代收货款吗？', answer: '支持代收货款服务，需在下单时选择代收货款并填写代收金额。代收货款服务费为代收金额的1%，最低2元。', category: '增值服务', keywords: JSON.stringify(['代收', '货款', '货到付款', '代收货款']), hit_count: 340, enabled: 1 },
    { id: 'k15', question: '如何开具发票？', answer: '您可以在订单完成后，在订单详情页申请开具电子发票，填写发票抬头和税号即可。发票将在申请后3个工作日内发送到您的邮箱。', category: '发票服务', keywords: JSON.stringify(['发票', '开票', '电子发票', '报销']), hit_count: 560, enabled: 1 },
    { id: 'k16', question: '什么是体积重？', answer: '体积重量是运输行业内的一种计算轻泡货物重量的方法。体积重量计算公式为：长(cm)×宽(cm)×高(cm)÷6000。当货物体积重大于实际重量时，按体积重计费。', category: '运费说明', keywords: JSON.stringify(['体积重', '泡货', '计费重量', '体积']), hit_count: 680, enabled: 1 },
    { id: 'k17', question: '如何投诉快递员？', answer: '如您对快递员服务不满意，可以在订单详情页提交评价或投诉，也可以联系客服进行投诉。我们会在24小时内处理您的投诉。', category: '投诉建议', keywords: JSON.stringify(['投诉', '快递员', '服务', '差评']), hit_count: 420, enabled: 1 },
    { id: 'k18', question: '支持哪些支付方式？', answer: '支持微信支付、支付宝、银行卡支付等多种支付方式。企业客户还可以选择月结账户支付。', category: '支付服务', keywords: JSON.stringify(['支付', '微信', '支付宝', '付款']), hit_count: 380, enabled: 1 },
    { id: 'k19', question: '如何成为会员？', answer: '注册账号即可成为普通会员，累计消费满一定金额可升级为银卡、金卡、钻石卡会员，享受更多优惠和专属服务。', category: '会员服务', keywords: JSON.stringify(['会员', '等级', 'VIP', '积分']), hit_count: 290, enabled: 1 },
    { id: 'k20', question: '大件物品怎么寄？', answer: '大件物品请选择经济件或大件物流服务，我们提供上门取件、专业包装、送货上楼等服务。具体费用请咨询客服或使用运费计算器。', category: '大件物流', keywords: JSON.stringify(['大件', '重货', '家具', '大件物流']), hit_count: 510, enabled: 1 },
    { id: 'k21', question: '国际快递怎么收费？', answer: '国际快递费用根据目的地国家、重量和体积计算。支持全球200多个国家和地区，时效3-7个工作日。具体费用请使用国际运费计算器。', category: '国际件', keywords: JSON.stringify(['国际', '海外', '跨境', '国际快递']), hit_count: 370, enabled: 1 },
    { id: 'k22', question: '冷链运输支持吗？', answer: '支持冷链运输服务，全程温控2-8℃，适合生鲜、医药等温控产品。请在下单时选择冷链服务，我们会安排专业冷链车辆运输。', category: '冷链服务', keywords: JSON.stringify(['冷链', '冷藏', '生鲜', '医药']), hit_count: 230, enabled: 1 },
  ]
  for (const k of knowledgeItems) {
    insertKnowledge.run(k.id, k.question, k.answer, k.category, k.keywords, k.hit_count, k.enabled)
  }

  const insertTicket = db.prepare(`
    INSERT INTO tickets (id, user_id, subject, status, messages)
    VALUES (?, ?, ?, ?, ?)
  `)

  const tickets = [
    { id: 'tkt1', user_id: 'u1', subject: '快件YT20260601001配送问题', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '我的快件显示已签收，但我没收到', time: '2026-06-02 16:00' }, { role: 'bot', content: '您好，已为您查询到该快件状态。显示已签收，签收人：前台。', time: '2026-06-02 16:01' }, { role: 'user', content: '好的，我去前台看看，谢谢', time: '2026-06-02 16:05' }]) },
    { id: 'tkt2', user_id: 'u2', subject: '运费计算疑问', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '我寄了一个1.2kg的件到杭州，为什么收了18元？', time: '2026-06-03 10:00' }, { role: 'bot', content: '您好，标准件首重1kg收费18元，续重0.2kg按2元/kg计算，共计18.4元，实收18元（已优惠）。', time: '2026-06-03 10:01' }, { role: 'user', content: '明白了，谢谢', time: '2026-06-03 10:05' }]) },
    { id: 'tkt3', user_id: 'u3', subject: '优惠券使用问题', status: 'in_progress', messages: JSON.stringify([{ role: 'user', content: '我有一张5元优惠券，下单时为什么不能用？', time: '2026-06-04 09:00' }, { role: 'bot', content: '您好，正在为您查询优惠券信息，请稍等。', time: '2026-06-04 09:01' }, { role: 'agent', content: '您好，您的优惠券需要满20元才能使用，您当前订单金额为18元，所以无法使用。', time: '2026-06-04 09:10' }]) },
    { id: 'tkt4', user_id: 'u4', subject: '快件损坏赔偿', status: 'open', messages: JSON.stringify([{ role: 'user', content: '我的快件收到时外包装损坏，里面的东西也坏了', time: '2026-06-05 14:00' }, { role: 'bot', content: '非常抱歉给您带来不便，已为您转人工处理。', time: '2026-06-05 14:01' }]) },
    { id: 'tkt5', user_id: 'u5', subject: '改地址申请', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '我要修改收件地址', time: '2026-06-03 11:00' }, { role: 'agent', content: '请问您的运单号是多少？', time: '2026-06-03 11:05' }, { role: 'user', content: 'YT20260606006', time: '2026-06-03 11:06' }, { role: 'agent', content: '已为您修改地址，新地址：南京市鼓楼区中山路100号', time: '2026-06-03 11:10' }]) },
    { id: 'tkt6', user_id: 'u6', subject: '发票开具问题', status: 'open', messages: JSON.stringify([{ role: 'user', content: '我上个月的发票还没收到', time: '2026-06-05 10:00' }, { role: 'bot', content: '您好，请提供您的订单号和邮箱，我们为您查询。', time: '2026-06-05 10:01' }]) },
    { id: 'tkt7', user_id: 'u7', subject: '投诉快递员服务态度', status: 'in_progress', messages: JSON.stringify([{ role: 'user', content: '今天送快递的那个人态度太差了！', time: '2026-06-04 17:00' }, { role: 'bot', content: '非常抱歉给您带来不好的体验，我们会严肃处理。', time: '2026-06-04 17:01' }, { role: 'agent', content: '您好，已记录您的投诉，我们会对该快递员进行批评教育，感谢您的反馈。', time: '2026-06-05 09:00' }]) },
    { id: 'tkt8', user_id: 'u8', subject: '关于保价服务的咨询', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '保价费怎么收？', time: '2026-06-02 15:00' }, { role: 'bot', content: '保价费为保价金额的千分之五，最低2元。', time: '2026-06-02 15:01' }]) },
    { id: 'tkt9', user_id: 'u9', subject: '寄件时效咨询', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '从西安寄到上海要多久？', time: '2026-06-01 09:00' }, { role: 'bot', content: '您好，标准件2-3天，经济件3-5天，急件1-2天。', time: '2026-06-01 09:01' }]) },
    { id: 'tkt10', user_id: 'u10', subject: '快件丢了怎么办', status: 'in_progress', messages: JSON.stringify([{ role: 'user', content: '我的快递一周了还没到，是不是丢了？', time: '2026-06-05 16:00' }, { role: 'bot', content: '您好，请提供运单号，我帮您查询。', time: '2026-06-05 16:01' }, { role: 'user', content: 'YT20260611011', time: '2026-06-05 16:02' }, { role: 'agent', content: '您好，已为您查询，该快件目前在天津中转，因天气原因有所延误，预计明天送达。', time: '2026-06-05 16:20' }]) },
    { id: 'tkt11', user_id: 'u11', subject: '上门取件时间', status: 'open', messages: JSON.stringify([{ role: 'user', content: '我今天下午能寄件吗？', time: '2026-06-06 08:00' }, { role: 'bot', content: '可以的，您下单后快递员会在2小时内上门。', time: '2026-06-06 08:01' }]) },
    { id: 'tkt12', user_id: 'u12', subject: '月结账户申请', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '怎么申请月结账户？', time: '2026-06-01 14:00' }, { role: 'agent', content: '您好，申请月结账户需要企业资质，月发件量50票以上。请提供企业营业执照和法人身份证照片到企业服务邮箱。', time: '2026-06-01 14:30' }, { role: 'user', content: '好的，谢谢', time: '2026-06-01 14:35' }]) },
    { id: 'tkt13', user_id: 'u13', subject: '大件物流咨询', status: 'in_progress', messages: JSON.stringify([{ role: 'user', content: '我要寄一台冰箱，你们收吗？', time: '2026-06-04 10:00' }, { role: 'bot', content: '可以的，我们有大件物流服务。', time: '2026-06-04 10:01' }, { role: 'agent', content: '您好，冰箱属于大件物品，需要走大件物流专线。请问重量和尺寸大概是多少？', time: '2026-06-04 10:30' }]) },
    { id: 'tkt14', user_id: 'u14', subject: '国际件咨询', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '能寄到日本吗？', time: '2026-06-02 11:00' }, { role: 'bot', content: '可以的，支持全球200多个国家和地区。', time: '2026-06-02 11:01' }, { role: 'user', content: '运费多少？', time: '2026-06-02 11:02' }, { role: 'agent', content: '到日本首重1kg 80元，续重每500g 25元。', time: '2026-06-02 11:10' }]) },
    { id: 'tkt15', user_id: 'u15', subject: '冷链运输价格', status: 'open', messages: JSON.stringify([{ role: 'user', content: '冷链运输怎么收费？', time: '2026-06-06 09:00' }, { role: 'bot', content: '正在为您转人工客服，请稍候。', time: '2026-06-06 09:01' }]) },
    { id: 'tkt16', user_id: 'u16', subject: '会员积分问题', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '积分怎么获得？有什么用？', time: '2026-06-03 16:00' }, { role: 'bot', content: '每消费1元获得1积分，积分可以兑换优惠券和礼品。', time: '2026-06-03 16:01' }]) },
    { id: 'tkt17', user_id: 'u17', subject: '派送时间请求', status: 'in_progress', messages: JSON.stringify([{ role: 'user', content: '我的件能不能周末再送？', time: '2026-06-05 12:00' }, { role: 'agent', content: '可以的，请提供运单号，我帮您备注。', time: '2026-06-05 12:10' }, { role: 'user', content: 'YT20260616016', time: '2026-06-05 12:11' }]) },
    { id: 'tkt18', user_id: 'u18', subject: '自提网点查询', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '西安雁塔区有自提点吗？', time: '2026-06-01 10:00' }, { role: 'bot', content: '有的，雁塔区高新路25号有一个网点，营业时间09:00-18:00。', time: '2026-06-01 10:01' }]) },
    { id: 'tkt19', user_id: 'u19', subject: '禁寄物品询问', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '充电宝能寄吗？', time: '2026-06-02 14:00' }, { role: 'bot', content: '充电宝可以寄，但只能走陆运，不能空运。', time: '2026-06-02 14:01' }]) },
    { id: 'tkt20', user_id: 'u20', subject: '包装材料购买', status: 'open', messages: JSON.stringify([{ role: 'user', content: '你们有纸箱卖吗？', time: '2026-06-06 11:00' }, { role: 'bot', content: '有的，有多种规格的纸箱和包装材料可供选择。', time: '2026-06-06 11:01' }]) },
    { id: 'tkt21', user_id: 'u1', subject: '申请退款', status: 'in_progress', messages: JSON.stringify([{ role: 'user', content: '我要取消订单退款', time: '2026-06-06 13:00' }, { role: 'agent', content: '好的，请问您的订单号是？', time: '2026-06-06 13:05' }]) },
    { id: 'tkt22', user_id: 'u2', subject: '表扬快递员', status: 'resolved', messages: JSON.stringify([{ role: 'user', content: '今天给我送件的快递员服务特别好，要表扬！', time: '2026-06-04 18:00' }, { role: 'bot', content: '非常感谢您的认可，我们会转达您的表扬！', time: '2026-06-04 18:01' }]) },
  ]
  for (const t of tickets) {
    insertTicket.run(t.id, t.user_id, t.subject, t.status, t.messages)
  }

  const insertProfile = db.prepare(`
    INSERT INTO user_profiles (id, user_id, cluster, frequency, regions, categories, avg_weight, total_orders, coupon_usage_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const profiles = [
    { id: 'prof1', user_id: 'u1', cluster: '高频用户', frequency: 'high', regions: JSON.stringify(['上海市', '北京市', '广州市']), categories: JSON.stringify(['电子产品', '文件', '日用品', '服装', '食品']), avg_weight: 2.5, total_orders: 28, coupon_usage_rate: 0.75 },
    { id: 'prof2', user_id: 'u2', cluster: '普通用户', frequency: 'medium', regions: JSON.stringify(['北京市', '成都市']), categories: JSON.stringify(['日用品', '服装', '化妆品']), avg_weight: 3.2, total_orders: 12, coupon_usage_rate: 0.45 },
    { id: 'prof3', user_id: 'u3', cluster: '普通用户', frequency: 'medium', regions: JSON.stringify(['广东省', '浙江省']), categories: JSON.stringify(['食品', '化妆品', '服装']), avg_weight: 1.8, total_orders: 15, coupon_usage_rate: 0.6 },
    { id: 'prof4', user_id: 'u4', cluster: '低频用户', frequency: 'low', regions: JSON.stringify(['四川省', '广东省']), categories: JSON.stringify(['服装', '电子产品']), avg_weight: 2.0, total_orders: 5, coupon_usage_rate: 0.2 },
    { id: 'prof5', user_id: 'u5', cluster: '高频用户', frequency: 'high', regions: JSON.stringify(['浙江省', '江苏省']), categories: JSON.stringify(['书籍', '文件', '日用品']), avg_weight: 1.5, total_orders: 32, coupon_usage_rate: 0.8 },
    { id: 'prof6', user_id: 'u6', cluster: '高频用户', frequency: 'high', regions: JSON.stringify(['广东省', '湖北省']), categories: JSON.stringify(['电子产品', '化妆品', '服装']), avg_weight: 2.8, total_orders: 25, coupon_usage_rate: 0.7 },
    { id: 'prof7', user_id: 'u7', cluster: '普通用户', frequency: 'medium', regions: JSON.stringify(['江苏省', '陕西省']), categories: JSON.stringify(['文件', '书籍', '电子产品']), avg_weight: 1.2, total_orders: 10, coupon_usage_rate: 0.5 },
    { id: 'prof8', user_id: 'u8', cluster: '低频用户', frequency: 'low', regions: JSON.stringify(['湖北省', '重庆市']), categories: JSON.stringify(['家电', '日用品']), avg_weight: 4.5, total_orders: 3, coupon_usage_rate: 0.0 },
    { id: 'prof9', user_id: 'u9', cluster: '普通用户', frequency: 'medium', regions: JSON.stringify(['陕西省', '江苏省']), categories: JSON.stringify(['日用品', '食品']), avg_weight: 3.0, total_orders: 14, coupon_usage_rate: 0.35 },
    { id: 'prof10', user_id: 'u10', cluster: '高频用户', frequency: 'high', regions: JSON.stringify(['重庆市', '北京市']), categories: JSON.stringify(['服装', '化妆品', '食品']), avg_weight: 2.2, total_orders: 30, coupon_usage_rate: 0.65 },
    { id: 'prof11', user_id: 'u11', cluster: '普通用户', frequency: 'medium', regions: JSON.stringify(['江苏省', '山东省']), categories: JSON.stringify(['食品', '日用品']), avg_weight: 2.0, total_orders: 11, coupon_usage_rate: 0.4 },
    { id: 'prof12', user_id: 'u12', cluster: '低频用户', frequency: 'low', regions: JSON.stringify(['天津市', '湖南省']), categories: JSON.stringify(['文件', '服装']), avg_weight: 0.8, total_orders: 4, coupon_usage_rate: 0.25 },
    { id: 'prof13', user_id: 'u13', cluster: '普通用户', frequency: 'medium', regions: JSON.stringify(['山东省', '辽宁省']), categories: JSON.stringify(['家居', '日用品']), avg_weight: 5.0, total_orders: 9, coupon_usage_rate: 0.3 },
    { id: 'prof14', user_id: 'u14', cluster: '高频用户', frequency: 'high', regions: JSON.stringify(['湖南省', '山东省']), categories: JSON.stringify(['化妆品', '食品', '服装']), avg_weight: 1.8, total_orders: 27, coupon_usage_rate: 0.72 },
    { id: 'prof15', user_id: 'u15', cluster: '低频用户', frequency: 'low', regions: JSON.stringify(['辽宁省', '河南省']), categories: JSON.stringify(['电子产品', '文件']), avg_weight: 2.5, total_orders: 6, coupon_usage_rate: 0.15 },
    { id: 'prof16', user_id: 'u16', cluster: '普通用户', frequency: 'medium', regions: JSON.stringify(['山东省', '陕西省']), categories: JSON.stringify(['日用品', '服装']), avg_weight: 3.5, total_orders: 13, coupon_usage_rate: 0.55 },
    { id: 'prof17', user_id: 'u17', cluster: '高频用户', frequency: 'high', regions: JSON.stringify(['河南省', '云南省']), categories: JSON.stringify(['文件', '书籍', '日用品']), avg_weight: 1.0, total_orders: 35, coupon_usage_rate: 0.85 },
    { id: 'prof18', user_id: 'u18', cluster: '普通用户', frequency: 'medium', regions: JSON.stringify(['陕西省', '福建省']), categories: JSON.stringify(['服装', '食品']), avg_weight: 2.8, total_orders: 16, coupon_usage_rate: 0.5 },
    { id: 'prof19', user_id: 'u19', cluster: '低频用户', frequency: 'low', regions: JSON.stringify(['云南省', '上海市']), categories: JSON.stringify(['书籍', '日用品']), avg_weight: 1.5, total_orders: 4, coupon_usage_rate: 0.1 },
    { id: 'prof20', user_id: 'u20', cluster: '普通用户', frequency: 'medium', regions: JSON.stringify(['福建省', '北京市']), categories: JSON.stringify(['食品', '化妆品']), avg_weight: 1.2, total_orders: 10, coupon_usage_rate: 0.48 },
    { id: 'prof21', user_id: 'u21', cluster: '运营人员', frequency: 'medium', regions: JSON.stringify(['上海市']), categories: JSON.stringify(['文件']), avg_weight: 0.5, total_orders: 8, coupon_usage_rate: 0.0 },
    { id: 'prof22', user_id: 'u22', cluster: '管理人员', frequency: 'low', regions: JSON.stringify(['上海市']), categories: JSON.stringify(['文件']), avg_weight: 0.3, total_orders: 2, coupon_usage_rate: 0.0 },
  ]
  for (const p of profiles) {
    insertProfile.run(p.id, p.user_id, p.cluster, p.frequency, p.regions, p.categories, p.avg_weight, p.total_orders, p.coupon_usage_rate)
  }

  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, code, amount, type, target_cluster, expires_at, used, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const coupons = [
    { id: 'cpn1', code: 'WELCOME5', amount: 5, type: 'fixed', target_cluster: '低频用户', expires_at: '2025-12-31', used: 0, user_id: null },
    { id: 'cpn2', code: 'VIP10', amount: 10, type: 'fixed', target_cluster: '高频用户', expires_at: '2025-12-31', used: 0, user_id: null },
    { id: 'cpn3', code: 'SAVE8PER', amount: 8, type: 'percent', target_cluster: '普通用户', expires_at: '2025-09-30', used: 0, user_id: null },
    { id: 'cpn4', code: 'FREESHIP001', amount: 0, type: 'free_shipping', target_cluster: '高频用户', expires_at: '2025-08-31', used: 1, user_id: 'u1' },
    { id: 'cpn5', code: 'NEWUSER10', amount: 10, type: 'fixed', target_cluster: '低频用户', expires_at: '2025-12-31', used: 0, user_id: 'u4' },
    { id: 'cpn6', code: 'SUMMER20', amount: 20, type: 'fixed', target_cluster: '高频用户', expires_at: '2025-08-31', used: 0, user_id: 'u1' },
    { id: 'cpn7', code: 'FLASH5OFF', amount: 5, type: 'percent', target_cluster: null, expires_at: '2025-07-31', used: 0, user_id: null },
    { id: 'cpn8', code: 'BIRTHDAY15', amount: 15, type: 'fixed', target_cluster: '高频用户', expires_at: '2025-12-31', used: 1, user_id: 'u5' },
    { id: 'cpn9', code: 'APPUSER3', amount: 3, type: 'fixed', target_cluster: null, expires_at: '2025-09-30', used: 0, user_id: 'u2' },
    { id: 'cpn10', code: 'SHARE5', amount: 5, type: 'fixed', target_cluster: null, expires_at: '2025-10-31', used: 1, user_id: 'u3' },
    { id: 'cpn11', code: 'VIPFREE', amount: 0, type: 'free_shipping', target_cluster: '高频用户', expires_at: '2025-12-31', used: 0, user_id: 'u6' },
    { id: 'cpn12', code: 'WEEKEND8', amount: 8, type: 'fixed', target_cluster: '普通用户', expires_at: '2025-08-31', used: 0, user_id: null },
    { id: 'cpn13', code: 'FIRSTORDER', amount: 12, type: 'fixed', target_cluster: '低频用户', expires_at: '2025-12-31', used: 1, user_id: 'u7' },
    { id: 'cpn14', code: 'MIDYEAR15', amount: 15, type: 'percent', target_cluster: '高频用户', expires_at: '2025-07-15', used: 0, user_id: 'u10' },
    { id: 'cpn15', code: 'LUCKY10', amount: 10, type: 'fixed', target_cluster: null, expires_at: '2025-11-30', used: 0, user_id: 'u8' },
    { id: 'cpn16', code: 'SUPERSAVER', amount: 25, type: 'fixed', target_cluster: '高频用户', expires_at: '2025-09-30', used: 1, user_id: 'u5' },
    { id: 'cpn17', code: 'NEWCOMER', amount: 8, type: 'fixed', target_cluster: '低频用户', expires_at: '2025-12-31', used: 0, user_id: 'u12' },
    { id: 'cpn18', code: 'SEASONAL', amount: 10, type: 'percent', target_cluster: '普通用户', expires_at: '2025-08-31', used: 0, user_id: 'u9' },
    { id: 'cpn19', code: 'REFEREE', amount: 15, type: 'fixed', target_cluster: null, expires_at: '2025-12-31', used: 1, user_id: 'u11' },
    { id: 'cpn20', code: 'VIPDAY', amount: 30, type: 'fixed', target_cluster: '高频用户', expires_at: '2025-07-31', used: 0, user_id: null },
    { id: 'cpn21', code: 'THANKYOU', amount: 5, type: 'fixed', target_cluster: null, expires_at: '2025-12-31', used: 0, user_id: 'u15' },
    { id: 'cpn22', code: 'EXPRESS10', amount: 10, type: 'fixed', target_cluster: '普通用户', expires_at: '2025-09-30', used: 1, user_id: 'u16' },
  ]
  for (const c of coupons) {
    insertCoupon.run(c.id, c.code, c.amount, c.type, c.target_cluster, c.expires_at, c.used, c.user_id)
  }

  console.log('Seed data inserted successfully')
}
