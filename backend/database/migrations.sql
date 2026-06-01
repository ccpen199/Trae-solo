ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE students ADD COLUMN updated_at TEXT DEFAULT '';

ALTER TABLE course_packages ADD COLUMN description TEXT DEFAULT '';
ALTER TABLE course_packages ADD COLUMN status TEXT DEFAULT 'active';

ALTER TABLE purchases ADD COLUMN invoice_no TEXT DEFAULT '';
ALTER TABLE purchases ADD COLUMN effective_date TEXT DEFAULT '';
ALTER TABLE purchases ADD COLUMN expiry_date TEXT DEFAULT '';
ALTER TABLE purchases ADD COLUMN remark TEXT DEFAULT '';
ALTER TABLE purchases ADD COLUMN updated_at TEXT DEFAULT '';

ALTER TABLE teachers ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE teachers ADD COLUMN updated_at TEXT DEFAULT '';

ALTER TABLE classrooms ADD COLUMN equipment TEXT DEFAULT '';
ALTER TABLE classrooms ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE classrooms ADD COLUMN updated_at TEXT DEFAULT '';

ALTER TABLE classes ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE classes ADD COLUMN updated_at TEXT DEFAULT '';

ALTER TABLE schedules ADD COLUMN lesson_plan TEXT DEFAULT '';
ALTER TABLE schedules ADD COLUMN updated_at TEXT DEFAULT '';

ALTER TABLE student_classes ADD COLUMN enroll_date TEXT DEFAULT '';
ALTER TABLE student_classes ADD COLUMN updated_at TEXT DEFAULT '';

ALTER TABLE attendances ADD COLUMN checkout_time TEXT DEFAULT '';
ALTER TABLE attendances ADD COLUMN remark TEXT DEFAULT '';
ALTER TABLE attendances ADD COLUMN updated_at TEXT DEFAULT '';

ALTER TABLE consumptions ADD COLUMN consume_type TEXT DEFAULT 'normal';
ALTER TABLE consumptions ADD COLUMN remark TEXT DEFAULT '';

ALTER TABLE refunds ADD COLUMN used_hours REAL DEFAULT 0;
ALTER TABLE refunds ADD COLUMN invoice_return_amount REAL DEFAULT 0;
ALTER TABLE refunds ADD COLUMN approved_at TEXT DEFAULT '';
ALTER TABLE refunds ADD COLUMN remark TEXT DEFAULT '';

ALTER TABLE transfers ADD COLUMN transfer_amount REAL DEFAULT 0;
ALTER TABLE transfers ADD COLUMN approved_at TEXT DEFAULT '';
ALTER TABLE transfers ADD COLUMN remark TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON students(parent_phone);
CREATE INDEX IF NOT EXISTS idx_purchases_student ON purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(course_date);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule ON attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_date ON consumptions(consume_date);
CREATE INDEX IF NOT EXISTS idx_student_classes_student ON student_classes(student_id);
