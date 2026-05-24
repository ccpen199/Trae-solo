import bcrypt from 'bcryptjs';
import 'dotenv/config';
import db, { exec } from '../config/database';

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, saltRounds);
}

export function initTables(): void {
  const ddl = `
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('dealer', 'buyer', 'inspector', 'sales', 'customer_service', 'finance', 'admin')),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- 车源表
CREATE TABLE cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vin VARCHAR(17) NOT NULL UNIQUE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    mileage INTEGER NOT NULL,
    color VARCHAR(30) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    configuration TEXT,
    images_json TEXT NOT NULL DEFAULT '[]',
    documents_json TEXT NOT NULL DEFAULT '[]',
    dealer_id INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_inspection', 'inspecting', 'inspection_rejected', 'pending_audit', 'on_sale', 'locked', 'sold', 'off_shelf', 'exception')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dealer_id) REFERENCES users(id)
);

CREATE INDEX idx_cars_dealer_id ON cars(dealer_id);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_brand ON cars(brand);
CREATE INDEX idx_cars_price ON cars(price);

-- 状态历史表
CREATE TABLE status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    from_status VARCHAR(30) NOT NULL,
    to_status VARCHAR(30) NOT NULL,
    operator_id INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE INDEX idx_status_history_car_id ON status_history(car_id);

-- 检测报告表
CREATE TABLE inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL UNIQUE,
    inspector_id INTEGER NOT NULL,
    accident_json TEXT NOT NULL,
    water_damage_json TEXT NOT NULL,
    fire_damage_json TEXT NOT NULL,
    maintenance_json TEXT NOT NULL DEFAULT '[]',
    paintwork_json TEXT NOT NULL DEFAULT '[]',
    road_test_json TEXT NOT NULL,
    overall_score INTEGER NOT NULL,
    overall_comment TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    auditor_id INTEGER,
    audit_comment TEXT,
    audited_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (inspector_id) REFERENCES users(id),
    FOREIGN KEY (auditor_id) REFERENCES users(id)
);

CREATE INDEX idx_inspections_inspector_id ON inspections(inspector_id);
CREATE INDEX idx_inspections_status ON inspections(status);

-- 预约表
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    sales_id INTEGER,
    type VARCHAR(20) NOT NULL CHECK (type IN ('view', 'test_drive')),
    appointment_time DATETIME NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    intention_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (intention_level IN ('high', 'medium', 'low')),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (sales_id) REFERENCES users(id)
);

CREATE INDEX idx_appointments_car_id ON appointments(car_id);
CREATE INDEX idx_appointments_buyer_id ON appointments(buyer_id);
CREATE INDEX idx_appointments_sales_id ON appointments(sales_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);

-- 跟进记录表
CREATE TABLE follow_up_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    operator_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- 订金表
CREATE TABLE deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    paid_at DATETIME,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'locked', 'refund_pending', 'refunded', 'released_to_seller', 'deducted')),
    refund_reason TEXT,
    refund_approved_by INTEGER,
    refund_approved_at DATETIME,
    release_type VARCHAR(30) CHECK (release_type IN ('to_seller', 'deducted', 'refunded')),
    settlement_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (refund_approved_by) REFERENCES users(id)
);

CREATE INDEX idx_deposits_car_id ON deposits(car_id);
CREATE INDEX idx_deposits_buyer_id ON deposits(buyer_id);
CREATE INDEX idx_deposits_status ON deposits(status);

-- 合同表
CREATE TABLE contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    dealer_id INTEGER NOT NULL,
    deposit_id INTEGER,
    total_price DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('full', 'installment')),
    finance_plan_json TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_sign', 'signed', 'pending_payment', 'paid', 'completed', 'cancelled')),
    signed_by_buyer_at DATETIME,
    signed_by_dealer_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (dealer_id) REFERENCES users(id),
    FOREIGN KEY (deposit_id) REFERENCES deposits(id)
);

CREATE INDEX idx_contracts_car_id ON contracts(car_id);
CREATE INDEX idx_contracts_buyer_id ON contracts(buyer_id);
CREATE INDEX idx_contracts_dealer_id ON contracts(dealer_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- 过户表
CREATE TABLE transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    car_id INTEGER NOT NULL,
    documents_json TEXT NOT NULL DEFAULT '[]',
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewing', 'approved', 'completed', 'rejected')),
    reviewer_id INTEGER,
    review_comment TEXT,
    reviewed_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE INDEX idx_transfers_contract_id ON transfers(contract_id);
CREATE INDEX idx_transfers_car_id ON transfers(car_id);
CREATE INDEX idx_transfers_status ON transfers(status);

-- 结算表
CREATE TABLE settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    car_id INTEGER NOT NULL,
    dealer_id INTEGER NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    platform_fee DECIMAL(12,2) NOT NULL,
    fee_rate DECIMAL(5,4) NOT NULL,
    other_fees_json TEXT NOT NULL DEFAULT '[]',
    amount_to_dealer DECIMAL(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'reconciled', 'invoiced')),
    settled_at DATETIME,
    reconciled_at DATETIME,
    invoiced_at DATETIME,
    invoice_number VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (dealer_id) REFERENCES users(id)
);

CREATE INDEX idx_settlements_contract_id ON settlements(contract_id);
CREATE INDEX idx_settlements_dealer_id ON settlements(dealer_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_created ON settlements(created_at);

-- 异常工单表
CREATE TABLE exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('fake_car', 'accident_concealed', 'deposit_refund', 'transfer_failed', 'mileage_dispute', 'duplicate_sale')),
    related_type VARCHAR(50) NOT NULL CHECK (related_type IN ('car', 'inspection', 'appointment', 'deposit', 'contract', 'transfer')),
    related_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    assignee_id INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    evidence_json TEXT NOT NULL DEFAULT '[]',
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution TEXT,
    closed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
);

CREATE INDEX idx_exceptions_type ON exceptions(type);
CREATE INDEX idx_exceptions_related ON exceptions(related_type, related_id);
CREATE INDEX idx_exceptions_status ON exceptions(status);
CREATE INDEX idx_exceptions_assignee ON exceptions(assignee_id);

-- 异常处理记录表
CREATE TABLE handling_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exception_id INTEGER NOT NULL,
    operator_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exception_id) REFERENCES exceptions(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- 审计日志表
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    ip_address VARCHAR(50) NOT NULL,
    user_agent TEXT NOT NULL,
    old_value_json TEXT,
    new_value_json TEXT,
    change_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- 权限配置表
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource, action)
);
  `;

  exec(ddl);
}

