import sqlite3
conn = sqlite3.connect('data/app.sqlite')
c = conn.cursor()

print('=== Current data state ===')
c.execute('SELECT o.id, o.order_no, o.status, o.consumer_name, d.id as dispatch_id, d.status as dispatch_status, r.id as onsite_id, r.status as onsite_status, s.id as settlement_id, s.status as settlement_status FROM orders o LEFT JOIN dispatches d ON d.order_id = o.id AND d.status != "rejected" LEFT JOIN on_site_records r ON r.order_id = o.id LEFT JOIN settlements s ON s.order_id = o.id ORDER BY o.id')
for row in c.fetchall():
    print(f'  {row}')

# Fix the inconsistent statuses
c.execute('UPDATE orders SET status = "installing" WHERE id = 4')
c.execute('UPDATE orders SET status = "dispatched" WHERE id = 5')
c.execute('UPDATE orders SET status = "dispatched" WHERE id = 6')
c.execute('UPDATE orders SET status = "pending" WHERE id = 9')

# Add full records for order 9
c.execute('''INSERT INTO dispatches (order_id, technician_id, service_center_id, dispatch_type, status, dispatch_time, accept_time, reject_reason)
             VALUES (9, 1, 1, 'auto', 'completed', '2026-05-27 19:10:00', '2026-05-27 19:20:00', null)''')

c.execute('''INSERT INTO on_site_records (order_id, technician_id, latitude, longitude, unboxing_photos, install_steps, auxiliary_charges, user_signature, exception_notes, status)
             VALUES (9, 1, 39.9087, 116.4605,
             '["https://img.example.com/unbox9a.jpg","https://img.example.com/unbox9b.jpg"]',
             '[{"step":1,"description":"确认安装位置","photo":"https://img.example.com/step9a.jpg"},{"step":2,"description":"固定挂板","photo":"https://img.example.com/step9b.jpg"},{"step":3,"description":"连接管路","photo":"https://img.example.com/step9c.jpg"},{"step":4,"description":"调试运行","photo":"https://img.example.com/step9d.jpg"}]',
             '[{"item":"加长铜管2米","quantity":2,"unit_price":150},{"item":"穿墙孔","quantity":1,"unit_price":80}]',
             'https://img.example.com/sign_test.png',
             null,
             'completed')''')

c.execute('''INSERT INTO settlements (order_id, brand_id, service_center_id, technician_id, service_fee, auxiliary_fee, total_fee, status, created_at, updated_at)
             VALUES (9, 1, 1, 1, 200, 380, 580, 'approved', '2026-05-27 21:00:00', '2026-05-27 22:00:00')''')

c.execute('UPDATE orders SET status = "completed", updated_at = "2026-05-27 21:30:00" WHERE id = 9')

conn.commit()

print('\n=== Fixed data state ===')
c.execute('SELECT o.id, o.order_no, o.status, o.consumer_name, d.id as dispatch_id, d.status as dispatch_status, r.id as onsite_id, r.status as onsite_status, s.id as settlement_id, s.status as settlement_status FROM orders o LEFT JOIN dispatches d ON d.order_id = o.id AND d.status != "rejected" LEFT JOIN on_site_records r ON r.order_id = o.id LEFT JOIN settlements s ON s.order_id = o.id ORDER BY o.id')
for row in c.fetchall():
    print(f'  {row}')

conn.close()
print('\nData fixed successfully!')
