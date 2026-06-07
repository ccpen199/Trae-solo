const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

function seedData() {
  console.log('开始初始化演示数据...');
  
  const insertInsured = db.prepare(`
    INSERT OR IGNORE INTO insured_persons 
    (id, id_card, name, gender, birth_date, phone, address, insurance_type, insurance_area, insured_date, medical_card_number, status, balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insuredPersons = [
    { id_card: '110101198001011234', name: '张三', gender: '男', birth_date: '1980-01-01', phone: '13800138001', address: '北京市朝阳区建国路88号', insurance_type: '职工医保', insurance_area: '北京市', insured_date: '2010-01-01', balance: 5280.50, status: '正常参保' },
    { id_card: '310101198502022345', name: '李四', gender: '女', birth_date: '1985-02-02', phone: '13800138002', address: '上海市浦东新区陆家嘴路100号', insurance_type: '居民医保', insurance_area: '上海市', insured_date: '2015-03-15', balance: 1250.30, status: '正常参保' },
    { id_card: '440101197803033456', name: '王五', gender: '男', birth_date: '1978-03-03', phone: '13800138003', address: '广州市天河区体育西路50号', insurance_type: '职工医保', insurance_area: '广东省广州市', insured_date: '2008-06-20', balance: 8920.00, status: '正常参保' },
    { id_card: '440301199004044567', name: '赵六', gender: '女', birth_date: '1990-04-04', phone: '13800138004', address: '深圳市南山区科技园路200号', insurance_type: '职工医保', insurance_area: '广东省深圳市', insured_date: '2012-09-01', balance: 3650.80, status: '正常参保' },
    { id_card: '510101197505055678', name: '钱七', gender: '男', birth_date: '1975-05-05', phone: '13800138005', address: '成都市武侯区人民南路300号', insurance_type: '新农合', insurance_area: '四川省成都市', insured_date: '2018-01-10', balance: 680.00, status: '正常参保' },
    { id_card: '330101198806066789', name: '孙八', gender: '男', birth_date: '1988-06-06', phone: '13800138006', address: '杭州市西湖区文三路400号', insurance_type: '职工医保', insurance_area: '浙江省杭州市', insured_date: '2013-04-20', balance: 4120.60, status: '正常参保' },
    { id_card: '320101199207077890', name: '周九', gender: '女', birth_date: '1992-07-07', phone: '13800138007', address: '南京市鼓楼区中山路500号', insurance_type: '居民医保', insurance_area: '江苏省南京市', insured_date: '2019-08-01', balance: 980.40, status: '正常参保' },
    { id_card: '420101198308088901', name: '吴十', gender: '男', birth_date: '1983-08-08', phone: '13800138008', address: '武汉市江汉区解放大道600号', insurance_type: '职工医保', insurance_area: '湖北省武汉市', insured_date: '2011-05-15', balance: 7560.20, status: '正常参保' },
    { id_card: '500101199109099012', name: '郑十一', gender: '女', birth_date: '1991-09-09', phone: '13800138009', address: '重庆市渝中区中山路700号', insurance_type: '职工医保', insurance_area: '重庆市', insured_date: '2014-11-01', balance: 2340.90, status: '暂停参保' },
    { id_card: '610101198610101123', name: '王建国', gender: '男', birth_date: '1986-10-10', phone: '13800138010', address: '西安市雁塔区高新路800号', insurance_type: '居民医保', insurance_area: '陕西省西安市', insured_date: '2020-02-15', balance: 560.00, status: '正常参保' },
  ];
  
  const personIds = [];
  insuredPersons.forEach((person, idx) => {
    const id = uuidv4();
    personIds.push(id);
    const mcNum = 'YBK' + String(2024060100 + idx).slice(-10);
    insertInsured.run(id, person.id_card, person.name, person.gender, person.birth_date, person.phone, person.address, person.insurance_type, person.insurance_area, person.insured_date, mcNum, person.status, person.balance);
  });
  
  console.log(`已初始化 ${insuredPersons.length} 条参保人数据`);
  
  const insertCredential = db.prepare(`
    INSERT OR IGNORE INTO electronic_credentials 
    (id, insured_person_id, credential_number, qr_code, biometric_hash, status, issued_at, expires_at, last_used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const now = new Date().toISOString().slice(0, 10);
  personIds.slice(0, 8).forEach((pid, idx) => {
    const cid = uuidv4();
    const cNum = 'YBDZ' + String(2024060100 + idx);
    const qr = Buffer.from(cNum + pid.slice(0, 8)).toString('base64');
    const bioHash = 'BIO:' + pid.slice(0, 12).toUpperCase();
    const expAt = '2027-06-01';
    const usedAt = idx < 5 ? now : null;
    const st = idx < 6 ? '有效' : (idx < 7 ? '冻结' : '失效');
    insertCredential.run(cid, pid, cNum, qr, bioHash, st, '2024-06-01', expAt, usedAt);
  });
  
  console.log('已初始化电子凭证数据');
  
  const insertPrescription = db.prepare(`
    INSERT OR IGNORE INTO prescriptions 
    (id, insured_person_id, hospital_name, doctor_name, diagnosis, total_amount, reimbursement_amount, self_pay_amount, status, prescription_date, pharmacy_id, verification_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertItem = db.prepare(`
    INSERT OR IGNORE INTO prescription_items 
    (id, prescription_id, drug_code, drug_name, specification, quantity, unit, unit_price, total_price, dosage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const rxData = [
    { personIdx: 0, hospital: '北京协和医院', doctor: '张明华', diagnosis: '高血压', total: 350.00, status: '已核销', date: '2026-05-15', pharmacy: 'PH001', verifyTime: '2026-05-16', items: [
      { code: 'D001', name: '硝苯地平缓释片', spec: '10mg*30片', qty: 2, unit: '盒', price: 28.50, total: 57.00, dosage: '每日1次，每次1片' },
      { code: 'D002', name: '阿司匹林肠溶片', spec: '100mg*30片', qty: 3, unit: '盒', price: 15.80, total: 47.40, dosage: '每日1次，每次1片' }
    ]},
    { personIdx: 1, hospital: '上海瑞金医院', doctor: '李秀芳', diagnosis: '糖尿病', total: 580.00, status: '已流转', date: '2026-05-20', pharmacy: null, verifyTime: null, items: [
      { code: 'D003', name: '二甲双胍片', spec: '0.5g*60片', qty: 2, unit: '盒', price: 45.00, total: 90.00, dosage: '每日2次，每次1片' },
      { code: 'D004', name: '格列美脲片', spec: '2mg*30片', qty: 1, unit: '盒', price: 68.00, total: 68.00, dosage: '每日1次，每次1片' }
    ]},
    { personIdx: 2, hospital: '广州中山医院', doctor: '王伟', diagnosis: '冠心病', total: 820.00, status: '已审核', date: '2026-05-25', pharmacy: null, verifyTime: null, items: [
      { code: 'D005', name: '阿托伐他汀钙片', spec: '20mg*14片', qty: 4, unit: '盒', price: 52.00, total: 208.00, dosage: '每日1次，每次1片' },
      { code: 'D006', name: '氯吡格雷片', spec: '75mg*7片', qty: 8, unit: '盒', price: 28.00, total: 224.00, dosage: '每日1次，每次1片' }
    ]},
    { personIdx: 3, hospital: '深圳人民医院', doctor: '陈丽', diagnosis: '支气管炎', total: 260.00, status: '待审核', date: '2026-05-28', pharmacy: null, verifyTime: null, items: [
      { code: 'D007', name: '阿莫西林胶囊', spec: '0.5g*24粒', qty: 2, unit: '盒', price: 18.50, total: 37.00, dosage: '每日3次，每次2粒' },
      { code: 'D008', name: '盐酸氨溴索片', spec: '30mg*20片', qty: 1, unit: '盒', price: 22.00, total: 22.00, dosage: '每日3次，每次1片' }
    ]},
    { personIdx: 4, hospital: '成都华西医院', doctor: '刘强', diagnosis: '慢性胃炎', total: 420.00, status: '已核销', date: '2026-05-10', pharmacy: 'PH002', verifyTime: '2026-05-11', items: [
      { code: 'D009', name: '奥美拉唑肠溶胶囊', spec: '20mg*14粒', qty: 3, unit: '盒', price: 36.00, total: 108.00, dosage: '每日1次，每次1粒' },
      { code: 'D010', name: '铝碳酸镁片', spec: '0.5g*30片', qty: 2, unit: '盒', price: 25.00, total: 50.00, dosage: '每日3次，每次1-2片' }
    ]},
    { personIdx: 5, hospital: '杭州浙一医院', doctor: '赵敏', diagnosis: '甲状腺功能减退', total: 310.00, status: '已核销', date: '2026-05-08', pharmacy: 'PH003', verifyTime: '2026-05-09', items: [
      { code: 'D011', name: '左甲状腺素钠片', spec: '50μg*100片', qty: 1, unit: '盒', price: 58.00, total: 58.00, dosage: '每日1次，空腹服用' }
    ]},
  ];
  
  rxData.forEach(rx => {
    const pid = uuidv4();
    const reimb = +(rx.total * 0.7).toFixed(2);
    const self = +(rx.total - reimb).toFixed(2);
    insertPrescription.run(pid, personIds[rx.personIdx], rx.hospital, rx.doctor, rx.diagnosis, rx.total, reimb, self, rx.status, rx.date, rx.pharmacy, rx.verifyTime);
    rx.items.forEach(item => {
      insertItem.run(uuidv4(), pid, item.code, item.name, item.spec, item.qty, item.unit, item.price, item.total, item.dosage);
    });
  });
  
  console.log('已初始化处方数据');
  
  const insertSettlement = db.prepare(`
    INSERT OR IGNORE INTO settlement_records 
    (id, insured_person_id, settlement_type, hospital_name, total_amount, insurance_pay, individual_pay, account_pay, province_code, is_cross_province, settlement_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const sTypes = ['普通门诊', '门诊慢特病', '住院', '药店购药'];
  const sHospitals = ['北京协和医院', '上海瑞金医院', '广州中山医院', '深圳人民医院', '成都华西医院', '杭州浙一医院', '南京鼓楼医院', '武汉同济医院'];
  const sProvinces = ['110000', '310000', '440100', '440300', '510100', '330100', '320100', '420100'];
  
  for (let i = 0; i < 30; i++) {
    const sid = uuidv4();
    const total = Math.floor(Math.random() * 5000) + 200;
    const sType = sTypes[i % sTypes.length];
    const insPay = sType === '门诊慢特病' ? +(total * 0.6).toFixed(2) : +(total * 0.7).toFixed(2);
    const indPay = sType === '门诊慢特病' ? +(total * 0.3).toFixed(2) : +(total * 0.2).toFixed(2);
    const accPay = +(total - insPay - indPay).toFixed(2);
    const isCross = i % 6 === 0 ? 1 : 0;
    const sDate = '2026-05-' + String(Math.max(1, 28 - i)).padStart(2, '0');
    insertSettlement.run(sid, personIds[i % personIds.length], sType, sHospitals[i % sHospitals.length], total, insPay, indPay, accPay, sProvinces[i % sProvinces.length], isCross, sDate);
  }
  
  console.log('已初始化结算记录数据');
  
  const insertOffsite = db.prepare(`
    INSERT OR IGNORE INTO offsite_records 
    (id, insured_person_id, record_type, from_area, to_area, start_date, end_date, reason, status, auditor, audit_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const offsiteData = [
    { personIdx: 0, record_type: '异地就医备案', from_area: '北京市', to_area: '上海市', reason: '因工作调动需在上海市就医', status: '已通过', auditor: '审核员A' },
    { personIdx: 1, record_type: '转诊转院', from_area: '上海市', to_area: '北京市', reason: '疑难杂症需转至北京协和医院治疗', status: '待审核', auditor: null },
    { personIdx: 2, record_type: '异地安置', from_area: '广东省广州市', to_area: '四川省成都市', reason: '退休后随子女在成都居住', status: '已通过', auditor: '审核员B' },
    { personIdx: 3, record_type: '异地就医备案', from_area: '广东省深圳市', to_area: '浙江省杭州市', reason: '长期出差需在杭州就医', status: '已通过', auditor: '审核员A' },
    { personIdx: 4, record_type: '转诊转院', from_area: '四川省成都市', to_area: '北京市', reason: '肿瘤专科治疗需要', status: '已驳回', auditor: '审核员C' },
  ];
  
  const today = new Date().toISOString().slice(0, 10);
  const endDt = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
  offsiteData.forEach(od => {
    const oid = uuidv4();
    const auditTime = od.status === '待审核' ? null : '2026-05-20';
    insertOffsite.run(oid, personIds[od.personIdx], od.record_type, od.from_area, od.to_area, today, endDt, od.reason, od.status, od.auditor, auditTime, '2026-05-18');
  });
  
  console.log('已初始化异地就医备案数据');
  
  const insertTransfer = db.prepare(`
    INSERT OR IGNORE INTO transfer_continuation 
    (id, insured_person_id, from_area, to_area, status, application_date, completion_date, transfer_amount, current_step, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transferData = [
    { personIdx: 0, from: '北京市', to: '上海市', status: '已完成', amount: 3200.00, step: '已完成', remarks: '医保关系已成功转移' },
    { personIdx: 6, from: '江苏省南京市', to: '浙江省杭州市', status: '转入地处理', amount: 1500.00, step: '转入地审核中', remarks: '转出地已确认' },
    { personIdx: 8, from: '湖北省武汉市', to: '重庆市', status: '转出地处理', amount: 5800.00, step: '转出地审核中', remarks: '等待转出地确认' },
  ];
  
  transferData.forEach(td => {
    const tid = uuidv4();
    const compDate = td.status === '已完成' ? '2026-05-15' : null;
    insertTransfer.run(tid, personIds[td.personIdx], td.from, td.to, td.status, '2026-05-10', compDate, td.amount, td.step, td.remarks);
  });
  
  console.log('已初始化转移接续数据');
  
  const insertAlert = db.prepare(`
    INSERT OR IGNORE INTO abnormal_behavior_alerts 
    (id, insured_person_id, alert_type, alert_level, description, detect_time, status, handler, handle_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const alertsData = [
    { personIdx: 0, type: '高频购药', level: '高', desc: '30天内在药店购药12次，远超正常频次（阈值5次），涉嫌利用医保卡套取药品', status: '待处理', handler: null, handleTime: null },
    { personIdx: 2, type: '超量购药', level: '高', desc: '单次处方购药量超出常规用量3倍以上，已触发超量预警', status: '处理中', handler: '稽核员A', handleTime: null },
    { personIdx: 3, type: '异地异常', level: '中', desc: '3天内在3个不同省份产生结算记录，存在异地异常就医嫌疑', status: '待处理', handler: null, handleTime: null },
    { personIdx: 5, type: '重复就诊', level: '中', desc: '同一诊断7天内在3家不同医院重复就诊，需核实是否合理', status: '已排除', handler: '稽核员B', handleTime: '2026-05-20' },
    { personIdx: 7, type: '高频购药', level: '低', desc: '60天内购药8次，需关注用药合理性', status: '已处罚', handler: '稽核员A', handleTime: '2026-05-22' },
  ];
  
  alertsData.forEach(ad => {
    const aid = uuidv4();
    insertAlert.run(aid, personIds[ad.personIdx], ad.type, ad.level, ad.desc, '2026-05-25', ad.status, ad.handler, ad.handleTime);
  });
  
  console.log('已初始化异常行为预警数据');
  
  const insertVerification = db.prepare(`
    INSERT OR IGNORE INTO qualification_verifications 
    (id, insured_person_id, verify_type, verify_time, result, verifier, similarity_score, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const verifData = [
    { personIdx: 0, type: '远程视频', result: '通过', verifier: '核验员A', score: 96.5, remarks: '远程视频核验通过，身份确认' },
    { personIdx: 1, type: '人脸识别', result: '通过', verifier: '系统自动', score: 92.3, remarks: '人脸识别相似度92.3%，核验通过' },
    { personIdx: 2, type: '生物特征', result: '待核验', verifier: null, score: 78.1, remarks: '相似度偏低，需人工复核' },
    { personIdx: 4, type: '远程视频', result: '未通过', verifier: '核验员B', score: 45.2, remarks: '远程视频核验未通过，身份存疑' },
    { personIdx: 6, type: '人脸识别', result: '通过', verifier: '系统自动', score: 89.8, remarks: '人脸识别通过' },
  ];
  
  verifData.forEach(vd => {
    const vid = uuidv4();
    insertVerification.run(vid, personIds[vd.personIdx], vd.type, '2026-05-27', vd.result, vd.verifier, vd.score, vd.remarks);
  });
  
  console.log('已初始化资格认证数据');
  
  const insertFamily = db.prepare(`
    INSERT OR IGNORE INTO family_accounts 
    (id, main_insured_id, family_member_id, relation, auth_status, auth_date, cancel_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const familyData = [
    { main: 0, member: 1, relation: '配偶', status: '已授权' },
    { main: 0, member: 9, relation: '子女', status: '已授权' },
    { main: 2, member: 3, relation: '配偶', status: '已授权' },
    { main: 5, member: 6, relation: '配偶', status: '已取消' },
  ];
  
  familyData.forEach(fd => {
    const fid = uuidv4();
    const cancelDate = fd.status === '已取消' ? '2026-05-10' : null;
    insertFamily.run(fid, personIds[fd.main], personIds[fd.member], fd.relation, fd.status, '2026-04-01', cancelDate);
  });
  
  console.log('已初始化家庭共济数据');
  
  const insertInstitution = db.prepare(`
    INSERT OR IGNORE INTO medical_institutions 
    (id, name, type, level, address, contact, is_pointed, inspection_status, last_inspection_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const instData = [
    { name: '北京协和医院', type: '医院', level: '三级甲等', address: '北京市东城区王府井帅府园1号', contact: '010-69156114', pointed: 1, insp: '正常', lastInsp: '2026-04-15' },
    { name: '上海瑞金医院', type: '医院', level: '三级甲等', address: '上海市黄浦区瑞金二路197号', contact: '021-64370045', pointed: 1, insp: '正常', lastInsp: '2026-04-20' },
    { name: '广州中山医院', type: '医院', level: '三级甲等', address: '广州市越秀区中山二路58号', contact: '020-87755766', pointed: 1, insp: '待巡检', lastInsp: '2025-12-01' },
    { name: '深圳人民医院', type: '医院', level: '三级甲等', address: '深圳市罗湖区东门北路1017号', contact: '0755-25533018', pointed: 1, insp: '正常', lastInsp: '2026-03-10' },
    { name: '成都华西医院', type: '医院', level: '三级甲等', address: '成都市武侯区国学巷37号', contact: '028-85421473', pointed: 1, insp: '整改中', lastInsp: '2026-02-28' },
    { name: '杭州浙一医院', type: '医院', level: '三级甲等', address: '杭州市上城区庆春路79号', contact: '0571-87236666', pointed: 1, insp: '正常', lastInsp: '2026-04-05' },
    { name: '北京同仁堂大药房', type: '药店', level: '', address: '北京市东城区东安门大街23号', contact: '010-65133888', pointed: 1, insp: '正常', lastInsp: '2026-05-01' },
    { name: '上海华氏大药房', type: '药店', level: '', address: '上海市黄浦区南京东路123号', contact: '021-63221234', pointed: 1, insp: '正常', lastInsp: '2026-04-25' },
    { name: '广州大参林药房', type: '药店', level: '', address: '广州市天河区天河路200号', contact: '020-38888888', pointed: 1, insp: '待巡检', lastInsp: null },
    { name: '社区健康诊所', type: '诊所', level: '一级', address: '深圳市南山区科技园路社区', contact: '0755-26000000', pointed: 0, insp: '已取消', lastInsp: null },
  ];
  
  instData.forEach(inst => {
    const iid = uuidv4();
    insertInstitution.run(iid, inst.name, inst.type, inst.level, inst.address, inst.contact, inst.pointed, inst.insp, inst.lastInsp);
  });
  
  console.log('已初始化定点医药机构数据');
  
  const insertPolicy = db.prepare(`
    INSERT OR IGNORE INTO policy_knowledge 
    (id, title, category, content, keywords, effective_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const policies = [
    { title: '关于统一城乡居民基本医疗保险制度的意见', category: '政策法规', keywords: '城乡居民,医保,统一制度', content: '为贯彻落实党中央、国务院关于深化医药卫生体制改革的决策部署，加快建立统一的城乡居民基本医疗保险制度，现提出如下意见：\n\n一、总体要求\n坚持全覆盖、保基本、多层次、可持续的方针，遵循以人为本、公平适度、稳健持续的原则，完善统一的城乡居民基本医疗保险制度。\n\n二、整合制度政策\n统一覆盖范围，城乡居民医保制度覆盖除职工医保应参保人员以外的其他城乡居民。统一筹资政策，坚持多渠道筹资，继续实行个人缴费与政府补助相结合为主的筹资方式。统一保障待遇，遵循保障适度、收支平衡的原则，均衡城乡保障待遇，逐步统一保障范围和支付标准。', effective_date: '2024-01-01', status: '生效中' },
    { title: '门诊慢特病跨省直接结算操作指南', category: '操作指南', keywords: '门诊慢特病,跨省结算,直接结算', content: '为保障参保人员异地就医权益，规范门诊慢特病跨省直接结算管理，特制定本指南：\n\n一、适用范围\n适用于职工医保和居民医保参保人员，在参保地按规定办理异地就医备案后，在备案地定点医疗机构发生的门诊慢特病医疗费用直接结算。\n\n二、病种范围\n高血压、糖尿病、恶性肿瘤门诊治疗、尿毒症透析、器官移植术后抗排异治疗等5种门诊慢特病。\n\n三、结算流程\n1. 参保人员持医保电子凭证或社保卡就医\n2. 定点医疗机构按照就医地规定提供医疗服务\n3. 医疗费用通过国家医保信息平台实时结算', effective_date: '2024-03-01', status: '生效中' },
    { title: '医保电子凭证使用管理办法', category: '管理办法', keywords: '电子凭证,使用管理,医保码', content: '为规范医保电子凭证使用管理，保障参保人员信息安全和资金安全，根据相关法律法规，制定本办法：\n\n一、医保电子凭证的定义\n医保电子凭证是全国统一的医保信息平台为参保人员签发的身份凭证，是参保人员办理医保业务的唯一电子身份标识。\n\n二、申领与激活\n参保人员可通过国家医保APP、微信、支付宝等渠道申领医保电子凭证。申领时需进行实名认证和生物特征核验。\n\n三、使用范围\n医保电子凭证可用于挂号、就医、结算、购药等医保业务场景，支持跨区域使用。', effective_date: '2024-02-01', status: '生效中' },
    { title: '家庭共济账户使用说明', category: '操作指南', keywords: '家庭共济,账户共享,医保账户', content: '为进一步健全互助共济、责任共担的职工基本医疗保险制度，更好解决职工医保参保人员门诊保障问题，建立家庭共济账户：\n\n一、账户设立\n职工医保参保人员可设立家庭共济账户，将本人个人账户资金授权给家庭成员使用。\n\n二、授权范围\n授权对象限于配偶、子女、父母。每个参保人员最多可授权5名家庭成员。\n\n三、使用规则\n1. 被授权人须为本省基本医疗保险参保人员\n2. 资金使用范围限于就医购药等符合规定的医疗费用\n3. 授权人可随时调整授权范围或取消授权', effective_date: '2024-04-01', status: '生效中' },
    { title: '关于加强医保基金监管的意见', category: '政策法规', keywords: '基金监管,欺诈骗保,智能监控', content: '为加强医疗保障基金监管，坚决打击欺诈骗保行为，保障基金安全，提出如下意见：\n\n一、完善监管机制\n建立完善医保基金监管体系，推动形成政府监管、社会监督、行业自律、个人守信相结合的监管格局。\n\n二、智能监控\n运用大数据、人工智能等技术手段，对医保基金使用行为进行实时监控和分析预警，重点监控高频就医、重复购药、过度诊疗等异常行为。\n\n三、违规处罚\n对欺诈骗保行为依法依规从严从重处罚，涉嫌犯罪的移送司法机关处理。建立信用评价体系，实施守信激励和失信惩戒。', effective_date: '2024-05-01', status: '生效中' },
    { title: '异地就医直接结算经办规程', category: '操作指南', keywords: '异地就医,直接结算,经办流程', content: '为规范异地就医直接结算经办管理，提升服务水平，制定本规程：\n\n一、备案管理\n参保人员跨省异地就医前，应到参保地经办机构办理备案登记。备案有效期原则上不少于6个月。\n\n二、就医管理\n备案人员应在就医地定点医疗机构就医，遵循就医地医疗服务规范。\n\n三、结算管理\n1. 住院费用直接结算：执行就医地支付范围及标准\n2. 门诊费用直接结算：逐步扩大试点范围\n3. 药店购药直接结算：支持医保电子凭证扫码结算', effective_date: '2024-06-01', status: '生效中' },
  ];
  
  policies.forEach(policy => {
    const pid = uuidv4();
    insertPolicy.run(pid, policy.title, policy.category, policy.content, policy.keywords, policy.effective_date, policy.status);
  });
  
  console.log('已初始化政策知识库数据');
  
  const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO insured_profiles 
    (id, insured_person_id, tags, chronic_disease_risk, visit_frequency, average_cost, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const profileData = [
    { personIdx: 0, tags: '高血压,慢性病,老年', risk: 0.72, freq: '每月2-3次', avgCost: 850.00 },
    { personIdx: 1, tags: '糖尿病,慢性病', risk: 0.65, freq: '每月1-2次', avgCost: 620.00 },
    { personIdx: 2, tags: '冠心病,慢性病,重点关注', risk: 0.88, freq: '每月3-4次', avgCost: 1200.00 },
    { personIdx: 3, tags: '呼吸道疾病', risk: 0.35, freq: '每季度1次', avgCost: 280.00 },
    { personIdx: 4, tags: '慢性胃炎', risk: 0.45, freq: '每月1次', avgCost: 420.00 },
  ];
  
  profileData.forEach(pd => {
    const prid = uuidv4();
    insertProfile.run(prid, personIds[pd.personIdx], pd.tags, pd.risk, pd.freq, pd.avgCost, '2026-05-30');
  });
  
  console.log('已初始化参保人画像数据');
  
  console.log('✅ 演示数据初始化完成！');
}

module.exports = { seedData };