export function initPermissions(): void {
  const permissions = [
    ['admin', 'car', 'create'], ['admin', 'car', 'read'], ['admin', 'car', 'update'], ['admin', 'car', 'delete'],
    ['admin', 'inspection', 'create'], ['admin', 'inspection', 'read'], ['admin', 'inspection', 'update'], ['admin', 'inspection', 'audit'],
    ['admin', 'appointment', 'create'], ['admin', 'appointment', 'read'], ['admin', 'appointment', 'update'],
    ['admin', 'deposit', 'create'], ['admin', 'deposit', 'read'], ['admin', 'deposit', 'update'], ['admin', 'deposit', 'refund'], ['admin', 'deposit', 'release'],
    ['admin', 'contract', 'create'], ['admin', 'contract', 'read'], ['admin', 'contract', 'update'], ['admin', 'contract', 'sign'],
    ['admin', 'transfer', 'create'], ['admin', 'transfer', 'read'], ['admin', 'transfer', 'update'], ['admin', 'transfer', 'complete'],
    ['admin', 'settlement', 'create'], ['admin', 'settlement', 'read'], ['admin', 'settlement', 'update'],
    ['admin', 'statistics', 'read'],
    ['admin', 'exception', 'create'], ['admin', 'exception', 'read'], ['admin', 'exception', 'update'],
    ['admin', 'audit', 'read'],
    ['admin', 'user', 'create'], ['admin', 'user', 'read'], ['admin', 'user', 'update'],
    ['dealer', 'car', 'create'], ['dealer', 'car', 'read'], ['dealer', 'car', 'update'],
    ['dealer', 'inspection', 'read'],
    ['dealer', 'contract', 'read'], ['dealer', 'contract', 'sign'],
    ['dealer', 'settlement', 'read'],
    ['dealer', 'appointment', 'read'],
    ['buyer', 'car', 'read'],
    ['buyer', 'inspection', 'read'],
    ['buyer', 'appointment', 'create'], ['buyer', 'appointment', 'read'], ['buyer', 'appointment', 'update'],
    ['buyer', 'deposit', 'create'], ['buyer', 'deposit', 'read'],
    ['buyer', 'contract', 'read'], ['buyer', 'contract', 'sign'],
    ['buyer', 'transfer', 'read'], ['buyer', 'transfer', 'create'],
    ['buyer', 'exception', 'create'], ['buyer', 'exception', 'read'],
    ['inspector', 'car', 'read'],
    ['inspector', 'inspection', 'create'], ['inspector', 'inspection', 'read'], ['inspector', 'inspection', 'update'],
    ['sales', 'car', 'read'],
    ['sales', 'inspection', 'read'],
    ['sales', 'appointment', 'create'], ['sales', 'appointment', 'read'], ['sales', 'appointment', 'update'],
    ['sales', 'deposit', 'read'],
    ['sales', 'contract', 'create'], ['sales', 'contract', 'read'], ['sales', 'contract', 'update'],
    ['sales', 'transfer', 'create'], ['sales', 'transfer', 'read'], ['sales', 'transfer', 'update'],
    ['sales', 'exception', 'read'],
    ['customer_service', 'car', 'read'],
    ['customer_service', 'exception', 'create'], ['customer_service', 'exception', 'read'], ['customer_service', 'exception', 'update'],
    ['customer_service', 'appointment', 'read'],
    ['customer_service', 'transfer', 'read'],
    ['finance', 'deposit', 'read'], ['finance', 'deposit', 'refund'], ['finance', 'deposit', 'release'],
    ['finance', 'contract', 'read'],
    ['finance', 'settlement', 'create'], ['finance', 'settlement', 'read'], ['finance', 'settlement', 'update'],
  ];

  const stmt = db.prepare('INSERT INTO permissions (role, resource, action) VALUES (?, ?, ?)');
  for (const [role, resource, action] of permissions) {
    stmt.run(role, resource, action);
  }
}

