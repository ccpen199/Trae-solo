CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender TEXT DEFAULT '',
  birthday TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  parent_name TEXT DEFAULT '',
  parent_phone TEXT DEFAULT '',
  consultant TEXT DEFAULT '',
  learning_goal TEXT DEFAULT '',
  contract_attachment TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  hourly_rate REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classrooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 10,
  location TEXT DEFAULT '',
  equipment TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  total_hours REAL NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  discount REAL DEFAULT 1,
  gift_hours REAL DEFAULT 0,
  valid_months INTEGER DEFAULT 12,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT DEFAULT '',
  teacher_id INTEGER,
  classroom_id INTEGER,
  capacity INTEGER DEFAULT 10,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  schedule TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  package_id INTEGER,
  total_hours REAL NOT NULL DEFAULT 0,
  gift_hours REAL DEFAULT 0,
  used_hours REAL DEFAULT 0,
  remaining_hours REAL NOT NULL DEFAULT 0,
  unit_price REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  has_invoice INTEGER DEFAULT 0,
  invoice_amount REAL DEFAULT 0,
  invoice_no TEXT DEFAULT '',
  contract_no TEXT DEFAULT '',
  effective_date TEXT DEFAULT '',
  expiry_date TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  remark TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (package_id) REFERENCES course_packages(id)
);

CREATE TABLE IF NOT EXISTS student_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  purchase_id INTEGER,
  enroll_date TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'enrolled',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  teacher_id INTEGER,
  classroom_id INTEGER,
  course_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  capacity INTEGER DEFAULT 10,
  duration_hours REAL GENERATED ALWAYS AS (
    (strftime('%H', end_time) * 60 + strftime('%M', end_time) -
     strftime('%H', start_time) * 60 - strftime('%M', start_time)) / 60.0
  ) STORED,
  status TEXT DEFAULT 'scheduled',
  lesson_plan TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);

CREATE TABLE IF NOT EXISTS attendances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  purchase_id INTEGER NOT NULL,
  status TEXT DEFAULT 'reserved',
  checkin_time TEXT DEFAULT '',
  checkout_time TEXT DEFAULT '',
  consume_hours REAL DEFAULT 0,
  remark TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

CREATE TABLE IF NOT EXISTS consumptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  purchase_id INTEGER NOT NULL,
  attendance_id INTEGER,
  schedule_id INTEGER,
  hours REAL NOT NULL DEFAULT 0,
  unit_price REAL DEFAULT 0,
  amount REAL DEFAULT 0,
  consume_date TEXT NOT NULL,
  consume_type TEXT DEFAULT 'normal',
  remark TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (purchase_id) REFERENCES purchases(id),
  FOREIGN KEY (attendance_id) REFERENCES attendances(id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id)
);

CREATE TABLE IF NOT EXISTS refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  purchase_id INTEGER,
  refund_hours REAL NOT NULL DEFAULT 0,
  refund_amount REAL NOT NULL DEFAULT 0,
  used_hours REAL DEFAULT 0,
  has_invoice INTEGER DEFAULT 0,
  invoice_return_amount REAL DEFAULT 0,
  reason TEXT DEFAULT '',
  approval_status TEXT DEFAULT 'pending',
  approved_by TEXT DEFAULT '',
  approved_at TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_student_id INTEGER NOT NULL,
  to_student_id INTEGER NOT NULL,
  purchase_id INTEGER,
  transfer_hours REAL NOT NULL DEFAULT 0,
  transfer_amount REAL DEFAULT 0,
  reason TEXT DEFAULT '',
  approval_status TEXT DEFAULT 'pending',
  approved_by TEXT DEFAULT '',
  approved_at TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_student_id) REFERENCES students(id),
  FOREIGN KEY (to_student_id) REFERENCES students(id),
  FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON students(parent_phone);
CREATE INDEX IF NOT EXISTS idx_purchases_student ON purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(course_date);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule ON attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_date ON consumptions(consume_date);
CREATE INDEX IF NOT EXISTS idx_student_classes_student ON student_classes(student_id);
