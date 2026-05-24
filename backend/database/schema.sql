DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS vaccines;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS service_slots;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS transport_tasks;
DROP TABLE IF EXISTS service_records;
DROP TABLE IF EXISTS service_photos;
DROP TABLE IF EXISTS fee_orders;
DROP TABLE IF EXISTS boarding_rooms;
DROP TABLE IF EXISTS boarding_stays;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS consumables;
DROP TABLE IF EXISTS service_consumables;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS operation_stats;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'store', 'staff', 'driver', 'customer_service', 'admin')),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    store_id INTEGER,
    avatar TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
    breed TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    weight REAL,
    size TEXT CHECK (size IN ('small', 'medium', 'large', 'xlarge')),
    age INTEGER,
    is_aggressive INTEGER DEFAULT 0,
    aggression_notes TEXT,
    health_notes TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE vaccines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    vaccine_name TEXT NOT NULL,
    vaccine_date DATE NOT NULL,
    expire_date DATE NOT NULL,
    certificate_no TEXT,
    certificate_photo TEXT,
    hospital TEXT,
    notes TEXT,
    status TEXT DEFAULT 'valid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id)
);

CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('wash', 'groom', 'boarding', 'transport', 'other')),
    description TEXT,
    base_price REAL NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    pet_species TEXT DEFAULT 'all',
    min_weight REAL DEFAULT 0,
    max_weight REAL DEFAULT 100,
    allow_aggressive INTEGER DEFAULT 0,
    capacity_per_slot INTEGER DEFAULT 1,
    room_required INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES users(id)
);

CREATE TABLE service_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INTEGER DEFAULT 1,
    current_booked INTEGER DEFAULT 0,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE boarding_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    room_no TEXT NOT NULL,
    room_type TEXT NOT NULL,
    size TEXT,
    max_pets INTEGER DEFAULT 1,
    daily_rate REAL NOT NULL,
    facilities TEXT,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES users(id)
);

CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL,
    pet_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    slot_id INTEGER,
    store_id INTEGER NOT NULL,
    staff_id INTEGER,
    appointment_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    pickup_address TEXT,
    delivery_address TEXT,
    need_pickup INTEGER DEFAULT 0,
    need_delivery INTEGER DEFAULT 0,
    special_requirements TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    vaccine_checked INTEGER DEFAULT 0,
    vaccine_valid INTEGER DEFAULT 0,
    size_checked INTEGER DEFAULT 0,
    aggression_checked INTEGER DEFAULT 0,
    capacity_checked INTEGER DEFAULT 0,
    check_in_time DATETIME,
    check_out_time DATETIME,
    cancel_reason TEXT,
    cancelled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (pet_id) REFERENCES pets(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (slot_id) REFERENCES service_slots(id),
    FOREIGN KEY (store_id) REFERENCES users(id),
    FOREIGN KEY (staff_id) REFERENCES users(id)
);

CREATE TABLE boarding_stays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE,
    actual_check_out DATE,
    extended_days INTEGER DEFAULT 0,
    feeding_requirements TEXT,
    medication_requirements TEXT,
    special_notes TEXT,
    daily_rate REAL NOT NULL,
    total_days INTEGER,
    total_amount REAL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (room_id) REFERENCES boarding_rooms(id)
);

CREATE TABLE transport_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_no TEXT UNIQUE NOT NULL,
    appointment_id INTEGER NOT NULL,
    driver_id INTEGER,
    task_type TEXT NOT NULL CHECK (task_type IN ('pickup', 'delivery')),
    pet_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    scheduled_time DATETIME,
    estimated_arrival TIME,
    actual_pickup_time DATETIME,
    actual_delivery_time DATETIME,
    handover_photo TEXT,
    status TEXT DEFAULT 'pending',
    delay_reason TEXT,
    delay_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (pet_id) REFERENCES pets(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL,
    service_start_time DATETIME,
    service_end_time DATETIME,
    actual_duration INTEGER,
    wash_steps TEXT,
    groom_style TEXT,
    abnormal_findings TEXT,
    stress_reaction INTEGER DEFAULT 0,
    stress_details TEXT,
    notes TEXT,
    status TEXT DEFAULT 'in_progress',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (staff_id) REFERENCES users(id)
);

CREATE TABLE service_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    appointment_id INTEGER NOT NULL,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'during', 'after', 'progress', 'handover')),
    photo_url TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES service_records(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE consumables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    stock_quantity REAL DEFAULT 0,
    unit_cost REAL NOT NULL,
    supplier TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES users(id)
);

CREATE TABLE service_consumables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    consumable_id INTEGER NOT NULL,
    quantity_used REAL NOT NULL,
    unit_cost REAL NOT NULL,
    total_cost REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES service_records(id),
    FOREIGN KEY (consumable_id) REFERENCES consumables(id)
);

CREATE TABLE fee_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    appointment_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    service_fee REAL NOT NULL DEFAULT 0,
    transport_fee REAL DEFAULT 0,
    consumable_fee REAL DEFAULT 0,
    extra_fee REAL DEFAULT 0,
    extra_fee_reason TEXT,
    discount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    payment_method TEXT,
    payment_time DATETIME,
    status TEXT DEFAULT 'unpaid',
    dispute_reason TEXT,
    dispute_status TEXT DEFAULT 'none',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES users(id)
);

CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    staff_id INTEGER,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    photos TEXT,
    is_repurchase INTEGER DEFAULT 0,
    repurchase_appointment_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES users(id),
    FOREIGN KEY (staff_id) REFERENCES users(id)
);

CREATE TABLE complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_no TEXT UNIQUE NOT NULL,
    appointment_id INTEGER,
    owner_id INTEGER NOT NULL,
    store_id INTEGER,
    complaint_type TEXT NOT NULL,
    description TEXT NOT NULL,
    photos TEXT,
    status TEXT DEFAULT 'pending',
    handler_id INTEGER,
    handle_result TEXT,
    compensation_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    handled_at DATETIME,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES users(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    related_id INTEGER,
    related_type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE operation_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL,
    store_id INTEGER,
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    total_service_duration INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    repurchase_count INTEGER DEFAULT 0,
    complaint_count INTEGER DEFAULT 0,
    complaint_resolved INTEGER DEFAULT 0,
    consumable_cost REAL DEFAULT 0,
    staff_performance TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (stat_date, store_id)
);

CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_vaccines_pet ON vaccines(pet_id);
CREATE INDEX idx_services_store ON services(store_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_slots_service_date ON service_slots(service_id, date);
CREATE INDEX idx_appointments_owner ON appointments(owner_id);
CREATE INDEX idx_appointments_store ON appointments(store_id);
CREATE INDEX idx_appointments_pet ON appointments(pet_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_transport_appointment ON transport_tasks(appointment_id);
CREATE INDEX idx_transport_driver ON transport_tasks(driver_id);
CREATE INDEX idx_transport_status ON transport_tasks(status);
CREATE INDEX idx_records_appointment ON service_records(appointment_id);
CREATE INDEX idx_photos_record ON service_photos(record_id);
CREATE INDEX idx_fee_appointment ON fee_orders(appointment_id);
CREATE INDEX idx_fee_owner ON fee_orders(owner_id);
CREATE INDEX idx_fee_status ON fee_orders(status);
CREATE INDEX idx_reviews_appointment ON reviews(appointment_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_stats_date ON operation_stats(stat_date);
