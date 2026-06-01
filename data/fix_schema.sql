ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer';
ALTER TABLE users ADD COLUMN store_id INTEGER REFERENCES stores(id);

UPDATE users SET role = 'customer';

INSERT INTO users (phone, name, role, store_id) VALUES ('13900139001', '李技师', 'staff', 1);
INSERT INTO users (phone, name, role, store_id) VALUES ('13900139002', '王技师', 'staff', 1);
INSERT INTO users (phone, name, role, store_id) VALUES ('13900139003', '张技师', 'staff', 2);
INSERT INTO users (phone, name, role, store_id) VALUES ('13900139004', '赵技师', 'staff', 2);
INSERT INTO users (phone, name, role, store_id) VALUES ('13900139005', '陈技师', 'staff', 3);
INSERT INTO users (phone, name, role, store_id) VALUES ('13900139006', '刘经理', 'admin', 1);

INSERT INTO services (name, store_id, duration, price) VALUES ('专业洗剪吹', 1, 60, 68);
INSERT INTO services (name, store_id, duration, price) VALUES ('精油SPA', 1, 60, 198);
INSERT INTO services (name, store_id, duration, price) VALUES ('手部美甲', 1, 45, 98);
INSERT INTO services (name, store_id, duration, price) VALUES ('专业洗剪吹', 2, 60, 68);
INSERT INTO services (name, store_id, duration, price) VALUES ('精油SPA', 2, 60, 198);
INSERT INTO services (name, store_id, duration, price) VALUES ('睫毛嫁接', 2, 90, 168);
INSERT INTO services (name, store_id, duration, price) VALUES ('专业洗剪吹', 3, 60, 68);
INSERT INTO services (name, store_id, duration, price) VALUES ('手部美甲', 3, 45, 98);
INSERT INTO services (name, store_id, duration, price) VALUES ('睫毛嫁接', 3, 90, 168);
