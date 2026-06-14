import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      real_name VARCHAR(50),
      phone VARCHAR(20) UNIQUE,
      id_card VARCHAR(18) UNIQUE,
      role VARCHAR(20) DEFAULT 'user',
      avatar VARCHAR(255),
      address TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cert_type VARCHAR(50) NOT NULL,
      cert_no VARCHAR(100) UNIQUE NOT NULL,
      cert_name VARCHAR(100) NOT NULL,
      issuer VARCHAR(100),
      issue_date DATE,
      expire_date DATE,
      status INTEGER DEFAULT 1,
      cert_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      icon VARCHAR(255),
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      icon VARCHAR(255),
      handling_time VARCHAR(100),
      handling_place VARCHAR(255),
      required_materials TEXT,
      handling_process TEXT,
      fee_standard TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES service_categories(id)
    );

    CREATE TABLE IF NOT EXISTS service_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_no VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      application_data TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 1,
      submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      accept_time DATETIME,
      complete_time DATETIME,
      rating INTEGER,
      comment TEXT,
      certificate_ids TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS scene_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      icon VARCHAR(255),
      service_ids TEXT,
      material_list TEXT,
      workflow_config TEXT,
      status INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scene_instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instance_no VARCHAR(50) UNIQUE NOT NULL,
      template_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 1,
      status VARCHAR(20) DEFAULT 'in_progress',
      step_results TEXT,
      application_data TEXT,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      complete_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES scene_templates(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type VARCHAR(20) NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      images TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      ticket_no VARCHAR(50) UNIQUE,
      handler_id INTEGER,
      handle_result TEXT,
      handle_time DATETIME,
      satisfaction_rating INTEGER,
      satisfaction_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS community_repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      repair_type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      address VARCHAR(255),
      contact_phone VARCHAR(20),
      images TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      assignee VARCHAR(50),
      handle_result TEXT,
      handle_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS community_help (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      help_type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      address VARCHAR(255),
      contact_phone VARCHAR(20),
      reward VARCHAR(100),
      images TEXT,
      status VARCHAR(20) DEFAULT 'open',
      helper_id INTEGER,
      complete_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bus_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_no VARCHAR(20) UNIQUE NOT NULL,
      route_name VARCHAR(100) NOT NULL,
      start_station VARCHAR(100),
      end_station VARCHAR(100),
      first_bus_time VARCHAR(10),
      last_bus_time VARCHAR(10),
      ticket_price DECIMAL(10,2),
      stations TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bus_realtime (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      plate_no VARCHAR(20),
      current_station INTEGER,
      next_station INTEGER,
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      passenger_count INTEGER,
      speed INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES bus_routes(id)
    );

    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50),
      address VARCHAR(255),
      description TEXT,
      open_time VARCHAR(100),
      close_time VARCHAR(100),
      capacity INTEGER,
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      contact_phone VARCHAR(20),
      images TEXT,
      facilities TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS venue_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_no VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      venue_id INTEGER NOT NULL,
      booking_date DATE NOT NULL,
      time_slot VARCHAR(50) NOT NULL,
      purpose TEXT,
      people_count INTEGER,
      contact_phone VARCHAR(20),
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (venue_id) REFERENCES venues(id)
    );

    CREATE TABLE IF NOT EXISTS service_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      monitor_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'online',
      response_time INTEGER,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS service_heatmap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER,
      region_code VARCHAR(20),
      region_name VARCHAR(50),
      request_count INTEGER DEFAULT 0,
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      stat_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS data_fusion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_type VARCHAR(20),
      stat_period VARCHAR(20),
      stat_date DATE,
      government_count INTEGER DEFAULT 0,
      people_count INTEGER DEFAULT 0,
      community_count INTEGER DEFAULT 0,
      total_count INTEGER DEFAULT 0,
      trend_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS access_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token VARCHAR(500) NOT NULL,
      token_type VARCHAR(20) DEFAULT 'Bearer',
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_cert_no ON certificates(cert_no);
    CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
    CREATE INDEX IF NOT EXISTS idx_services_code ON services(code);
    CREATE INDEX IF NOT EXISTS idx_service_applications_user_id ON service_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_service_applications_service_id ON service_applications(service_id);
    CREATE INDEX IF NOT EXISTS idx_service_applications_request_no ON service_applications(request_no);
    CREATE INDEX IF NOT EXISTS idx_service_applications_status ON service_applications(status);
    CREATE INDEX IF NOT EXISTS idx_scene_instances_template_id ON scene_instances(template_id);
    CREATE INDEX IF NOT EXISTS idx_scene_instances_user_id ON scene_instances(user_id);
    CREATE INDEX IF NOT EXISTS idx_scene_instances_status ON scene_instances(status);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
    CREATE INDEX IF NOT EXISTS idx_community_repairs_user_id ON community_repairs(user_id);
    CREATE INDEX IF NOT EXISTS idx_community_repairs_status ON community_repairs(status);
    CREATE INDEX IF NOT EXISTS idx_community_help_user_id ON community_help(user_id);
    CREATE INDEX IF NOT EXISTS idx_community_help_status ON community_help(status);
    CREATE INDEX IF NOT EXISTS idx_bus_routes_route_no ON bus_routes(route_no);
    CREATE INDEX IF NOT EXISTS idx_bus_realtime_route_id ON bus_realtime(route_id);
    CREATE INDEX IF NOT EXISTS idx_venue_bookings_user_id ON venue_bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_venue_bookings_venue_id ON venue_bookings(venue_id);
    CREATE INDEX IF NOT EXISTS idx_venue_bookings_booking_no ON venue_bookings(booking_no);
    CREATE INDEX IF NOT EXISTS idx_service_availability_service_id ON service_availability(service_id);
    CREATE INDEX IF NOT EXISTS idx_service_availability_monitor_time ON service_availability(monitor_time);
    CREATE INDEX IF NOT EXISTS idx_service_heatmap_region_code ON service_heatmap(region_code);
    CREATE INDEX IF NOT EXISTS idx_service_heatmap_stat_date ON service_heatmap(stat_date);
    CREATE INDEX IF NOT EXISTS idx_data_fusion_stat_date ON data_fusion(stat_date);
    CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON access_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_access_tokens_user_id ON access_tokens(user_id);
  `);
};

initTables();

export default db;
