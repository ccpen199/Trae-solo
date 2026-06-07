import db from './index.js';
import bcrypt from 'bcryptjs';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      phone TEXT,
      language TEXT DEFAULT 'zh',
      timezone TEXT DEFAULT 'Australia/Sydney',
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      full_name_en TEXT NOT NULL,
      full_name_zh TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      nationality TEXT,
      dual_citizenship INTEGER DEFAULT 0,
      passport_no TEXT,
      visa_type TEXT,
      tfn TEXT,
      arbn TEXT,
      address_en TEXT,
      address_zh TEXT,
      bank_account TEXT,
      bank_name TEXT,
      tax_residence TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
      property_type TEXT NOT NULL,
      title TEXT NOT NULL,
      address_en TEXT NOT NULL,
      address_zh TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postcode TEXT,
      country TEXT DEFAULT 'Australia',
      bedrooms INTEGER DEFAULT 0,
      bathrooms INTEGER DEFAULT 0,
      parking_spaces INTEGER DEFAULT 0,
      land_area REAL,
      building_area REAL,
      year_built INTEGER,
      purchase_price REAL,
      purchase_date TEXT,
      current_value REAL,
      valuation_date TEXT,
      council_rate REAL,
      water_rate REAL,
      strata_fee REAL,
      insurance_fee REAL,
      land_tax REAL,
      management_fee REAL,
      status TEXT DEFAULT 'active',
      description TEXT,
      property_me_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name_en TEXT NOT NULL,
      full_name_zh TEXT,
      email TEXT,
      phone TEXT,
      identification_type TEXT,
      identification_no TEXT,
      nationality TEXT,
      employer TEXT,
      annual_income REAL,
      rental_history TEXT,
      reference_name TEXT,
      reference_phone TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lease_agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
      owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
      agreement_no TEXT UNIQUE NOT NULL,
      agreement_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      is_fixed_term INTEGER DEFAULT 1,
      rent_amount REAL NOT NULL,
      rent_frequency TEXT NOT NULL,
      bond_amount REAL,
      bond_lodged INTEGER DEFAULT 0,
      bond_lodgement_date TEXT,
      rent_payment_day TEXT,
      lease_document_url TEXT,
      special_conditions TEXT,
      status TEXT DEFAULT 'active',
      auto_renewal INTEGER DEFAULT 0,
      renewal_notice_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loan_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
      lender TEXT NOT NULL,
      loan_amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      rate_type TEXT NOT NULL,
      loan_term INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      maturity_date TEXT NOT NULL,
      monthly_repayment REAL NOT NULL,
      repayment_day INTEGER,
      offset_account TEXT,
      loan_type TEXT,
      loan_purpose TEXT,
      valuation_amount REAL,
      lvr REAL,
      insurance_premium REAL,
      remaining_balance REAL,
      next_repayment_date TEXT,
      status TEXT DEFAULT 'active',
      contract_document_url TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tax_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER REFERENCES owners(id) ON DELETE CASCADE,
      property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
      financial_year TEXT NOT NULL,
      lodgement_date TEXT,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      total_income REAL DEFAULT 0,
      total_expenses REAL DEFAULT 0,
      taxable_income REAL DEFAULT 0,
      tax_payable REAL DEFAULT 0,
      tax_withheld REAL DEFAULT 0,
      refund_amount REAL DEFAULT 0,
      payment_amount REAL DEFAULT 0,
      payment_date TEXT,
      accountant_id INTEGER REFERENCES users(id),
      ato_document_url TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS depreciation_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      report_year INTEGER NOT NULL,
      report_date TEXT,
      total_depreciation REAL NOT NULL,
      building_depreciation REAL,
      plant_equipment_depreciation REAL,
      report_url TEXT,
      prepared_by TEXT,
      next_report_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS property_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      document_type TEXT NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_name TEXT,
      file_size INTEGER,
      uploaded_by INTEGER REFERENCES users(id),
      expiry_date TEXT,
      is_verified INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mall_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
      order_type TEXT NOT NULL,
      items TEXT,
      total_amount REAL NOT NULL,
      currency TEXT DEFAULT 'AUD',
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending',
      shipping_address TEXT,
      shipping_tracking TEXT,
      status TEXT DEFAULT 'pending',
      ordered_at TEXT,
      paid_at TEXT,
      shipped_at TEXT,
      delivered_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rent_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lease_id INTEGER REFERENCES lease_agreements(id) ON DELETE CASCADE,
      property_id INTEGER REFERENCES properties(id),
      tenant_id INTEGER REFERENCES tenants(id),
      owner_id INTEGER REFERENCES owners(id),
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'AUD',
      payment_date TEXT,
      due_date TEXT,
      payment_method TEXT,
      transaction_ref TEXT,
      status TEXT DEFAULT 'pending',
      is_overdue INTEGER DEFAULT 0,
      days_overdue INTEGER DEFAULT 0,
      late_fee REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      owner_id INTEGER REFERENCES owners(id),
      expense_type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'AUD',
      expense_date TEXT,
      description TEXT,
      receipt_url TEXT,
      is_tax_deductible INTEGER DEFAULT 1,
      gst_amount REAL DEFAULT 0,
      paid_by TEXT,
      status TEXT DEFAULT 'paid',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_type TEXT NOT NULL,
      full_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      qualification TEXT,
      license_no TEXT,
      rating REAL DEFAULT 5,
      hourly_rate REAL,
      service_areas TEXT,
      languages TEXT,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_no TEXT UNIQUE NOT NULL,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
      provider_id INTEGER REFERENCES service_providers(id) ON DELETE SET NULL,
      service_type TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      duration INTEGER DEFAULT 60,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      meeting_link TEXT,
      rescheduled_from INTEGER,
      cancelled_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_type TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_zh TEXT NOT NULL,
      message_en TEXT,
      message_zh TEXT,
      related_type TEXT,
      related_id INTEGER,
      trigger_date TEXT NOT NULL,
      send_sms INTEGER DEFAULT 0,
      send_email INTEGER DEFAULT 1,
      sent INTEGER DEFAULT 0,
      sent_at TEXT,
      recipient_id INTEGER,
      recipient_email TEXT,
      recipient_phone TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_no TEXT UNIQUE NOT NULL,
      report_type TEXT NOT NULL,
      language TEXT DEFAULT 'zh',
      property_id INTEGER REFERENCES properties(id),
      owner_id INTEGER REFERENCES owners(id),
      period TEXT,
      generated_by INTEGER REFERENCES users(id),
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      file_url TEXT,
      status TEXT DEFAULT 'ready',
      parameters TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      related_type TEXT,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS property_me_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      local_id INTEGER NOT NULL,
      external_id TEXT NOT NULL,
      sync_direction TEXT NOT NULL,
      last_sync_at TEXT,
      sync_status TEXT DEFAULT 'success',
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(entity_type, local_id, external_id)
    );

    CREATE TABLE IF NOT EXISTS i18n_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      lang TEXT NOT NULL,
      value TEXT NOT NULL,
      namespace TEXT DEFAULT 'common',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(key, lang, namespace)
    );
  `);

  createIndexes();
  insertSeedData();
}

function createIndexes() {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
    CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_leases_property ON lease_agreements(property_id);
    CREATE INDEX IF NOT EXISTS idx_leases_tenant ON lease_agreements(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_leases_status ON lease_agreements(status);
    CREATE INDEX IF NOT EXISTS idx_leases_end_date ON lease_agreements(end_date);
    CREATE INDEX IF NOT EXISTS idx_loans_property ON loan_contracts(property_id);
    CREATE INDEX IF NOT EXISTS idx_loans_owner ON loan_contracts(owner_id);
    CREATE INDEX IF NOT EXISTS idx_loans_status ON loan_contracts(status);
    CREATE INDEX IF NOT EXISTS idx_tax_owner ON tax_returns(owner_id);
    CREATE INDEX IF NOT EXISTS idx_tax_status ON tax_returns(status);
    CREATE INDEX IF NOT EXISTS idx_tax_due_date ON tax_returns(due_date);
    CREATE INDEX IF NOT EXISTS idx_payments_lease ON rent_payments(lease_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON rent_payments(status);
    CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses(property_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
    CREATE INDEX IF NOT EXISTS idx_appointments_property ON service_appointments(property_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON service_appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON service_appointments(status);
    CREATE INDEX IF NOT EXISTS idx_reminders_trigger ON reminders(trigger_date);
    CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_owners_user ON owners(user_id);
    CREATE INDEX IF NOT EXISTS idx_owners_arbn ON owners(arbn);
  `);
}

function insertSeedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    ensureDemoAccounts();
    return;
  }

  const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
  const hashedAccountantPassword = bcrypt.hashSync('acc123', 10);
  const hashedUserPassword = bcrypt.hashSync('user123', 10);

  db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, phone, language, timezone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'admin@ausproperty.com',
    hashedAdminPassword,
    '系统管理员',
    'admin',
    '+61 400 000 000',
    'zh',
    'Australia/Sydney'
  );

  db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, phone, language, timezone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'accountant@ausproperty.com',
    hashedAccountantPassword,
    '张会计师',
    'accountant',
    '+61 400 000 001',
    'zh',
    'Australia/Sydney'
  );

  db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, phone, language, timezone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'owner1@example.com',
    hashedUserPassword,
    '李业主',
    'user',
    '+86 138 0000 0001',
    'zh',
    'Asia/Shanghai'
  );

  db.prepare(`
    INSERT INTO owners (full_name_en, full_name_zh, email, phone, nationality, dual_citizenship, tfn, arbn, tax_residence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'LI Ming',
    '李明',
    'owner1@example.com',
    '+86 138 0000 0001',
    'Chinese',
    1,
    '123 456 789',
    '987654321',
    'Australia'
  );

  db.prepare(`
    INSERT INTO owners (full_name_en, full_name_zh, email, phone, nationality, dual_citizenship, tfn, tax_residence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'WANG Fang',
    '王芳',
    'owner2@example.com',
    '+86 139 0000 0002',
    'Chinese',
    0,
    '234 567 890',
    'China'
  );

  db.prepare(`
    INSERT INTO properties (owner_id, property_type, title, address_en, address_zh, city, state, postcode, bedrooms, bathrooms, parking_spaces, building_area, purchase_price, purchase_date, current_value, council_rate, water_rate, strata_fee, insurance_fee, land_tax, management_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    'apartment',
    'Sydney CBD Modern Apartment',
    '123 George Street, Sydney NSW 2000',
    '悉尼CBD乔治街123号',
    'Sydney',
    'NSW',
    '2000',
    2,
    2,
    1,
    85,
    850000,
    '2022-06-15',
    920000,
    350,
    180,
    650,
    1200,
    2500,
    440
  );

  db.prepare(`
    INSERT INTO properties (owner_id, property_type, title, address_en, address_zh, city, state, postcode, bedrooms, bathrooms, parking_spaces, building_area, purchase_price, purchase_date, current_value, council_rate, water_rate, strata_fee, insurance_fee, land_tax, management_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    'house',
    'Melbourne Eastern Family House',
    '456 Toorak Road, Toorak VIC 3142',
    '墨尔本图拉克区图拉克路456号',
    'Melbourne',
    'VIC',
    '3142',
    4,
    3,
    2,
    220,
    1850000,
    '2021-03-20',
    2100000,
    680,
    280,
    0,
    2500,
    8500,
    880
  );

  db.prepare(`
    INSERT INTO properties (owner_id, property_type, title, address_en, address_zh, city, state, postcode, bedrooms, bathrooms, parking_spaces, building_area, purchase_price, purchase_date, current_value, council_rate, water_rate, strata_fee, insurance_fee, land_tax, management_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    2,
    'apartment',
    'Brisbane Riverside Apartment',
    '789 Eagle Street, Brisbane QLD 4000',
    '布里斯班鹰街789号',
    'Brisbane',
    'QLD',
    '4000',
    1,
    1,
    1,
    60,
    520000,
    '2023-01-10',
    560000,
    280,
    150,
    520,
    950,
    1800,
    330
  );

  db.prepare(`
    INSERT INTO tenants (full_name_en, full_name_zh, email, phone, identification_type, identification_no, employer, annual_income, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'JOHN Smith',
    '约翰·史密斯',
    'john.smith@email.com',
    '+61 412 345 678',
    'Drivers License',
    '12345678',
    'ANZ Bank',
    95000,
    'active'
  );

  db.prepare(`
    INSERT INTO tenants (full_name_en, full_name_zh, email, phone, identification_type, identification_no, employer, annual_income, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Sarah Johnson',
    '萨拉·约翰逊',
    'sarah.j@email.com',
    '+61 423 456 789',
    'Passport',
    'AB123456',
    'Telstra',
    85000,
    'active'
  );

  db.prepare(`
    INSERT INTO lease_agreements (property_id, tenant_id, owner_id, agreement_no, agreement_type, start_date, end_date, is_fixed_term, rent_amount, rent_frequency, bond_amount, bond_lodged, rent_payment_day, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    1,
    1,
    'LA-2024-0001',
    'residential',
    '2024-01-15',
    '2025-01-14',
    1,
    850,
    'weekly',
    3400,
    1,
    'Monday',
    'active'
  );

  db.prepare(`
    INSERT INTO lease_agreements (property_id, tenant_id, owner_id, agreement_no, agreement_type, start_date, end_date, is_fixed_term, rent_amount, rent_frequency, bond_amount, bond_lodged, rent_payment_day, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    2,
    2,
    1,
    'LA-2024-0002',
    'residential',
    '2024-03-01',
    '2024-12-31',
    1,
    1200,
    'weekly',
    4800,
    1,
    'Friday',
    'active'
  );

  db.prepare(`
    INSERT INTO loan_contracts (property_id, owner_id, lender, loan_amount, interest_rate, rate_type, loan_term, start_date, maturity_date, monthly_repayment, repayment_day, loan_type, loan_purpose, valuation_amount, lvr, insurance_premium, remaining_balance, next_repayment_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    1,
    'Commonwealth Bank',
    595000,
    5.85,
    'variable',
    30,
    '2022-06-15',
    '2052-06-14',
    3480,
    15,
    'principal_and_interest',
    'investment',
    850000,
    70,
    120,
    578000,
    '2024-06-15',
    'active'
  );

  db.prepare(`
    INSERT INTO loan_contracts (property_id, owner_id, lender, loan_amount, interest_rate, rate_type, loan_term, start_date, maturity_date, monthly_repayment, repayment_day, loan_type, loan_purpose, valuation_amount, lvr, insurance_premium, remaining_balance, next_repayment_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    2,
    1,
    'Westpac',
    1295000,
    5.65,
    'fixed',
    25,
    '2021-03-20',
    '2046-03-19',
    7950,
    20,
    'principal_and_interest',
    'investment',
    1850000,
    70,
    280,
    1245000,
    '2024-06-20',
    'active'
  );

  db.prepare(`
    INSERT INTO tax_returns (owner_id, property_id, financial_year, due_date, status, total_income, total_expenses, taxable_income, tax_payable, tax_withheld, refund_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    1,
    '2023-2024',
    '2024-10-31',
    'in_progress',
    44200,
    38500,
    5700,
    1710,
    0,
    0
  );

  db.prepare(`
    INSERT INTO tax_returns (owner_id, property_id, financial_year, due_date, status, total_income, total_expenses, taxable_income, tax_payable, tax_withheld, refund_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    2,
    '2023-2024',
    '2024-10-31',
    'in_progress',
    62400,
    52800,
    9600,
    2880,
    0,
    0
  );

  db.prepare(`
    INSERT INTO depreciation_reports (property_id, report_year, report_date, total_depreciation, building_depreciation, plant_equipment_depreciation, prepared_by, next_report_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    2024,
    '2024-05-01',
    12500,
    8500,
    4000,
    'BMT Tax Depreciation',
    '2025-05-01'
  );

  db.prepare(`
    INSERT INTO depreciation_reports (property_id, report_year, report_date, total_depreciation, building_depreciation, plant_equipment_depreciation, prepared_by, next_report_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    2,
    2024,
    '2024-04-15',
    18700,
    13200,
    5500,
    'Washington Brown',
    '2025-04-15'
  );

  db.prepare(`
    INSERT INTO service_providers (provider_type, full_name, company_name, email, phone, qualification, license_no, hourly_rate, service_areas, languages, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'migration_lawyer',
    'Michael Chen',
    'Chen & Associates',
    'michael@chenlaw.com.au',
    '+61 2 9000 1234',
    'Registered Migration Agent',
    'MARN 1234567',
    350,
    'Sydney, Melbourne, Brisbane',
    'English, Mandarin',
    1
  );

  db.prepare(`
    INSERT INTO service_providers (provider_type, full_name, company_name, email, phone, qualification, license_no, hourly_rate, service_areas, languages, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'building_inspector',
    'David Wilson',
    'Wilson Building Inspections',
    'david@wilsoninspect.com.au',
    '+61 3 9000 5678',
    'Licensed Building Inspector',
    'BL-12345',
    280,
    'Melbourne, Geelong',
    'English',
    1
  );

  db.prepare(`
    INSERT INTO service_providers (provider_type, full_name, company_name, email, phone, qualification, license_no, hourly_rate, service_areas, languages, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'accountant',
    'Emily Zhang',
    'Zhang Tax & Accounting',
    'emily@zhangtax.com.au',
    '+61 2 9000 9012',
    'CPA Australia',
    'CPA 123456',
    300,
    'Sydney, Brisbane',
    'English, Mandarin',
    1
  );

  db.prepare(`
    INSERT INTO rent_payments (lease_id, property_id, tenant_id, owner_id, amount, payment_date, due_date, payment_method, transaction_ref, status, is_overdue, days_overdue)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    1,
    1,
    1,
    850,
    '2024-05-20',
    '2024-05-20',
    'bank_transfer',
    'TXN-001',
    'paid',
    0,
    0
  );

  db.prepare(`
    INSERT INTO rent_payments (lease_id, property_id, tenant_id, owner_id, amount, due_date, payment_method, status, is_overdue, days_overdue)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    1,
    1,
    1,
    850,
    '2024-05-27',
    'bank_transfer',
    'pending',
    0,
    0
  );

  db.prepare(`
    INSERT INTO rent_payments (lease_id, property_id, tenant_id, owner_id, amount, payment_date, due_date, payment_method, transaction_ref, status, is_overdue, days_overdue)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    2,
    2,
    2,
    1,
    1200,
    '2024-05-17',
    '2024-05-17',
    'credit_card',
    'TXN-002',
    'paid',
    0,
    0
  );

  db.prepare(`
    INSERT INTO expenses (property_id, owner_id, expense_type, amount, expense_date, description, is_tax_deductible, gst_amount, paid_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    1,
    'maintenance',
    350,
    '2024-05-10',
    'Air conditioning service',
    1,
    31.82,
    'agency'
  );

  db.prepare(`
    INSERT INTO expenses (property_id, owner_id, expense_type, amount, expense_date, description, is_tax_deductible, gst_amount, paid_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    1,
    'insurance',
    1200,
    '2024-04-15',
    'Landlord insurance annual premium',
    1,
    109.09,
    'owner'
  );

  db.prepare(`
    INSERT INTO expenses (property_id, owner_id, expense_type, amount, expense_date, description, is_tax_deductible, gst_amount, paid_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    2,
    1,
    'council_rates',
    680,
    '2024-05-01',
    'Quarterly council rates',
    1,
    0,
    'owner'
  );

  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  db.prepare(`
    INSERT INTO reminders (reminder_type, title_en, title_zh, message_en, message_zh, related_type, related_id, trigger_date, send_sms, send_email, recipient_email, recipient_phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'lease_renewal',
    'Lease Agreement Expiring Soon',
    '租约即将到期',
    'The lease agreement for 123 George Street, Sydney will expire on 2025-01-14. Please start the renewal process.',
    '悉尼乔治街123号的租约将于2025年1月14日到期，请启动续约流程。',
    'lease_agreement',
    1,
    nextMonth.toISOString().split('T')[0],
    1,
    1,
    'owner1@example.com',
    '+86 138 0000 0001',
    'pending'
  );

  db.prepare(`
    INSERT INTO reminders (reminder_type, title_en, title_zh, message_en, message_zh, related_type, related_id, trigger_date, send_sms, send_email, recipient_email, recipient_phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'loan_repayment',
    'Loan Repayment Due',
    '贷款还款日',
    'Your monthly loan repayment of $3,480 for 123 George Street is due on 2024-06-15.',
    '您在悉尼乔治街123号的月供$3,480将于2024年6月15日到期。',
    'loan_contract',
    1,
    nextWeek.toISOString().split('T')[0],
    1,
    1,
    'owner1@example.com',
    '+86 138 0000 0001',
    'pending'
  );

  db.prepare(`
    INSERT INTO reminders (reminder_type, title_en, title_zh, message_en, message_zh, related_type, related_id, trigger_date, send_sms, send_email, recipient_email, recipient_phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'tax_filing',
    'Tax Return Due Date Reminder',
    '报税截止日提醒',
    'The 2023-2024 financial year tax return is due on 2024-10-31. Please prepare your documents.',
    '2023-2024财年度的报税截止日为2024年10月31日，请准备好相关文件。',
    'tax_return',
    1,
    '2024-10-01',
    1,
    1,
    'owner1@example.com',
    '+86 138 0000 0001',
    'pending'
  );

  db.prepare(`
    INSERT INTO mall_orders (order_no, owner_id, order_type, items, total_amount, currency, payment_status, status, ordered_at, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'ORD-2024-0001',
    1,
    'property_service',
    '[{"name":"深度清洁服务","quantity":1,"price":250}]',
    250,
    'AUD',
    'paid',
    'delivered',
    '2024-05-10',
    '2024-05-10'
  );

  const i18nData = [
    ['common.dashboard', 'zh', '资产看板'],
    ['common.dashboard', 'en', 'Dashboard'],
    ['common.properties', 'zh', '房产管理'],
    ['common.properties', 'en', 'Properties'],
    ['common.owners', 'zh', '业主管理'],
    ['common.owners', 'en', 'Owners'],
    ['common.tenants', 'zh', '租客管理'],
    ['common.tenants', 'en', 'Tenants'],
    ['common.leases', 'zh', '租赁协议'],
    ['common.leases', 'en', 'Leases'],
    ['common.loans', 'zh', '贷款合同'],
    ['common.loans', 'en', 'Loans'],
    ['common.tax', 'zh', '税务申报'],
    ['common.tax', 'en', 'Tax Returns'],
    ['common.reports', 'zh', '报告中心'],
    ['common.reports', 'en', 'Reports'],
    ['common.appointments', 'zh', '服务预约'],
    ['common.appointments', 'en', 'Appointments'],
    ['common.mall', 'zh', '跨境商城'],
    ['common.mall', 'en', 'Mall'],
    ['common.settings', 'zh', '系统设置'],
    ['common.settings', 'en', 'Settings'],
    ['common.add', 'zh', '新增'],
    ['common.add', 'en', 'Add'],
    ['common.edit', 'zh', '编辑'],
    ['common.edit', 'en', 'Edit'],
    ['common.delete', 'zh', '删除'],
    ['common.delete', 'en', 'Delete'],
    ['common.save', 'zh', '保存'],
    ['common.save', 'en', 'Save'],
    ['common.cancel', 'zh', '取消'],
    ['common.cancel', 'en', 'Cancel'],
    ['common.search', 'zh', '搜索'],
    ['common.search', 'en', 'Search'],
    ['common.export', 'zh', '导出'],
    ['common.export', 'en', 'Export'],
    ['common.status', 'zh', '状态'],
    ['common.status', 'en', 'Status'],
    ['common.active', 'zh', '活跃'],
    ['common.active', 'en', 'Active'],
    ['common.inactive', 'zh', '非活跃'],
    ['common.inactive', 'en', 'Inactive'],
    ['common.pending', 'zh', '待处理'],
    ['common.pending', 'en', 'Pending'],
    ['common.paid', 'zh', '已支付'],
    ['common.paid', 'en', 'Paid'],
    ['common.overdue', 'zh', '逾期'],
    ['common.overdue', 'en', 'Overdue'],
    ['common.total', 'zh', '总计'],
    ['common.total', 'en', 'Total'],
    ['common.monthly', 'zh', '月度'],
    ['common.monthly', 'en', 'Monthly'],
    ['common.yearly', 'zh', '年度'],
    ['common.yearly', 'en', 'Yearly'],
    ['dashboard.rental_income', 'zh', '租金收益'],
    ['dashboard.rental_income', 'en', 'Rental Income'],
    ['dashboard.vacancy_rate', 'zh', '空置率'],
    ['dashboard.vacancy_rate', 'en', 'Vacancy Rate'],
    ['dashboard.maintenance_cost', 'zh', '维修成本'],
    ['dashboard.maintenance_cost', 'en', 'Maintenance Cost'],
    ['dashboard.total_properties', 'zh', '房产总数'],
    ['dashboard.total_properties', 'en', 'Total Properties'],
    ['dashboard.annual_yield', 'zh', '年化收益率'],
    ['dashboard.annual_yield', 'en', 'Annual Yield'],
    ['dashboard.cash_flow', 'zh', '现金流'],
    ['dashboard.cash_flow', 'en', 'Cash Flow'],
    ['compliance.arbn_valid', 'zh', 'ARBN验证通过'],
    ['compliance.arbn_valid', 'en', 'ARBN Verified'],
    ['compliance.arbn_invalid', 'zh', 'ARBN验证失败'],
    ['compliance.arbn_invalid', 'en', 'ARBN Invalid'],
    ['compliance.lease_clause_warning', 'zh', '租赁法条款提示'],
    ['compliance.lease_clause_warning', 'en', 'Lease Law Clause Warning'],
  ];

  const insertI18n = db.prepare(`
    INSERT OR IGNORE INTO i18n_translations (key, lang, value, namespace)
    VALUES (?, ?, ?, 'common')
  `);

  const transaction = db.transaction((items: any[][]) => {
    for (const item of items) {
      insertI18n.run(item[0], item[1], item[2]);
    }
  });

  transaction(i18nData);
  ensureDemoAccounts();
}

function ensureDemoAccounts() {
  const demoUsers = [
    {
      email: 'admin@ausproperty.com',
      password: 'admin123',
      full_name: '系统管理员',
      role: 'admin',
      phone: '+61 400 000 000',
      language: 'zh',
      timezone: 'Australia/Sydney',
    },
    {
      email: 'accountant@ausproperty.com',
      password: 'acc123',
      full_name: '张会计师',
      role: 'accountant',
      phone: '+61 400 000 001',
      language: 'zh',
      timezone: 'Australia/Sydney',
    },
    {
      email: 'owner1@example.com',
      password: 'user123',
      full_name: '李业主',
      role: 'user',
      phone: '+86 138 0000 0001',
      language: 'zh',
      timezone: 'Asia/Shanghai',
    },
  ];

  const upsertUser = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, phone, language, timezone, is_active)
    VALUES (@email, @password_hash, @full_name, @role, @phone, @language, @timezone, 1)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      full_name = excluded.full_name,
      role = excluded.role,
      phone = excluded.phone,
      language = excluded.language,
      timezone = excluded.timezone,
      is_active = 1,
      updated_at = CURRENT_TIMESTAMP
  `);

  for (const user of demoUsers) {
    const { password, ...userRow } = user;
    upsertUser.run({
      ...userRow,
      password_hash: bcrypt.hashSync(password, 10),
    });
  }
}

export default initDatabase;
