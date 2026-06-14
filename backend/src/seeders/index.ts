import bcrypt from 'bcryptjs';
import db from '../database.js';
import { generateRequestNo } from '../utils/common.js';

const runSeeder = () => {
  console.log('开始初始化数据...');

  const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (adminExists) {
    console.log('数据已初始化，跳过...');
    return;
  }

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, real_name, phone, id_card, role, address) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const adminPassword = bcrypt.hashSync('admin123456', 10);
  const adminResult = insertUser.run(
    'admin',
    adminPassword,
    '系统管理员',
    '13900139000',
    '320400199001010001',
    'admin',
    '常州市新北区'
  );

  const userPassword = bcrypt.hashSync('123456', 10);
  const userResult = insertUser.run(
    'testuser',
    userPassword,
    '测试用户',
    '13800138000',
    '320400199202020002',
    'user',
    '常州市天宁区'
  );

  console.log('用户数据初始化完成');

  const insertCategory = db.prepare(
    'INSERT INTO service_categories (name, code, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)'
  );

  const category1 = insertCategory.run('政务服务', 'government', '🏛️', '提供各类政府办事服务', 1);
  const category2 = insertCategory.run('民生服务', 'people', '👥', '提供日常生活便民服务', 2);
  const category3 = insertCategory.run('社区服务', 'community', '🏘️', '提供社区相关服务', 3);

  console.log('服务分类初始化完成');

  const insertService = db.prepare(
    `INSERT INTO services 
     (category_id, name, code, description, handling_time, handling_place, required_materials, handling_process, fee_standard, sort_order) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const services = [
    { category_id: category1.lastInsertRowid, name: '身份证办理', code: 'id_card', description: '居民身份证申领、换领、补领', handling_time: '7个工作日', handling_place: '常州市各派出所户籍窗口', required_materials: JSON.stringify(['户口簿', '近期免冠照片', '申请表']), handling_process: JSON.stringify(['预约取号', '提交材料', '信息采集', '缴费', '领取凭证']), fee_standard: JSON.stringify([{ item: '申领', fee: 20 }, { item: '换领', fee: 20 }, { item: '补领', fee: 40 }]), sort_order: 1 },
    { category_id: category1.lastInsertRowid, name: '社保查询', code: 'social_security', description: '个人社会保险信息查询', handling_time: '即时办理', handling_place: '常州市政务服务中心', required_materials: JSON.stringify(['身份证']), handling_process: JSON.stringify(['身份验证', '查询信息', '打印结果']), fee_standard: JSON.stringify([{ item: '查询', fee: 0 }]), sort_order: 2 },
    { category_id: category1.lastInsertRowid, name: '公积金提取', code: 'provident_fund', description: '住房公积金提取申请', handling_time: '3个工作日', handling_place: '常州市住房公积金管理中心', required_materials: JSON.stringify(['身份证', '公积金卡', '购房合同或租房合同']), handling_process: JSON.stringify(['提交申请', '材料审核', '资金审批', '款项到账']), fee_standard: JSON.stringify([{ item: '提取', fee: 0 }]), sort_order: 3 },
    { category_id: category1.lastInsertRowid, name: '营业执照办理', code: 'business_license', description: '工商营业执照注册登记', handling_time: '5个工作日', handling_place: '常州市市场监督管理局', required_materials: JSON.stringify(['身份证', '名称预先核准通知书', '公司章程', '住所证明']), handling_process: JSON.stringify(['名称核准', '提交材料', '审查核准', '领取执照']), fee_standard: JSON.stringify([{ item: '注册登记', fee: 0 }]), sort_order: 4 },
    { category_id: category1.lastInsertRowid, name: '税务登记', code: 'tax_registration', description: '税务登记及发票申领', handling_time: '3个工作日', handling_place: '常州市税务局', required_materials: JSON.stringify(['营业执照', '身份证', '公司章程']), handling_process: JSON.stringify(['提交资料', '税种核定', '发票申领', '税控设备发行']), fee_standard: JSON.stringify([{ item: '登记', fee: 0 }]), sort_order: 5 },
    { category_id: category1.lastInsertRowid, name: '不动产登记', code: 'real_estate', description: '不动产权证书办理', handling_time: '10个工作日', handling_place: '常州市不动产登记中心', required_materials: JSON.stringify(['身份证', '购房合同', '完税证明', '房屋平面图']), handling_process: JSON.stringify(['申请受理', '权属审核', '登记注册', '核发证书']), fee_standard: JSON.stringify([{ item: '登记费', fee: 80 }]), sort_order: 6 },
    { category_id: category2.lastInsertRowid, name: '公交查询', code: 'bus_query', description: '公交线路及实时信息查询', handling_time: '即时办理', handling_place: '线上服务', required_materials: JSON.stringify([]), handling_process: JSON.stringify(['输入线路', '查看线路信息', '查看实时位置']), fee_standard: JSON.stringify([{ item: '查询', fee: 0 }]), sort_order: 1 },
    { category_id: category2.lastInsertRowid, name: '水电缴费', code: 'utility_payment', description: '水费、电费在线缴纳', handling_time: '即时办理', handling_place: '线上服务', required_materials: JSON.stringify(['户号']), handling_process: JSON.stringify(['输入户号', '查询账单', '在线支付']), fee_standard: JSON.stringify([{ item: '服务费', fee: 0 }]), sort_order: 2 },
    { category_id: category2.lastInsertRowid, name: '医院预约挂号', code: 'hospital_booking', description: '医院门诊预约挂号服务', handling_time: '即时办理', handling_place: '线上服务', required_materials: JSON.stringify(['身份证', '医保卡']), handling_process: JSON.stringify(['选择医院', '选择科室', '选择医生', '预约时段', '确认预约']), fee_standard: JSON.stringify([{ item: '挂号费', fee: '根据医院标准' }]), sort_order: 3 },
    { category_id: category2.lastInsertRowid, name: '教育缴费', code: 'education_payment', description: '学杂费在线缴纳', handling_time: '即时办理', handling_place: '线上服务', required_materials: JSON.stringify(['学生身份证号']), handling_process: JSON.stringify(['查询账单', '确认信息', '在线支付']), fee_standard: JSON.stringify([{ item: '服务费', fee: 0 }]), sort_order: 4 },
    { category_id: category2.lastInsertRowid, name: '交通违章查询', code: 'traffic_violation', description: '机动车交通违章查询', handling_time: '即时办理', handling_place: '线上服务', required_materials: JSON.stringify(['车牌号', '车架号']), handling_process: JSON.stringify(['输入车辆信息', '查询违章记录', '处理违章']), fee_standard: JSON.stringify([{ item: '查询', fee: 0 }]), sort_order: 5 },
    { category_id: category2.lastInsertRowid, name: '社会保障卡办理', code: 'social_security_card', description: '社保卡申领、挂失、补办', handling_time: '15个工作日', handling_place: '常州市社会保障服务中心', required_materials: JSON.stringify(['身份证', '近期免冠照片']), handling_process: JSON.stringify(['提交申请', '信息采集', '制卡', '领卡激活']), fee_standard: JSON.stringify([{ item: '新办', fee: 20 }, { item: '补办', fee: 40 }]), sort_order: 6 },
    { category_id: category3.lastInsertRowid, name: '社区报修', code: 'community_repair', description: '社区公共设施报修服务', handling_time: '24小时响应', handling_place: '所在社区居委会', required_materials: JSON.stringify(['报修内容描述', '照片']), handling_process: JSON.stringify(['提交报修', '派单处理', '上门维修', '确认完成']), fee_standard: JSON.stringify([{ item: '维修', fee: '根据情况' }]), sort_order: 1 },
    { category_id: category3.lastInsertRowid, name: '邻里互助', code: 'neighbor_help', description: '发布或接受邻里互助请求', handling_time: '即时发布', handling_place: '线上服务', required_materials: JSON.stringify(['互助内容描述', '联系方式']), handling_process: JSON.stringify(['发布信息', '接受帮助', '互助完成', '评价']), fee_standard: JSON.stringify([{ item: '发布', fee: 0 }]), sort_order: 2 },
    { category_id: category3.lastInsertRowid, name: '社区活动报名', code: 'community_activity', description: '社区文体活动报名参与', handling_time: '即时报名', handling_place: '所在社区居委会', required_materials: JSON.stringify(['身份证', '联系方式']), handling_process: JSON.stringify(['查看活动', '在线报名', '参加活动']), fee_standard: JSON.stringify([{ item: '报名', fee: '根据活动' }]), sort_order: 3 },
    { category_id: category3.lastInsertRowid, name: '养老服务', code: 'elderly_service', description: '居家养老、日间照料等服务', handling_time: '3个工作日', handling_place: '所在社区养老服务中心', required_materials: JSON.stringify(['身份证', '老年证']), handling_process: JSON.stringify(['申请服务', '评估定级', '制定方案', '提供服务']), fee_standard: JSON.stringify([{ item: '基础服务', fee: 0 }, { item: '增值服务', fee: '根据服务' }]), sort_order: 4 },
    { category_id: category3.lastInsertRowid, name: '便民服务点查询', code: 'convenience_query', description: '周边便民服务设施查询', handling_time: '即时查询', handling_place: '线上服务', required_materials: JSON.stringify([]), handling_process: JSON.stringify(['定位或输入地址', '搜索周边', '查看详情']), fee_standard: JSON.stringify([{ item: '查询', fee: 0 }]), sort_order: 5 },
    { category_id: category3.lastInsertRowid, name: '矛盾调解', code: 'dispute_mediation', description: '邻里纠纷、家庭矛盾调解', handling_time: '5个工作日', handling_place: '所在社区居委会', required_materials: JSON.stringify(['身份证', '纠纷情况说明']), handling_process: JSON.stringify(['申请调解', '情况核实', '组织调解', '达成协议']), fee_standard: JSON.stringify([{ item: '调解', fee: 0 }]), sort_order: 6 }
  ];

  const serviceIds: number[] = [];
  services.forEach(service => {
    const result = insertService.run(
      service.category_id,
      service.name,
      service.code,
      service.description,
      service.handling_time,
      service.handling_place,
      service.required_materials,
      service.handling_process,
      service.fee_standard,
      service.sort_order
    );
    serviceIds.push(result.lastInsertRowid as number);
  });

  console.log('服务数据初始化完成，共18个服务');

  const insertCertificate = db.prepare(
    'INSERT INTO certificates (user_id, cert_type, cert_no, cert_name, issuer, issue_date, expire_date, cert_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  insertCertificate.run(
    userResult.lastInsertRowid,
    'id_card',
    '320400199202020002',
    '居民身份证',
    '常州市公安局',
    '2020-01-15',
    '2040-01-15',
    JSON.stringify({ name: '测试用户', gender: '男', ethnicity: '汉', birthDate: '1992-02-02', address: '常州市天宁区' })
  );

  insertCertificate.run(
    userResult.lastInsertRowid,
    'social_security',
    'SS32040010001',
    '社会保障卡',
    '常州市人力资源和社会保障局',
    '2021-06-20',
    '2031-06-20',
    JSON.stringify({ cardNumber: 'SS32040010001', medicalInsurance: true, pensionInsurance: true })
  );

  insertCertificate.run(
    userResult.lastInsertRowid,
    'driving_license',
    '320400199202020002',
    '机动车驾驶证',
    '常州市公安局交通警察支队',
    '2015-08-10',
    '2025-08-10',
    JSON.stringify({ licenseType: 'C1', initialDate: '2015-08-10', validFor: '10年' })
  );

  console.log('证照数据初始化完成');

  const insertSceneTemplate = db.prepare(
    'INSERT INTO scene_templates (name, code, description, icon, service_ids, material_list, workflow_config, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const newHouseholdServices = [serviceIds[0], serviceIds[2], serviceIds[5]];
  const newHouseholdMaterialList = [
    { step: 1, name: '办理身份证', materials: ['户口簿', '购房合同', '近期免冠照片'] },
    { step: 2, name: '公积金提取', materials: ['身份证', '公积金卡', '购房发票'] },
    { step: 3, name: '不动产登记', materials: ['身份证', '购房合同', '完税证明', '房屋平面图'] }
  ];
  const newHouseholdWorkflow = {
    steps: [
      { step: 1, name: '户籍迁移', description: '将户口迁至新房产所在地', required: true, estimated_days: 7 },
      { step: 2, name: '公积金提取', description: '提取住房公积金用于购房', required: true, estimated_days: 3 },
      { step: 3, name: '不动产登记', description: '办理不动产权证书', required: true, estimated_days: 10 }
    ],
    total_estimated_days: 20,
    notes: '请按步骤依次办理，前一步完成后才能进行下一步'
  };

  const elderlyCareServices = [serviceIds[15], serviceIds[13]];
  const elderlyCareMaterialList = [
    { step: 1, name: '信息采集', materials: ['身份证', '老年证', '健康体检报告'] },
    { step: 2, name: '能力评估', materials: ['身份证', '既往病史资料'] },
    { step: 3, name: '服务签约', materials: ['身份证', '户口本', '监护人身份证'] }
  ];
  const elderlyCareWorkflow = {
    steps: [
      { step: 1, name: '信息登记', description: '老年人基本信息采集录入', required: true, estimated_days: 1 },
      { step: 2, name: '能力评估', description: '生活自理能力等级评估', required: true, estimated_days: 3 },
      { step: 3, name: '服务定制', description: '根据评估结果制定服务方案', required: true, estimated_days: 2 }
    ],
    total_estimated_days: 6,
    notes: '评估等级分为：自理、半失能、失能三个等级'
  };

  const businessStartupServices = [serviceIds[3], serviceIds[4], serviceIds[1]];
  const businessStartupMaterialList = [
    { step: 1, name: '企业注册', materials: ['身份证', '公司章程', '住所证明', '名称核准通知书'] },
    { step: 2, name: '税务登记', materials: ['营业执照', '身份证', '公司章程'] },
    { step: 3, name: '社保开户', materials: ['营业执照', '税务登记证', '法人身份证', '员工名单'] }
  ];
  const businessStartupWorkflow = {
    steps: [
      { step: 1, name: '工商注册', description: '办理营业执照及企业公章', required: true, estimated_days: 5 },
      { step: 2, name: '税务登记', description: '税务信息登记及税种核定', required: true, estimated_days: 3 },
      { step: 3, name: '社保开户', description: '企业社保账户开立及员工参保', required: true, estimated_days: 3 }
    ],
    total_estimated_days: 11,
    notes: '三证合一后，工商注册完成后自动获取统一社会信用代码'
  };

  const scene1 = insertSceneTemplate.run(
    '新生儿出生一件事',
    'new_birth',
    '一站式办理新生儿出生相关的医学证明、户口登记、社保参保等事项',
    '👶',
    JSON.stringify([serviceIds[0], serviceIds[5]]),
    JSON.stringify([
      { step: 1, name: '出生医学证明', materials: ['父母身份证', '结婚证', '准生证'] },
      { step: 2, name: '户口登记', materials: ['出生医学证明', '父母身份证', '户口簿', '结婚证'] },
      { step: 3, name: '社保参保', materials: ['出生医学证明', '户口簿', '父母身份证'] }
    ]),
    JSON.stringify({
      steps: [
        { step: 1, name: '出生医学证明', description: '在出生医院办理《出生医学证明》', required: true, estimated_days: 1 },
        { step: 2, name: '户口登记', description: '到派出所办理新生儿户口登记', required: true, estimated_days: 1 },
        { step: 3, name: '医保参保', description: '办理新生儿城乡居民医疗保险', required: true, estimated_days: 1 }
      ],
      total_estimated_days: 3,
      notes: '建议在新生儿出生后1个月内办理'
    }),
    1
  );

  const scene2 = insertSceneTemplate.run(
    '公民入伍一件事',
    'military_enlistment',
    '一站式办理公民入伍相关的政审、户籍注销、社保暂停等事项',
    '🎖️',
    JSON.stringify([serviceIds[0], serviceIds[1]]),
    JSON.stringify([
      { step: 1, name: '政治审查', materials: ['身份证', '户口簿', '学历证明'] },
      { step: 2, name: '户籍注销', materials: ['入伍通知书', '身份证', '户口簿'] },
      { step: 3, name: '社保暂停', materials: ['入伍通知书', '身份证', '社保卡'] }
    ]),
    JSON.stringify({
      steps: [
        { step: 1, name: '政治审查', description: '完成入伍前政治审查', required: true, estimated_days: 7 },
        { step: 2, name: '户籍注销', description: '到派出所办理户口注销', required: true, estimated_days: 1 },
        { step: 3, name: '社保关系处理', description: '办理社会保险关系暂停', required: true, estimated_days: 1 }
      ],
      total_estimated_days: 9,
      notes: '入伍后可保留户籍，退役后恢复'
    }),
    2
  );

  const scene3 = insertSceneTemplate.run(
    '企业职工退休一件事',
    'retirement',
    '一站式办理企业职工退休相关的待遇核算、证件办理、待遇发放等事项',
    '🌅',
    JSON.stringify([serviceIds[1], serviceIds[2]]),
    JSON.stringify([
      { step: 1, name: '退休申请', materials: ['身份证', '户口簿', '人事档案', '养老保险手册'] },
      { step: 2, name: '待遇核算', materials: ['身份证', '退休申请表', '历年缴费明细'] },
      { step: 3, name: '待遇发放', materials: ['身份证', '银行卡', '退休审批表'] }
    ]),
    JSON.stringify({
      steps: [
        { step: 1, name: '退休申请', description: '向社保部门提交退休申请', required: true, estimated_days: 1 },
        { step: 2, name: '待遇核算', description: '养老保险待遇核算审批', required: true, estimated_days: 10 },
        { step: 3, name: '待遇发放', description: '养老金按月发放至指定账户', required: true, estimated_days: 1 }
      ],
      total_estimated_days: 12,
      notes: '建议在达到法定退休年龄前1个月提交申请'
    }),
    3
  );

  console.log('场景模板初始化完成，共3个模板');

  const regions = [
    { code: '320402', name: '天宁区', lat: 31.7701, lng: 119.9741 },
    { code: '320404', name: '钟楼区', lat: 31.7708, lng: 119.9478 },
    { code: '320405', name: '戚墅堰区', lat: 31.7516, lng: 120.0397 },
    { code: '320411', name: '新北区', lat: 31.8245, lng: 119.9589 },
    { code: '320412', name: '武进区', lat: 31.7167, lng: 119.9500 },
    { code: '320482', name: '金坛区', lat: 31.7267, lng: 119.5925 }
  ];

  console.log('常州区域数据准备完成，共6个区域');

  const insertBusRoute = db.prepare(
    'INSERT INTO bus_routes (route_no, route_name, start_station, end_station, first_bus_time, last_bus_time, ticket_price, stations) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const stations1 = [
    { name: '常州北站', latitude: 31.8245, longitude: 119.9589 },
    { name: '新北区政府', latitude: 31.8156, longitude: 119.9523 },
    { name: '恐龙园', latitude: 31.8012, longitude: 119.9687 },
    { name: '常州市政府', latitude: 31.7923, longitude: 119.9701 },
    { name: '市民广场', latitude: 31.7834, longitude: 119.9756 },
    { name: '红梅公园', latitude: 31.7767, longitude: 119.9823 },
    { name: '天宁寺', latitude: 31.7701, longitude: 119.9878 },
    { name: '文化宫', latitude: 31.7654, longitude: 119.9741 },
    { name: '南大街', latitude: 31.7612, longitude: 119.9654 },
    { name: '常州站', latitude: 31.7589, longitude: 119.9578 }
  ];

  const stations2 = [
    { name: '淹城春秋乐园', latitude: 31.7167, longitude: 119.9300 },
    { name: '武进区政府', latitude: 31.7234, longitude: 119.9400 },
    { name: '花园街', latitude: 31.7356, longitude: 119.9500 },
    { name: '湖塘', latitude: 31.7467, longitude: 119.9550 },
    { name: '兰陵', latitude: 31.7578, longitude: 119.9600 },
    { name: '同济桥', latitude: 31.7645, longitude: 119.9680 },
    { name: '文化宫', latitude: 31.7654, longitude: 119.9741 },
    { name: '火车站', latitude: 31.7589, longitude: 119.9578 }
  ];

  const stations3 = [
    { name: '钟楼区政府', latitude: 31.7708, longitude: 119.9200 },
    { name: '青枫公园', latitude: 31.7756, longitude: 119.9300 },
    { name: '五星', latitude: 31.7789, longitude: 119.9400 },
    { name: '勤业', latitude: 31.7723, longitude: 119.9500 },
    { name: '怀德桥', latitude: 31.7678, longitude: 119.9578 },
    { name: '南大街', latitude: 31.7612, longitude: 119.9654 },
    { name: '文化宫', latitude: 31.7654, longitude: 119.9741 },
    { name: '红梅公园', latitude: 31.7767, longitude: 119.9823 },
    { name: '东坡公园', latitude: 31.7701, longitude: 119.9950 }
  ];

  const stations4 = [
    { name: '金坛汽车站', latitude: 31.7267, longitude: 119.5925 },
    { name: '金坛区政府', latitude: 31.7300, longitude: 119.6000 },
    { name: '华罗庚公园', latitude: 31.7350, longitude: 119.6100 },
    { name: '东方盐湖城', latitude: 31.7450, longitude: 119.5800 },
    { name: '茅山风景区', latitude: 31.7550, longitude: 119.5600 }
  ];

  const bus1 = insertBusRoute.run('B1', 'B1路快速公交', '常州北站', '常州站', '06:00', '22:00', 1.00, JSON.stringify(stations1));
  const bus2 = insertBusRoute.run('14', '14路', '淹城春秋乐园', '火车站', '05:30', '21:30', 2.00, JSON.stringify(stations2));
  const bus3 = insertBusRoute.run('Y1', 'Y1路旅游专线', '钟楼区政府', '东坡公园', '07:00', '18:00', 2.00, JSON.stringify(stations3));
  const bus4 = insertBusRoute.run('金坛101', '金坛101路', '金坛汽车站', '茅山风景区', '06:30', '20:00', 3.00, JSON.stringify(stations4));

  console.log('公交线路初始化完成，共4条线路');

  const insertBusRealtime = db.prepare(
    'INSERT INTO bus_realtime (route_id, plate_no, current_station, next_station, latitude, longitude, passenger_count, speed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  insertBusRealtime.run(bus1.lastInsertRowid, '苏D-00001', 3, 4, stations1[3].latitude, stations1[3].longitude, 35, 45);
  insertBusRealtime.run(bus1.lastInsertRowid, '苏D-00002', 6, 7, stations1[6].latitude, stations1[6].longitude, 28, 50);
  insertBusRealtime.run(bus2.lastInsertRowid, '苏D-00101', 2, 3, stations2[2].latitude, stations2[2].longitude, 42, 38);
  insertBusRealtime.run(bus3.lastInsertRowid, '苏D-00201', 4, 5, stations3[4].latitude, stations3[4].longitude, 18, 42);
  insertBusRealtime.run(bus4.lastInsertRowid, '苏D-00301', 1, 2, stations4[1].latitude, stations4[1].longitude, 22, 55);

  console.log('公交实时数据初始化完成');

  const insertVenue = db.prepare(
    'INSERT INTO venues (name, type, address, description, open_time, close_time, capacity, latitude, longitude, contact_phone, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const venues = [
    { name: '常州市图书馆', type: 'library', address: '常州市新北区锦绣路2号', description: '国家一级图书馆，藏书丰富，环境优雅', open_time: '09:00', close_time: '21:00', capacity: 1000, lat: 31.7834, lng: 119.9756, phone: '0519-85685000', facilities: JSON.stringify(['免费WiFi', '自习室', '电子阅览室', '咖啡厅', '电梯']) },
    { name: '常州博物馆', type: 'museum', address: '常州市新北区龙城大道1288号', description: '综合性博物馆，展示常州历史文化', open_time: '09:00', close_time: '17:00', capacity: 800, lat: 31.7900, lng: 119.9720, phone: '0519-85165080', facilities: JSON.stringify(['免费WiFi', '讲解服务', '无障碍设施', '存包处']) },
    { name: '常州奥体中心', type: 'stadium', address: '常州市新北区晋陵北路11号', description: '大型综合性体育场馆，可举办各类赛事', open_time: '06:00', close_time: '22:00', capacity: 38000, lat: 31.7950, lng: 119.9680, phone: '0519-89886888', facilities: JSON.stringify(['游泳馆', '羽毛球馆', '乒乓球馆', '健身房', '停车场']) },
    { name: '恐龙园', type: 'park', address: '常州市新北区汉江路1号', description: '国家5A级旅游景区，全球最大恐龙主题公园', open_time: '09:00', close_time: '17:30', capacity: 50000, lat: 31.8012, lng: 119.9687, phone: '400-616-6600', facilities: JSON.stringify(['游乐设施', '餐饮服务', '纪念品商店', '医疗站', '停车场']) },
    { name: '春秋淹城', type: 'park', address: '常州市武进区武宜中路197号', description: '国家5A级旅游景区，春秋文化主题公园', open_time: '09:00', close_time: '17:30', capacity: 40000, lat: 31.7167, lng: 119.9300, phone: '0519-86319999', facilities: JSON.stringify(['游乐设施', '演出表演', '餐饮服务', '停车场', '免费WiFi']) },
    { name: '天目湖旅游度假区', type: 'park', address: '常州市溧阳市天目湖镇', description: '国家5A级旅游景区，山水秀美', open_time: '08:00', close_time: '17:00', capacity: 30000, lat: 31.3333, lng: 119.4500, phone: '400-188-8588', facilities: JSON.stringify(['游船', '温泉', '酒店', '餐饮', '停车场']) },
    { name: '常州市市民广场', type: 'square', address: '常州市新北区龙城大道', description: '市民休闲娱乐的大型公共活动空间', open_time: '00:00', close_time: '23:59', capacity: 20000, lat: 31.7834, lng: 119.9756, phone: '0519-12345', facilities: JSON.stringify(['健身设施', '儿童乐园', '音乐喷泉', '座椅', '公共厕所']) },
    { name: '青枫公园', type: 'park', address: '常州市钟楼区星港路', description: '大型城市公园，环境优美', open_time: '06:00', close_time: '22:00', capacity: 15000, lat: 31.7756, lng: 119.9300, phone: '0519-83276188', facilities: JSON.stringify(['健身步道', '儿童游乐区', '茶室', '游船', '免费WiFi']) }
  ];

  const venueIds: number[] = [];
  venues.forEach(venue => {
    const result = insertVenue.run(
      venue.name,
      venue.type,
      venue.address,
      venue.description,
      venue.open_time,
      venue.close_time,
      venue.capacity,
      venue.lat,
      venue.lng,
      venue.phone,
      venue.facilities
    );
    venueIds.push(result.lastInsertRowid as number);
  });

  console.log('场馆数据初始化完成，共8个场馆');

  const insertApplication = db.prepare(
    'INSERT INTO service_applications (request_no, user_id, service_id, application_data, status, current_step, total_steps, submit_time, accept_time, complete_time, rating, comment, certificate_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const submitTime = new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000);
    const acceptTime = new Date(submitTime.getTime() + 1 * 24 * 60 * 60 * 1000);
    const completeTime = new Date(acceptTime.getTime() + 2 * 24 * 60 * 60 * 1000);

    const status = i < 3 ? 'completed' : (i === 3 ? 'processing' : 'pending');
    const currentStep = i < 3 ? 3 : (i === 3 ? 1 : 0);

    insertApplication.run(
      generateRequestNo('BJ'),
      userResult.lastInsertRowid,
      serviceIds[i % 6],
      JSON.stringify({ name: '测试用户', phone: '13800138000', address: '常州市天宁区' }),
      status,
      currentStep,
      3,
      submitTime.toISOString(),
      status !== 'pending' ? acceptTime.toISOString() : null,
      status === 'completed' ? completeTime.toISOString() : null,
      status === 'completed' ? 5 - i : null,
      status === 'completed' ? '服务态度很好，办理效率高' : null,
      JSON.stringify([1, 2])
    );
  }

  console.log('办件模拟数据初始化完成，共5条记录');

  const insertHeatmap = db.prepare(
    'INSERT INTO service_heatmap (service_id, region_code, region_name, request_count, latitude, longitude, stat_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const today = new Date().toISOString().split('T')[0];
  regions.forEach((region, regionIndex) => {
    serviceIds.forEach((serviceId, serviceIndex) => {
      const requestCount = Math.floor(Math.random() * 100) + 10;
      insertHeatmap.run(
        serviceId,
        region.code,
        region.name,
        requestCount,
        region.lat + (Math.random() - 0.5) * 0.05,
        region.lng + (Math.random() - 0.5) * 0.05,
        today
      );
    });
  });

  console.log('热力图模拟数据初始化完成');

  const insertAvailability = db.prepare(
    'INSERT INTO service_availability (service_id, monitor_time, status, response_time, error_message) VALUES (?, ?, ?, ?, ?)'
  );

  for (let i = 0; i < 48; i++) {
    const monitorTime = new Date(now.getTime() - i * 30 * 60 * 1000);
    serviceIds.forEach((serviceId, index) => {
      const isOnline = Math.random() > 0.05;
      const responseTime = Math.floor(Math.random() * 500) + 50;
      insertAvailability.run(
        serviceId,
        monitorTime.toISOString(),
        isOnline ? 'online' : 'offline',
        isOnline ? responseTime : null,
        isOnline ? null : '连接超时'
      );
    });
  }

  console.log('服务可用性监测数据初始化完成');

  const insertDataFusion = db.prepare(
    'INSERT INTO data_fusion (data_type, stat_period, stat_date, government_count, people_count, community_count, total_count, trend_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const govCount = Math.floor(Math.random() * 500) + 200;
    const peopleCount = Math.floor(Math.random() * 800) + 400;
    const communityCount = Math.floor(Math.random() * 300) + 100;
    const total = govCount + peopleCount + communityCount;

    insertDataFusion.run(
      'service',
      'day',
      dateStr,
      govCount,
      peopleCount,
      communityCount,
      total,
      JSON.stringify({ hourly: Array(24).fill(0).map(() => Math.floor(Math.random() * 100)) })
    );
  }

  console.log('多源融合分析数据初始化完成');

  console.log('✅ 所有数据初始化完成！');
};

export default runSeeder;
