import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function seed(knex: Knex): Promise<void> {
  await knex('departments').del();
  await knex('roles').del();
  await knex('users').del();
  await knex('visit_statuses').del();
  await knex('drug_categories').del();
  await knex('drugs').del();
  await knex('examinations').del();
  await knex('cdss_rules').del();
  await knex('structured_templates').del();

  const departments = [
    { id: 'dept_001', name: '内科', code: 'INTERNAL', description: '内科门诊' },
    { id: 'dept_002', name: '外科', code: 'SURGERY', description: '外科门诊' },
    { id: 'dept_003', name: '儿科', code: 'PEDIATRICS', description: '儿科门诊' },
    { id: 'dept_004', name: '妇科', code: 'OBGYN', description: '妇产科门诊' },
    { id: 'dept_005', name: '急诊科', code: 'EMERGENCY', description: '急诊科' },
    { id: 'dept_006', name: '药房', code: 'PHARMACY', description: '药房' },
    { id: 'dept_007', name: '检验科', code: 'LAB', description: '检验科' },
    { id: 'dept_008', name: '护理部', code: 'NURSING', description: '护理部' },
    { id: 'dept_009', name: '信息科', code: 'IT', description: '信息科' },
  ];

  await knex('departments').insert(departments);

  const roles = [
    {
      id: 'role_admin',
      name: '系统管理员',
      code: 'ADMIN',
      description: '系统超级管理员，拥有全部权限',
      permissions: JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        roles: ['create', 'read', 'update', 'delete'],
        departments: ['create', 'read', 'update', 'delete'],
        patients: ['read', 'update'],
        visits: ['read', 'update', 'delete'],
        prescriptions: ['read'],
        examOrders: ['read'],
        nursingOrders: ['read'],
        audit: ['read', 'export'],
        reports: ['read', 'export'],
        templates: ['create', 'read', 'update', 'delete'],
        cdss: ['create', 'read', 'update', 'delete'],
        system: ['config', 'backup', 'restore'],
      }),
    },
    {
      id: 'role_doctor',
      name: '医生',
      code: 'DOCTOR',
      description: '临床医生，负责诊断、开医嘱',
      permissions: JSON.stringify({
        patients: ['read', 'create', 'update'],
        visits: ['read', 'create', 'update'],
        prescriptions: ['read', 'create', 'update', 'sign'],
        examOrders: ['read', 'create', 'update', 'sign'],
        medicalRecords: ['read', 'create', 'update', 'sign'],
        templates: ['read'],
        cdss: ['read'],
        reports: ['read'],
      }),
    },
    {
      id: 'role_nurse',
      name: '护士',
      code: 'NURSE',
      description: '护士，负责执行医嘱、护理操作',
      permissions: JSON.stringify({
        patients: ['read'],
        visits: ['read'],
        nursingOrders: ['read', 'create', 'update', 'execute'],
        examOrders: ['read', 'execute'],
        prescriptions: ['read'],
        medicalRecords: ['read'],
        reports: ['read'],
      }),
    },
    {
      id: 'role_pharmacist',
      name: '药师',
      code: 'PHARMACIST',
      description: '药师，负责处方审核和发药',
      permissions: JSON.stringify({
        patients: ['read'],
        prescriptions: ['read', 'review', 'dispense'],
        drugs: ['read'],
        reports: ['read'],
      }),
    },
    {
      id: 'role_patient',
      name: '患者',
      code: 'PATIENT',
      description: '患者账号，查看自己的病历',
      permissions: JSON.stringify({
        patients: ['read_own'],
        visits: ['read_own'],
        prescriptions: ['read_own'],
        examOrders: ['read_own'],
        medicalRecords: ['read_own'],
      }),
    },
  ];

  await knex('roles').insert(roles);

  const hashedPassword = await bcrypt.hash('Emr@2024Secure', SALT_ROUNDS);

  const users = [
    {
      id: 'user_admin_01',
      username: 'admin',
      password_hash: hashedPassword,
      name: '系统管理员',
      employee_id: 'EMP_ADMIN_001',
      role_id: 'role_admin',
      department_id: 'dept_009',
      phone: '13800000000',
      email: 'admin@hospital.com',
      gender: 'MALE' as const,
      professional_title: '系统工程师',
    },
    {
      id: 'user_doctor_01',
      username: 'doctor1',
      password_hash: hashedPassword,
      name: '张医生',
      employee_id: 'EMP_DOC_001',
      role_id: 'role_doctor',
      department_id: 'dept_001',
      phone: '13800000001',
      email: 'zhang.doctor@hospital.com',
      gender: 'MALE' as const,
      certificate_number: 'CERT_001',
      professional_title: '主任医师',
    },
    {
      id: 'user_doctor_02',
      username: 'doctor2',
      password_hash: hashedPassword,
      name: '李医生',
      employee_id: 'EMP_DOC_002',
      role_id: 'role_doctor',
      department_id: 'dept_002',
      phone: '13800000002',
      email: 'li.doctor@hospital.com',
      gender: 'FEMALE' as const,
      certificate_number: 'CERT_002',
      professional_title: '副主任医师',
    },
    {
      id: 'user_nurse_01',
      username: 'nurse1',
      password_hash: hashedPassword,
      name: '王护士',
      employee_id: 'EMP_NURSE_001',
      role_id: 'role_nurse',
      department_id: 'dept_008',
      phone: '13800000003',
      email: 'wang.nurse@hospital.com',
      gender: 'FEMALE' as const,
      certificate_number: 'CERT_NURSE_001',
      professional_title: '主管护师',
    },
    {
      id: 'user_nurse_02',
      username: 'nurse2',
      password_hash: hashedPassword,
      name: '刘护士',
      employee_id: 'EMP_NURSE_002',
      role_id: 'role_nurse',
      department_id: 'dept_008',
      phone: '13800000004',
      email: 'liu.nurse@hospital.com',
      gender: 'FEMALE' as const,
      professional_title: '护师',
    },
    {
      id: 'user_pharmacist_01',
      username: 'pharmacist1',
      password_hash: hashedPassword,
      name: '陈药师',
      employee_id: 'EMP_PHARMA_001',
      role_id: 'role_pharmacist',
      department_id: 'dept_006',
      phone: '13800000005',
      email: 'chen.pharmacist@hospital.com',
      gender: 'MALE' as const,
      certificate_number: 'CERT_PHARMA_001',
      professional_title: '主管药师',
    },
  ];

  await knex('users').insert(users);

  const visitStatuses = [
    { id: 'status_pending', code: 'PENDING', name: '待诊', description: '患者已挂号，等待就诊', sort_order: 1 },
    { id: 'status_in_consultation', code: 'IN_CONSULTATION', name: '问诊中', description: '医生正在问诊', sort_order: 2 },
    { id: 'status_awaiting_order', code: 'AWAITING_ORDER', name: '待开医嘱', description: '诊断完成，待开医嘱', sort_order: 3 },
    { id: 'status_order_issued', code: 'ORDER_ISSUED', name: '医嘱下达', description: '医嘱已下达，等待执行', sort_order: 4 },
    { id: 'status_in_execution', code: 'IN_EXECUTION', name: '执行中', description: '医嘱正在执行中', sort_order: 5 },
    { id: 'status_signed', code: 'SIGNED', name: '已签名', description: '病历已电子签名，不可修改', sort_order: 6 },
    { id: 'status_archived', code: 'ARCHIVED', name: '已归档', description: '诊疗结束，病历已归档', sort_order: 7 },
    { id: 'status_cancelled', code: 'CANCELLED', name: '已取消', description: '就诊已取消', sort_order: 8 },
  ];

  await knex('visit_statuses').insert(visitStatuses);

  const drugCategories = [
    { id: 'cat_001', code: 'ANTIBIOTICS', name: '抗生素', sort_order: 1 },
    { id: 'cat_002', code: 'ANALGESICS', name: '解热镇痛药', sort_order: 2 },
    { id: 'cat_003', code: 'CARDIOVASCULAR', name: '心血管系统', sort_order: 3 },
    { id: 'cat_004', code: 'RESPIRATORY', name: '呼吸系统', sort_order: 4 },
    { id: 'cat_005', code: 'GASTROINTESTINAL', name: '消化系统', sort_order: 5 },
    { id: 'cat_006', code: 'VITAMINS', name: '维生素', sort_order: 6 },
  ];

  await knex('drug_categories').insert(drugCategories);

  const drugs = [
    {
      id: 'drug_001',
      drug_code: 'AMOXICILLIN_001',
      generic_name: '阿莫西林胶囊',
      brand_name: '阿莫仙',
      specification: '0.25g',
      unit: '盒',
      dosage_form: '胶囊剂',
      category_id: 'cat_001',
      manufacturer: '联邦制药',
      price: 25.50,
      indications: '用于敏感菌所致的呼吸道感染、泌尿道感染、皮肤软组织感染等',
      contraindications: '对青霉素类药物过敏者禁用',
      allergic_reactions: '可能引起皮疹、药物热、哮喘等过敏反应，严重者可发生过敏性休克',
      usage_dosage: '口服。成人一次0.5g，一日3-4次',
      is_prescription: true,
    },
    {
      id: 'drug_002',
      drug_code: 'CEFALEXIN_001',
      generic_name: '头孢氨苄胶囊',
      brand_name: '先锋霉素Ⅳ',
      specification: '0.25g',
      unit: '盒',
      dosage_form: '胶囊剂',
      category_id: 'cat_001',
      manufacturer: '华北制药',
      price: 18.00,
      indications: '用于敏感菌所致的呼吸道感染、泌尿道感染、皮肤软组织感染等',
      contraindications: '对头孢菌素类药物过敏者禁用',
      allergic_reactions: '可能引起皮疹、药物热等过敏反应，青霉素过敏者慎用',
      usage_dosage: '口服。成人一次0.25-0.5g，一日4次',
      is_prescription: true,
    },
    {
      id: 'drug_003',
      drug_code: 'IBUPROFEN_001',
      generic_name: '布洛芬缓释胶囊',
      brand_name: '芬必得',
      specification: '0.3g',
      unit: '盒',
      dosage_form: '缓释胶囊',
      category_id: 'cat_002',
      manufacturer: '中美史克',
      price: 28.80,
      indications: '用于缓解轻至中度疼痛，如头痛、关节痛、牙痛、痛经等',
      contraindications: '对阿司匹林或其他非甾体抗炎药过敏者禁用，孕妇及哺乳期妇女禁用',
      allergic_reactions: '可能引起皮疹、瘙痒等过敏反应',
      usage_dosage: '口服。成人一次1粒，一日2次',
      is_prescription: false,
    },
    {
      id: 'drug_004',
      drug_code: 'OMEPRAZOLE_001',
      generic_name: '奥美拉唑肠溶胶囊',
      brand_name: '洛赛克',
      specification: '20mg',
      unit: '盒',
      dosage_form: '肠溶胶囊',
      category_id: 'cat_005',
      manufacturer: '阿斯利康',
      price: 56.00,
      indications: '用于胃溃疡、十二指肠溃疡、应激性溃疡、反流性食管炎等',
      contraindications: '对本品过敏者禁用，婴幼儿禁用',
      allergic_reactions: '可能引起皮疹、瘙痒等过敏反应',
      usage_dosage: '口服。成人一次20mg，一日1-2次',
      is_prescription: true,
    },
  ];

  await knex('drugs').insert(drugs);

  const examinations = [
    {
      id: 'exam_001',
      exam_code: 'BLOOD_ROUTINE',
      name: '血常规',
      type: 'LAB' as const,
      department_code: 'LAB',
      price: 35.00,
      description: '全血细胞计数分析',
      preparation: '无需特殊准备',
    },
    {
      id: 'exam_002',
      exam_code: 'URINE_ROUTINE',
      name: '尿常规',
      type: 'LAB' as const,
      department_code: 'LAB',
      price: 28.00,
      description: '尿液常规检查',
      preparation: '采集中段尿',
    },
    {
      id: 'exam_003',
      exam_code: 'LIVER_FUNCTION',
      name: '肝功能',
      type: 'LAB' as const,
      department_code: 'LAB',
      price: 85.00,
      description: '肝脏功能检查',
      preparation: '空腹采血',
    },
    {
      id: 'exam_004',
      exam_code: 'CHEST_XRAY',
      name: '胸部X光',
      type: 'IMAGE' as const,
      department_code: 'RADIOLOGY',
      price: 120.00,
      description: '胸部正位片',
      preparation: '去除胸部金属物品',
    },
    {
      id: 'exam_005',
      exam_code: 'ECG',
      name: '心电图',
      type: 'FUNCTION' as const,
      department_code: 'CARDIOLOGY',
      price: 45.00,
      description: '常规心电图检查',
      preparation: '休息后检查',
    },
  ];

  await knex('examinations').insert(examinations);

  const cdssRules = [
    {
      id: 'rule_001',
      code: 'GENDER_MENSTRUATION_CONFLICT',
      name: '性别与月经史冲突校验',
      type: 'GENDER_CONFLICT' as const,
      severity: 'ERROR' as const,
      conditions: JSON.stringify({
        field: 'menstruation_history',
        patientGender: 'MALE',
        logic: 'EXISTS',
      }),
      actions: JSON.stringify({
        type: 'BLOCK',
        highlight: true,
      }),
      message_template: '男性患者不应记录月经史，请检查数据是否正确',
      reference_source: '临床数据标准规范',
      priority: 100,
    },
    {
      id: 'rule_002',
      code: 'PEDIATRIC_AGE_CHECK',
      name: '儿科用药年龄限制',
      type: 'AGE_RESTRICTION' as const,
      severity: 'WARNING' as const,
      conditions: JSON.stringify({
        ageLessThan: 18,
        drugCategory: 'ANTIBIOTICS',
      }),
      actions: JSON.stringify({
        type: 'WARN',
        requireConfirmation: false,
      }),
      message_template: '儿童使用抗生素需谨慎，请确认剂量和疗程是否适合',
      reference_source: '儿童用药指南',
      priority: 80,
    },
    {
      id: 'rule_003',
      code: 'PENICILLIN_ALLERGY_CHECK',
      name: '青霉素过敏检查',
      type: 'DRUG_ALLERGY' as const,
      severity: 'CRITICAL' as const,
      conditions: JSON.stringify({
        patientAllergies: ['青霉素', '青霉素类', '阿莫西林', '氨苄西林'],
        drugClass: 'PENICILLIN',
      }),
      actions: JSON.stringify({
        type: 'BLOCK',
        requireOverrideReason: true,
      }),
      message_template: '患者有青霉素类药物过敏史，禁用此类药物。如需使用请填写详细原因。',
      reference_source: '中华人民共和国药典临床用药须知',
      priority: 200,
    },
    {
      id: 'rule_004',
      code: 'CEPHALOSPORIN_ALLERGY_CHECK',
      name: '头孢类过敏检查',
      type: 'DRUG_ALLERGY' as const,
      severity: 'CRITICAL' as const,
      conditions: JSON.stringify({
        patientAllergies: ['头孢', '头孢菌素', '头孢类'],
        drugClass: 'CEPHALOSPORIN',
      }),
      actions: JSON.stringify({
        type: 'BLOCK',
        requireOverrideReason: true,
      }),
      message_template: '患者有头孢菌素类药物过敏史，禁用此类药物。如需使用请填写详细原因。',
      reference_source: '中华人民共和国药典临床用药须知',
      priority: 190,
    },
  ];

  await knex('cdss_rules').insert(cdssRules);

  const structuredTemplates = [
    {
      id: 'template_cc_001',
      code: 'CC_FEVER',
      name: '发热主诉模板',
      type: 'CHIEF_COMPLAINT' as const,
      schema: JSON.stringify({
        type: 'object',
        required: ['symptom', 'duration'],
        properties: {
          symptom: { type: 'string', title: '主要症状', enum: ['发热', '发热伴畏寒', '发热伴寒战'] },
          duration: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string', enum: ['小时', '天', '周'] } } },
          accompany: { type: 'array', items: { type: 'string', enum: ['咳嗽', '头痛', '乏力', '肌肉酸痛', '咽痛', '流涕'] } },
        },
      }),
      default_values: JSON.stringify({ symptom: '发热' }),
      validation_rules: JSON.stringify({}),
      description: '发热相关主诉的结构化录入模板',
      is_system: true,
    },
    {
      id: 'template_cc_002',
      code: 'CC_ABDOMINAL_PAIN',
      name: '腹痛主诉模板',
      type: 'CHIEF_COMPLAINT' as const,
      schema: JSON.stringify({
        type: 'object',
        required: ['symptom', 'location', 'duration'],
        properties: {
          symptom: { type: 'string', title: '主要症状', enum: ['腹痛', '腹部不适', '腹胀'] },
          location: { type: 'string', enum: ['上腹部', '下腹部', '左下腹', '右下腹', '脐周', '全腹'] },
          duration: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string', enum: ['小时', '天', '周', '月'] } } },
          nature: { type: 'string', enum: ['隐痛', '胀痛', '绞痛', '烧灼痛', '钝痛'] },
        },
      }),
      default_values: JSON.stringify({ symptom: '腹痛' }),
      validation_rules: JSON.stringify({}),
      description: '腹痛相关主诉的结构化录入模板',
      is_system: true,
    },
    {
      id: 'template_pi_001',
      code: 'PI_COUGH',
      name: '咳嗽现病史模板',
      type: 'PRESENT_ILLNESS' as const,
      schema: JSON.stringify({
        type: 'object',
        properties: {
          onset: { type: 'string', enum: ['急性起病', '亚急性起病', '慢性起病'] },
          onsetTime: { type: 'string' },
          trigger: { type: 'string' },
          coughCharacter: { type: 'array', items: { type: 'string', enum: ['干咳', '咳痰', '刺激性咳嗽', '夜间加重', '晨起加重'] } },
          sputum: { type: 'object', properties: { present: { type: 'boolean' }, color: { type: 'string' }, texture: { type: 'string' }, volume: { type: 'string' } } },
          accompanySymptoms: { type: 'array', items: { type: 'string' } },
          treatmentHistory: { type: 'object', properties: { medications: { type: 'array' }, effect: { type: 'string', enum: ['有效', '无效', '部分有效'] } } },
        },
      }),
      default_values: JSON.stringify({}),
      validation_rules: JSON.stringify({}),
      description: '咳嗽相关现病史的结构化录入模板',
      is_system: true,
    },
    {
      id: 'template_pe_001',
      code: 'PE_GENERAL',
      name: '一般体格检查模板',
      type: 'PHYSICAL_EXAM' as const,
      schema: JSON.stringify({
        type: 'object',
        properties: {
          vitalSigns: {
            type: 'object',
            properties: {
              temperature: { type: 'number', title: '体温(℃)', min: 35, max: 42 },
              pulse: { type: 'number', title: '脉搏(次/分)', min: 30, max: 200 },
              respiration: { type: 'number', title: '呼吸(次/分)', min: 8, max: 50 },
              bloodPressure: { type: 'object', properties: { systolic: { type: 'number' }, diastolic: { type: 'number' } } },
              oxygenSaturation: { type: 'number', title: '血氧饱和度(%)', min: 50, max: 100 },
            },
          },
          generalAppearance: { type: 'string', enum: ['正常', '急性病容', '慢性病容', '贫血貌', '黄疸'] },
          consciousness: { type: 'string', enum: ['清醒', '嗜睡', '意识模糊', '昏睡', '昏迷'] },
          skin: { type: 'object', properties: { color: { type: 'string' }, rash: { type: 'boolean' }, edema: { type: 'boolean' } } },
        },
      }),
      default_values: JSON.stringify({}),
      validation_rules: JSON.stringify({
        vitalSigns: {
          temperature: { requiredForType: ['EMERGENCY'] },
          bloodPressure: { requiredForType: ['INPATIENT', 'EMERGENCY'] },
        },
      }),
      description: '一般体格检查的结构化录入模板',
      is_system: true,
    },
  ];

  await knex('structured_templates').insert(structuredTemplates);

  console.log('✅ Seed data inserted successfully');
  console.log('📋 Default users created:');
  console.log('   - admin / Emr@2024Secure (系统管理员)');
  console.log('   - doctor1 / Emr@2024Secure (张医生 - 内科)');
  console.log('   - doctor2 / Emr@2024Secure (李医生 - 外科)');
  console.log('   - nurse1 / Emr@2024Secure (王护士)');
  console.log('   - nurse2 / Emr@2024Secure (刘护士)');
  console.log('   - pharmacist1 / Emr@2024Secure (陈药师)');
}
