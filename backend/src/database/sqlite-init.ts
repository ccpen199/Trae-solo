import Knex from 'knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const SALT_ROUNDS = 10;

export async function initializeDatabase(dbPath?: string): Promise<Knex.Knex> {
  const defaultPath = path.resolve(__dirname, '../../../data/emr_system.db');
  const databasePath = dbPath || defaultPath;
  
  const dataDir = path.dirname(databasePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const knex = Knex({
    client: 'better-sqlite3',
    connection: {
      filename: databasePath,
    },
    useNullAsDefault: true,
  });

  const tablesExist = await checkTablesExist(knex);
  
  if (!tablesExist) {
    console.log('📦 Creating SQLite database tables...');
    await createTables(knex);
    console.log('✅ Database tables created');
    
    console.log('🌱 Seeding initial data...');
    await seedData(knex);
    console.log('✅ Initial data seeded');
  } else {
    console.log('✅ Database already initialized');
  }

  return knex;
}

async function checkTablesExist(knex: Knex.Knex): Promise<boolean> {
  try {
    const result = await knex.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    return result.length > 0;
  } catch {
    return false;
  }
}

async function createTables(knex: Knex.Knex): Promise<void> {
  await knex.schema.createTable('departments', (table) => {
    table.text('id').primary();
    table.text('name').notNullable().unique();
    table.text('code').notNullable().unique();
    table.text('description');
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('roles', (table) => {
    table.text('id').primary();
    table.text('name').notNullable().unique();
    table.text('code').notNullable().unique();
    table.text('description');
    table.text('permissions').defaultTo('{}');
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('users', (table) => {
    table.text('id').primary();
    table.text('username').notNullable().unique();
    table.text('password_hash').notNullable();
    table.text('name').notNullable();
    table.text('employee_id').unique();
    table.text('role_id');
    table.text('department_id');
    table.text('phone');
    table.text('email');
    table.text('gender');
    table.date('birth_date');
    table.text('certificate_number');
    table.text('professional_title');
    table.integer('is_active').defaultTo(1);
    table.integer('is_locked').defaultTo(0);
    table.timestamp('last_login_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('audit_logs', (table) => {
    table.text('id').primary();
    table.text('user_id');
    table.text('username').notNullable();
    table.text('action').notNullable();
    table.text('module').notNullable();
    table.text('table_name');
    table.text('record_id');
    table.text('old_value');
    table.text('new_value');
    table.text('ip_address');
    table.text('user_agent');
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('patients', (table) => {
    table.text('id').primary();
    table.text('patient_number').notNullable().unique();
    table.text('name').notNullable();
    table.text('id_card_number').unique();
    table.text('gender').notNullable();
    table.date('birth_date');
    table.text('phone');
    table.text('emergency_contact');
    table.text('emergency_phone');
    table.text('address');
    table.text('allergies');
    table.text('past_medical_history');
    table.text('family_history');
    table.text('social_history');
    table.text('blood_type').defaultTo('UNKNOWN');
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('visit_statuses', (table) => {
    table.text('id').primary();
    table.text('code').notNullable().unique();
    table.text('name').notNullable().unique();
    table.text('description');
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('visits', (table) => {
    table.text('id').primary();
    table.text('visit_number').notNullable().unique();
    table.text('patient_id').notNullable();
    table.text('department_id');
    table.text('doctor_id');
    table.text('current_status_id');
    table.text('visit_type').notNullable().defaultTo('OUTPATIENT');
    table.timestamp('checkin_time').notNullable();
    table.timestamp('start_time');
    table.timestamp('end_time');
    table.timestamp('discharge_time');
    table.text('room_number');
    table.text('bed_number');
    table.text('chief_complaint');
    table.text('present_illness');
    table.text('past_history');
    table.text('physical_exam');
    table.text('diagnosis');
    table.text('treatment_plan');
    table.text('signed_by');
    table.timestamp('signed_at');
    table.text('signature');
    table.integer('is_archived').defaultTo(0);
    table.timestamp('archived_at');
    table.float('quality_score');
    table.text('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('drug_categories', (table) => {
    table.text('id').primary();
    table.text('code').notNullable().unique();
    table.text('name').notNullable();
    table.text('parent_id');
    table.integer('sort_order').defaultTo(0);
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('drugs', (table) => {
    table.text('id').primary();
    table.text('drug_code').notNullable().unique();
    table.text('generic_name').notNullable();
    table.text('brand_name');
    table.text('specification');
    table.text('unit');
    table.text('dosage_form');
    table.text('category_id');
    table.text('manufacturer');
    table.float('price');
    table.text('indications');
    table.text('contraindications');
    table.text('adverse_reactions');
    table.text('allergic_reactions');
    table.text('usage_dosage');
    table.text('interaction_drugs');
    table.integer('is_prescription').defaultTo(1);
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('prescriptions', (table) => {
    table.text('id').primary();
    table.text('prescription_number').notNullable().unique();
    table.text('visit_id').notNullable();
    table.text('patient_id').notNullable();
    table.text('doctor_id');
    table.text('type').defaultTo('REGULAR');
    table.text('status').defaultTo('DRAFT');
    table.text('conflict_message');
    table.text('doctor_override_reason');
    table.text('signed_by');
    table.timestamp('signed_at');
    table.text('signature');
    table.timestamp('dispensed_at');
    table.text('dispensed_by');
    table.text('remark');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('prescription_items', (table) => {
    table.text('id').primary();
    table.text('prescription_id').notNullable();
    table.text('drug_id');
    table.text('drug_name').notNullable();
    table.text('specification');
    table.float('quantity');
    table.text('unit');
    table.text('dosage');
    table.text('frequency');
    table.text('route');
    table.text('instructions');
    table.float('price');
    table.float('subtotal');
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('examinations', (table) => {
    table.text('id').primary();
    table.text('exam_code').notNullable().unique();
    table.text('name').notNullable();
    table.text('type').notNullable();
    table.text('department_code');
    table.float('price');
    table.text('description');
    table.text('preparation');
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('lab_orders', (table) => {
    table.text('id').primary();
    table.text('order_number').notNullable().unique();
    table.text('visit_id').notNullable();
    table.text('patient_id').notNullable();
    table.text('doctor_id');
    table.text('examination_id');
    table.text('exam_name').notNullable();
    table.text('status').defaultTo('PENDING');
    table.text('clinical_indication');
    table.text('doctor_remark');
    table.text('signed_by');
    table.timestamp('signed_at');
    table.text('signature');
    table.timestamp('scheduled_at');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.text('operator_id');
    table.text('result');
    table.text('result_data');
    table.text('conclusion');
    table.text('result_doctor_id');
    table.timestamp('reviewed_at');
    table.text('urgency').defaultTo('ROUTINE');
    table.text('type').defaultTo('LAB');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('cdss_rules', (table) => {
    table.text('id').primary();
    table.text('code').notNullable().unique();
    table.text('name').notNullable();
    table.text('type').notNullable();
    table.text('severity').defaultTo('WARNING');
    table.text('conditions').notNullable();
    table.text('actions').notNullable();
    table.text('message_template').notNullable();
    table.text('reference_source');
    table.integer('is_enabled').defaultTo(1);
    table.integer('priority').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('structured_templates', (table) => {
    table.text('id').primary();
    table.text('code').notNullable().unique();
    table.text('name').notNullable();
    table.text('type').notNullable();
    table.text('department_code');
    table.text('schema').notNullable();
    table.text('default_values');
    table.text('validation_rules');
    table.text('description');
    table.integer('is_system').defaultTo(0);
    table.integer('is_active').defaultTo(1);
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  console.log('✅ All SQLite tables created successfully');
}

async function seedData(knex: Knex.Knex): Promise<void> {
  const hashedPassword = await bcrypt.hash('Emr@2024Secure', SALT_ROUNDS);

  const departments = [
    { id: uuidv4(), name: '内科', code: 'INTERNAL', description: '内科门诊' },
    { id: uuidv4(), name: '外科', code: 'SURGERY', description: '外科门诊' },
    { id: uuidv4(), name: '儿科', code: 'PEDIATRICS', description: '儿科门诊' },
    { id: uuidv4(), name: '妇科', code: 'OBGYN', description: '妇产科门诊' },
    { id: uuidv4(), name: '急诊科', code: 'EMERGENCY', description: '急诊科' },
    { id: uuidv4(), name: '药房', code: 'PHARMACY', description: '药房' },
    { id: uuidv4(), name: '检验科', code: 'LAB', description: '检验科' },
    { id: uuidv4(), name: '护理部', code: 'NURSING', description: '护理部' },
    { id: uuidv4(), name: '信息科', code: 'IT', description: '信息科' },
  ];

  await knex('departments').insert(departments);

  const deptIT = departments.find(d => d.code === 'IT')!;
  const deptInternal = departments.find(d => d.code === 'INTERNAL')!;
  const deptSurgery = departments.find(d => d.code === 'SURGERY')!;
  const deptNursing = departments.find(d => d.code === 'NURSING')!;
  const deptPharmacy = departments.find(d => d.code === 'PHARMACY')!;

  const roles = [
    {
      id: uuidv4(),
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
      id: uuidv4(),
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
      id: uuidv4(),
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
      id: uuidv4(),
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
  ];

  await knex('roles').insert(roles);

  const roleAdmin = roles.find(r => r.code === 'ADMIN')!;
  const roleDoctor = roles.find(r => r.code === 'DOCTOR')!;
  const roleNurse = roles.find(r => r.code === 'NURSE')!;
  const rolePharmacist = roles.find(r => r.code === 'PHARMACIST')!;

  const users = [
    {
      id: uuidv4(),
      username: 'admin',
      password_hash: hashedPassword,
      name: '系统管理员',
      employee_id: 'EMP_ADMIN_001',
      role_id: roleAdmin.id,
      department_id: deptIT.id,
      phone: '13800000000',
      email: 'admin@hospital.com',
      gender: 'MALE',
      professional_title: '系统工程师',
    },
    {
      id: uuidv4(),
      username: 'doctor1',
      password_hash: hashedPassword,
      name: '张医生',
      employee_id: 'EMP_DOC_001',
      role_id: roleDoctor.id,
      department_id: deptInternal.id,
      phone: '13800000001',
      email: 'zhang.doctor@hospital.com',
      gender: 'MALE',
      certificate_number: 'CERT_001',
      professional_title: '主任医师',
    },
    {
      id: uuidv4(),
      username: 'doctor2',
      password_hash: hashedPassword,
      name: '李医生',
      employee_id: 'EMP_DOC_002',
      role_id: roleDoctor.id,
      department_id: deptSurgery.id,
      phone: '13800000002',
      email: 'li.doctor@hospital.com',
      gender: 'FEMALE',
      certificate_number: 'CERT_002',
      professional_title: '副主任医师',
    },
    {
      id: uuidv4(),
      username: 'nurse1',
      password_hash: hashedPassword,
      name: '王护士',
      employee_id: 'EMP_NURSE_001',
      role_id: roleNurse.id,
      department_id: deptNursing.id,
      phone: '13800000003',
      email: 'wang.nurse@hospital.com',
      gender: 'FEMALE',
      certificate_number: 'CERT_NURSE_001',
      professional_title: '主管护师',
    },
    {
      id: uuidv4(),
      username: 'nurse2',
      password_hash: hashedPassword,
      name: '刘护士',
      employee_id: 'EMP_NURSE_002',
      role_id: roleNurse.id,
      department_id: deptNursing.id,
      phone: '13800000004',
      email: 'liu.nurse@hospital.com',
      gender: 'FEMALE',
      professional_title: '护师',
    },
    {
      id: uuidv4(),
      username: 'pharmacist1',
      password_hash: hashedPassword,
      name: '陈药师',
      employee_id: 'EMP_PHARMA_001',
      role_id: rolePharmacist.id,
      department_id: deptPharmacy.id,
      phone: '13800000005',
      email: 'chen.pharmacist@hospital.com',
      gender: 'MALE',
      certificate_number: 'CERT_PHARMA_001',
      professional_title: '主管药师',
    },
  ];

  await knex('users').insert(users);

  const visitStatuses = [
    { id: uuidv4(), code: 'PENDING', name: '待诊', description: '患者已挂号，等待就诊', sort_order: 1 },
    { id: uuidv4(), code: 'IN_CONSULTATION', name: '问诊中', description: '医生正在问诊', sort_order: 2 },
    { id: uuidv4(), code: 'AWAITING_ORDER', name: '待开医嘱', description: '诊断完成，待开医嘱', sort_order: 3 },
    { id: uuidv4(), code: 'ORDER_ISSUED', name: '医嘱下达', description: '医嘱已下达，等待执行', sort_order: 4 },
    { id: uuidv4(), code: 'IN_EXECUTION', name: '执行中', description: '医嘱正在执行中', sort_order: 5 },
    { id: uuidv4(), code: 'SIGNED', name: '已签名', description: '病历已电子签名，不可修改', sort_order: 6 },
    { id: uuidv4(), code: 'ARCHIVED', name: '已归档', description: '诊疗结束，病历已归档', sort_order: 7 },
    { id: uuidv4(), code: 'CANCELLED', name: '已取消', description: '就诊已取消', sort_order: 8 },
  ];

  await knex('visit_statuses').insert(visitStatuses);

  const drugCategories = [
    { id: uuidv4(), code: 'ANTIBIOTICS', name: '抗生素', sort_order: 1 },
    { id: uuidv4(), code: 'ANALGESICS', name: '解热镇痛药', sort_order: 2 },
    { id: uuidv4(), code: 'CARDIOVASCULAR', name: '心血管系统', sort_order: 3 },
    { id: uuidv4(), code: 'RESPIRATORY', name: '呼吸系统', sort_order: 4 },
    { id: uuidv4(), code: 'GASTROINTESTINAL', name: '消化系统', sort_order: 5 },
    { id: uuidv4(), code: 'VITAMINS', name: '维生素', sort_order: 6 },
  ];

  await knex('drug_categories').insert(drugCategories);

  const catAntibiotics = drugCategories.find(c => c.code === 'ANTIBIOTICS')!;
  const catAnalgesics = drugCategories.find(c => c.code === 'ANALGESICS')!;
  const catGastro = drugCategories.find(c => c.code === 'GASTROINTESTINAL')!;

  const drugs = [
    {
      id: uuidv4(),
      drug_code: 'AMOXICILLIN_001',
      generic_name: '阿莫西林胶囊',
      brand_name: '阿莫仙',
      specification: '0.25g',
      unit: '盒',
      dosage_form: '胶囊剂',
      category_id: catAntibiotics.id,
      manufacturer: '联邦制药',
      price: 25.50,
      indications: '用于敏感菌所致的呼吸道感染、泌尿道感染、皮肤软组织感染等',
      contraindications: '对青霉素类药物过敏者禁用',
      allergic_reactions: '可能引起皮疹、药物热、哮喘等过敏反应，严重者可发生过敏性休克',
      usage_dosage: '口服。成人一次0.5g，一日3-4次',
      is_prescription: 1,
    },
    {
      id: uuidv4(),
      drug_code: 'CEFALEXIN_001',
      generic_name: '头孢氨苄胶囊',
      brand_name: '先锋霉素Ⅳ',
      specification: '0.25g',
      unit: '盒',
      dosage_form: '胶囊剂',
      category_id: catAntibiotics.id,
      manufacturer: '华北制药',
      price: 18.00,
      indications: '用于敏感菌所致的呼吸道感染、泌尿道感染、皮肤软组织感染等',
      contraindications: '对头孢菌素类药物过敏者禁用',
      allergic_reactions: '可能引起皮疹、药物热等过敏反应，青霉素过敏者慎用',
      usage_dosage: '口服。成人一次0.25-0.5g，一日4次',
      is_prescription: 1,
    },
    {
      id: uuidv4(),
      drug_code: 'IBUPROFEN_001',
      generic_name: '布洛芬缓释胶囊',
      brand_name: '芬必得',
      specification: '0.3g',
      unit: '盒',
      dosage_form: '缓释胶囊',
      category_id: catAnalgesics.id,
      manufacturer: '中美史克',
      price: 28.80,
      indications: '用于缓解轻至中度疼痛，如头痛、关节痛、牙痛、痛经等',
      contraindications: '对阿司匹林或其他非甾体抗炎药过敏者禁用，孕妇及哺乳期妇女禁用',
      allergic_reactions: '可能引起皮疹、瘙痒等过敏反应',
      usage_dosage: '口服。成人一次1粒，一日2次',
      is_prescription: 0,
    },
    {
      id: uuidv4(),
      drug_code: 'OMEPRAZOLE_001',
      generic_name: '奥美拉唑肠溶胶囊',
      brand_name: '洛赛克',
      specification: '20mg',
      unit: '盒',
      dosage_form: '肠溶胶囊',
      category_id: catGastro.id,
      manufacturer: '阿斯利康',
      price: 56.00,
      indications: '用于胃溃疡、十二指肠溃疡、应激性溃疡、反流性食管炎等',
      contraindications: '对本品过敏者禁用，婴幼儿禁用',
      allergic_reactions: '可能引起皮疹、瘙痒等过敏反应',
      usage_dosage: '口服。成人一次20mg，一日1-2次',
      is_prescription: 1,
    },
  ];

  await knex('drugs').insert(drugs);

  const examinations = [
    {
      id: uuidv4(),
      exam_code: 'BLOOD_ROUTINE',
      name: '血常规',
      type: 'LAB',
      department_code: 'LAB',
      price: 35.00,
      description: '全血细胞计数分析',
      preparation: '无需特殊准备',
    },
    {
      id: uuidv4(),
      exam_code: 'URINE_ROUTINE',
      name: '尿常规',
      type: 'LAB',
      department_code: 'LAB',
      price: 28.00,
      description: '尿液常规检查',
      preparation: '采集中段尿',
    },
    {
      id: uuidv4(),
      exam_code: 'LIVER_FUNCTION',
      name: '肝功能',
      type: 'LAB',
      department_code: 'LAB',
      price: 85.00,
      description: '肝脏功能检查',
      preparation: '空腹采血',
    },
    {
      id: uuidv4(),
      exam_code: 'CHEST_XRAY',
      name: '胸部X光',
      type: 'IMAGE',
      department_code: 'RADIOLOGY',
      price: 120.00,
      description: '胸部正位片',
      preparation: '去除胸部金属物品',
    },
    {
      id: uuidv4(),
      exam_code: 'ECG',
      name: '心电图',
      type: 'FUNCTION',
      department_code: 'CARDIOLOGY',
      price: 45.00,
      description: '常规心电图检查',
      preparation: '休息后检查',
    },
  ];

  await knex('examinations').insert(examinations);

  const cdssRules = [
    {
      id: uuidv4(),
      code: 'GENDER_MENSTRUATION_CONFLICT',
      name: '性别与月经史冲突校验',
      type: 'GENDER_CONFLICT',
      severity: 'ERROR',
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
      id: uuidv4(),
      code: 'PEDIATRIC_AGE_CHECK',
      name: '儿科用药年龄限制',
      type: 'AGE_RESTRICTION',
      severity: 'WARNING',
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
      id: uuidv4(),
      code: 'PENICILLIN_ALLERGY_CHECK',
      name: '青霉素过敏检查',
      type: 'DRUG_ALLERGY',
      severity: 'CRITICAL',
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
  ];

  await knex('cdss_rules').insert(cdssRules);

  const structuredTemplates = [
    {
      id: uuidv4(),
      code: 'CC_FEVER',
      name: '发热主诉模板',
      type: 'CHIEF_COMPLAINT',
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
      is_system: 1,
    },
    {
      id: uuidv4(),
      code: 'CC_ABDOMINAL_PAIN',
      name: '腹痛主诉模板',
      type: 'CHIEF_COMPLAINT',
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
      is_system: 1,
    },
  ];

  await knex('structured_templates').insert(structuredTemplates);

  console.log('🌱 Adding test data for patients, visits, prescriptions...');
  
  const doctor1 = await knex('users').where('username', 'doctor1').select('id', 'department_id').first();
  const doctor2 = await knex('users').where('username', 'doctor2').select('id', 'department_id').first();
  const statusPending = await knex('visit_statuses').where('code', 'PENDING').select('id').first();
  const statusInConsultation = await knex('visit_statuses').where('code', 'IN_CONSULTATION').select('id').first();
  const statusOrderIssued = await knex('visit_statuses').where('code', 'ORDER_ISSUED').select('id').first();
  const statusSigned = await knex('visit_statuses').where('code', 'SIGNED').select('id').first();
  const deptInternalDb = await knex('departments').where('code', 'INTERNAL').select('id').first();
  const deptSurgeryDb = await knex('departments').where('code', 'SURGERY').select('id').first();

  const patients = [
    {
      id: uuidv4(),
      patient_number: 'P20260401001',
      name: '张三',
      id_card_number: '110101199001011234',
      gender: 'MALE',
      birth_date: '1990-01-01',
      phone: '13900001234',
      emergency_contact: '李四',
      emergency_phone: '13900001235',
      address: '北京市朝阳区XX街道XX号',
      allergies: JSON.stringify(['青霉素', '海鲜']),
      past_medical_history: '高血压病史5年，糖尿病病史2年',
      family_history: '父亲有高血压病史',
      blood_type: 'A',
    },
    {
      id: uuidv4(),
      patient_number: 'P20260401002',
      name: '王丽',
      id_card_number: '110101199202022345',
      gender: 'FEMALE',
      birth_date: '1992-02-02',
      phone: '13900001236',
      emergency_contact: '王五',
      emergency_phone: '13900001237',
      address: '北京市海淀区XX街道XX号',
      allergies: JSON.stringify([]),
      past_medical_history: '无特殊病史',
      family_history: '无家族遗传病史',
      blood_type: 'B',
    },
    {
      id: uuidv4(),
      patient_number: 'P20260401003',
      name: '赵六',
      id_card_number: '110101198503033456',
      gender: 'MALE',
      birth_date: '1985-03-03',
      phone: '13900001238',
      emergency_contact: '赵七',
      emergency_phone: '13900001239',
      address: '北京市西城区XX街道XX号',
      allergies: JSON.stringify(['头孢类抗生素']),
      past_medical_history: '冠心病病史3年，高脂血症',
      family_history: '父亲有冠心病病史',
      blood_type: 'AB',
    },
    {
      id: uuidv4(),
      patient_number: 'P20260401004',
      name: '陈小红',
      id_card_number: '110101199804044567',
      gender: 'FEMALE',
      birth_date: '1998-04-04',
      phone: '13900001240',
      emergency_contact: '陈大明',
      emergency_phone: '13900001241',
      address: '北京市东城区XX街道XX号',
      allergies: JSON.stringify([]),
      past_medical_history: '无特殊病史',
      family_history: '无家族遗传病史',
      blood_type: 'O',
    },
    {
      id: uuidv4(),
      patient_number: 'P20260401005',
      name: '刘强',
      id_card_number: '110101197805055678',
      gender: 'MALE',
      birth_date: '1978-05-05',
      phone: '13900001242',
      emergency_contact: '刘芳',
      emergency_phone: '13900001243',
      address: '北京市丰台区XX街道XX号',
      allergies: JSON.stringify(['阿司匹林']),
      past_medical_history: '高血压病史10年，慢性支气管炎',
      family_history: '父亲有高血压病史，母亲有糖尿病病史',
      blood_type: 'A',
    },
  ];

  await knex('patients').insert(patients);

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const visits = [
    {
      id: uuidv4(),
      visit_number: 'V20260428001',
      patient_id: patients[0].id,
      department_id: deptInternalDb?.id,
      doctor_id: doctor1?.id,
      current_status_id: statusPending?.id,
      visit_type: 'OUTPATIENT',
      checkin_time: now.toISOString(),
      chief_complaint: '发热、咳嗽3天',
      present_illness: '患者3天前受凉后出现发热，体温最高38.5℃，伴咳嗽、咳痰，为白色粘痰。自服感冒药效果不佳。',
      past_history: '高血压病史5年，规律服药，血压控制可。糖尿病病史2年。',
      diagnosis: '上呼吸道感染；高血压病；2型糖尿病',
    },
    {
      id: uuidv4(),
      visit_number: 'V20260428002',
      patient_id: patients[1].id,
      department_id: deptInternalDb?.id,
      doctor_id: doctor1?.id,
      current_status_id: statusInConsultation?.id,
      visit_type: 'OUTPATIENT',
      checkin_time: now.toISOString(),
      chief_complaint: '腹痛、腹泻1天',
      present_illness: '患者1天前因进食生冷食物后出现腹痛，为阵发性绞痛，伴腹泻，稀水样便5-6次。',
      past_history: '无特殊病史。',
    },
    {
      id: uuidv4(),
      visit_number: 'V20260428003',
      patient_id: patients[2].id,
      department_id: deptSurgeryDb?.id,
      doctor_id: doctor2?.id,
      current_status_id: statusOrderIssued?.id,
      visit_type: 'OUTPATIENT',
      checkin_time: yesterday.toISOString(),
      chief_complaint: '右下腹疼痛8小时',
      present_illness: '患者8小时前无明显诱因出现右下腹疼痛，为持续性胀痛，伴恶心、呕吐1次。',
      past_history: '冠心病病史3年。',
      diagnosis: '急性阑尾炎？',
    },
    {
      id: uuidv4(),
      visit_number: 'V20260428004',
      patient_id: patients[3].id,
      department_id: deptInternalDb?.id,
      doctor_id: doctor1?.id,
      current_status_id: statusSigned?.id,
      visit_type: 'OUTPATIENT',
      checkin_time: twoDaysAgo.toISOString(),
      chief_complaint: '鼻塞、流涕2天',
      present_illness: '患者2天前受凉后出现鼻塞、流涕，为清涕，伴咽干、咽痛。',
      past_history: '无特殊病史。',
      diagnosis: '急性上呼吸道感染',
    },
    {
      id: uuidv4(),
      visit_number: 'V20260428005',
      patient_id: patients[4].id,
      department_id: deptInternalDb?.id,
      doctor_id: doctor1?.id,
      current_status_id: statusInConsultation?.id,
      visit_type: 'OUTPATIENT',
      checkin_time: now.toISOString(),
      chief_complaint: '胸闷、胸痛1天',
      present_illness: '患者1天前活动后出现胸闷、胸痛，为心前区压榨样疼痛，持续约5分钟，休息后缓解。',
      past_history: '高血压病史10年，慢性支气管炎。',
    },
  ];

  await knex('visits').insert(visits);

  const drugsDb = await knex('drugs').select('*');
  const amoxicillin = drugsDb.find((d: any) => d.drug_code === 'AMOXICILLIN_001');
  const ibuprofen = drugsDb.find((d: any) => d.drug_code === 'IBUPROFEN_001');
  const omeprazole = drugsDb.find((d: any) => d.drug_code === 'OMEPRAZOLE_001');

  const prescriptions = [
    {
      id: uuidv4(),
      prescription_number: 'RX20260428001',
      visit_id: visits[2].id,
      patient_id: patients[2].id,
      doctor_id: doctor2?.id,
      type: 'REGULAR',
      status: 'PENDING_REVIEW',
    },
    {
      id: uuidv4(),
      prescription_number: 'RX20260428002',
      visit_id: visits[3].id,
      patient_id: patients[3].id,
      doctor_id: doctor1?.id,
      type: 'REGULAR',
      status: 'DISPENSED',
      dispensed_at: yesterday.toISOString(),
    },
  ];

  await knex('prescriptions').insert(prescriptions);

  if (amoxicillin) {
    await knex('prescription_items').insert([
      {
        id: uuidv4(),
        prescription_id: prescriptions[0].id,
        drug_id: amoxicillin.id,
        drug_name: amoxicillin.generic_name,
        specification: amoxicillin.specification,
        quantity: 3,
        unit: '盒',
        dosage: '0.5g',
        frequency: '每日3次',
        route: '口服',
        instructions: '饭后服用',
        price: amoxicillin.price,
        subtotal: amoxicillin.price * 3,
      },
    ]);
  }

  if (ibuprofen) {
    await knex('prescription_items').insert([
      {
        id: uuidv4(),
        prescription_id: prescriptions[1].id,
        drug_id: ibuprofen.id,
        drug_name: ibuprofen.generic_name,
        specification: ibuprofen.specification,
        quantity: 2,
        unit: '盒',
        dosage: '0.3g',
        frequency: '每日2次',
        route: '口服',
        instructions: '饭后服用',
        price: ibuprofen.price,
        subtotal: ibuprofen.price * 2,
      },
    ]);
  }

  const examinationsDb = await knex('examinations').select('*');
  const bloodRoutine = examinationsDb.find((e: any) => e.exam_code === 'BLOOD_ROUTINE');
  const urineRoutine = examinationsDb.find((e: any) => e.exam_code === 'URINE_ROUTINE');
  const liverFunction = examinationsDb.find((e: any) => e.exam_code === 'LIVER_FUNCTION');
  const chestXray = examinationsDb.find((e: any) => e.exam_code === 'CHEST_XRAY');
  const ecg = examinationsDb.find((e: any) => e.exam_code === 'ECG');

  const labOrders = [
    {
      id: uuidv4(),
      order_number: 'LAB20260428001',
      visit_id: visits[0].id,
      patient_id: patients[0].id,
      doctor_id: doctor1?.id,
      examination_id: bloodRoutine?.id,
      exam_name: bloodRoutine?.name || '血常规',
      status: 'PENDING',
      type: 'LAB',
      urgency: 'ROUTINE',
      clinical_indication: '发热查因',
    },
    {
      id: uuidv4(),
      order_number: 'LAB20260428002',
      visit_id: visits[0].id,
      patient_id: patients[0].id,
      doctor_id: doctor1?.id,
      examination_id: chestXray?.id,
      exam_name: chestXray?.name || '胸部X光',
      status: 'IN_PROGRESS',
      type: 'IMAGE',
      urgency: 'ROUTINE',
      clinical_indication: '咳嗽查因',
      started_at: now.toISOString(),
    },
    {
      id: uuidv4(),
      order_number: 'LAB20260428003',
      visit_id: visits[4].id,
      patient_id: patients[4].id,
      doctor_id: doctor1?.id,
      examination_id: ecg?.id,
      exam_name: ecg?.name || '心电图',
      status: 'PENDING',
      type: 'FUNCTION',
      urgency: 'URGENT',
      clinical_indication: '胸痛查因',
    },
    {
      id: uuidv4(),
      order_number: 'LAB20260428004',
      visit_id: visits[3].id,
      patient_id: patients[3].id,
      doctor_id: doctor1?.id,
      examination_id: bloodRoutine?.id,
      exam_name: bloodRoutine?.name || '血常规',
      status: 'COMPLETED',
      type: 'LAB',
      urgency: 'ROUTINE',
      clinical_indication: '上呼吸道感染',
      completed_at: yesterday.toISOString(),
      result: '白细胞计数正常，淋巴细胞比例升高',
      conclusion: '符合病毒感染血象',
    },
    {
      id: uuidv4(),
      order_number: 'LAB20260428005',
      visit_id: visits[1].id,
      patient_id: patients[1].id,
      doctor_id: doctor1?.id,
      examination_id: liverFunction?.id,
      exam_name: liverFunction?.name || '肝功能',
      status: 'PENDING',
      type: 'LAB',
      urgency: 'ROUTINE',
      clinical_indication: '腹痛查因',
    },
  ];

  await knex('lab_orders').insert(labOrders);

  console.log('✅ Test data inserted successfully:');
  console.log('   - 5 patients added');
  console.log('   - 5 visits added');
  console.log('   - 2 prescriptions added');
  console.log('   - 5 lab orders added');
  console.log('✅ Seed data inserted successfully');
  console.log('📋 Default users created:');
  console.log('   - admin / Emr@2024Secure (系统管理员)');
  console.log('   - doctor1 / Emr@2024Secure (张医生 - 内科)');
  console.log('   - doctor2 / Emr@2024Secure (李医生 - 外科)');
  console.log('   - nurse1 / Emr@2024Secure (王护士)');
  console.log('   - nurse2 / Emr@2024Secure (刘护士)');
  console.log('   - pharmacist1 / Emr@2024Secure (陈药师)');
}

export default initializeDatabase;