export function initTestUsers(): void {
  const passwordHash = hashPassword('123456');

  const users = [
    { username: 'admin', name: '系统管理员', role: 'admin', phone: '13800000001' },
    { username: 'dealer1', name: '诚信二手车行', role: 'dealer', phone: '13800000002' },
    { username: 'buyer1', name: '张先生', role: 'buyer', phone: '13800000003' },
    { username: 'inspector1', name: '李检测师', role: 'inspector', phone: '13800000004' },
    { username: 'sales1', name: '王销售', role: 'sales', phone: '13800000005' },
    { username: 'cs1', name: '赵客服', role: 'customer_service', phone: '13800000006' },
    { username: 'finance1', name: '孙财务', role: 'finance', phone: '13800000007' },
  ];

  const stmt = db.prepare('INSERT INTO users (username, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?)');
  for (const user of users) {
    stmt.run(user.username, passwordHash, user.name, user.role, user.phone);
  }
}

export function initTestCars(): void {
  const cars = [
    {
      vin: 'LFV2A21K5D4123456',
      brand: '大众',
      model: '迈腾 2020款 330TSI DSG 领先型',
      year: 2020,
      month: 6,
      mileage: 45000,
      color: '黑色',
      price: 168000.00,
      originalPrice: 229900.00,
      configuration: '自动空调、全景天窗、真皮座椅、倒车影像、定速巡航',
      images: ['https://example.com/car1-1.jpg', 'https://example.com/car1-2.jpg'],
      documents: [
        { type: 'registration', name: '行驶证', url: 'https://example.com/doc1.pdf' },
        { type: 'insurance', name: '交强险保单', url: 'https://example.com/doc2.pdf' }
      ],
      dealerId: 2,
      status: 'on_sale'
    },
    {
      vin: 'LGBH52E0XJY123457',
      brand: '本田',
      model: '雅阁 2019款 260TURBO 豪华版',
      year: 2019,
      month: 3,
      mileage: 62000,
      color: '白色',
      price: 145000.00,
      originalPrice: 199800.00,
      configuration: '自动空调、电动座椅、LED大灯、自适应巡航',
      images: ['https://example.com/car2-1.jpg', 'https://example.com/car2-2.jpg'],
      documents: [
        { type: 'registration', name: '行驶证', url: 'https://example.com/doc3.pdf' },
        { type: 'maintenance', name: '保养记录', url: 'https://example.com/doc4.pdf' }
      ],
      dealerId: 2,
      status: 'on_sale'
    },
    {
      vin: 'WDDUG8CB0FA123458',
      brand: '奔驰',
      model: 'C级 2021款 C 260 L 运动版',
      year: 2021,
      month: 1,
      mileage: 28000,
      color: '红色',
      price: 288000.00,
      originalPrice: 351200.00,
      configuration: '自动空调、全景天窗、真皮座椅、倒车影像、定速巡航、LED大灯',
      images: ['https://example.com/car3-1.jpg', 'https://example.com/car3-2.jpg'],
      documents: [
        { type: 'registration', name: '行驶证', url: 'https://example.com/doc5.pdf' },
        { type: 'insurance', name: '商业险保单', url: 'https://example.com/doc6.pdf' }
      ],
      dealerId: 2,
      status: 'pending_inspection'
    },
    {
      vin: 'LBV1Z3103KM123459',
      brand: '宝马',
      model: '3系 2020款 325Li M运动套装',
      year: 2020,
      month: 9,
      mileage: 35000,
      color: '蓝色',
      price: 258000.00,
      originalPrice: 319300.00,
      configuration: '自动空调、全景天窗、真皮座椅、倒车影像、定速巡航、LED大灯、电动座椅',
      images: ['https://example.com/car4-1.jpg', 'https://example.com/car4-2.jpg'],
      documents: [
        { type: 'registration', name: '行驶证', url: 'https://example.com/doc7.pdf' }
      ],
      dealerId: 2,
      status: 'on_sale'
    },
    {
      vin: 'LSVAU2180N2123460',
      brand: '丰田',
      model: '凯美瑞 2019款 2.5G 豪华版',
      year: 2019,
      month: 11,
      mileage: 58000,
      color: '银色',
      price: 158000.00,
      originalPrice: 219800.00,
      configuration: '自动空调、真皮座椅、倒车影像、定速巡航、LED大灯',
      images: ['https://example.com/car5-1.jpg', 'https://example.com/car5-2.jpg'],
      documents: [
        { type: 'registration', name: '行驶证', url: 'https://example.com/doc8.pdf' },
        { type: 'maintenance', name: '4S店保养记录', url: 'https://example.com/doc9.pdf' }
      ],
      dealerId: 2,
      status: 'sold'
    }
  ];

  const stmt = db.prepare(
    'INSERT INTO cars (vin, brand, model, year, month, mileage, color, price, original_price, configuration, images_json, documents_json, dealer_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  for (const car of cars) {
    stmt.run(
      car.vin,
      car.brand,
      car.model,
      car.year,
      car.month,
      car.mileage,
      car.color,
      car.price,
      car.originalPrice,
      car.configuration,
      JSON.stringify(car.images),
      JSON.stringify(car.documents),
      car.dealerId,
      car.status
    );
  }
}
