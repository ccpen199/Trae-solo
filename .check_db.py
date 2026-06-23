import sqlite3
conn = sqlite3.connect('api/data/pickup.db')
c = conn.cursor()
print("Today:", __import__('datetime').date.today())
print()
print("=== courier1 tasks ===")
c.execute("""
    SELECT id, task_no, courier_id, status, 
           appointment_time, DATE(appointment_time) as appt_date
    FROM pickup_tasks 
    WHERE courier_id = 'u_courier1' 
    ORDER BY appointment_time
""")
for r in c.fetchall():
    print(r)

print()
print("=== All pending tasks ===")
c.execute("""
    SELECT id, task_no, courier_id, status, 
           appointment_time, DATE(appointment_time) as appt_date
    FROM pickup_tasks 
    WHERE status = 'pending'
    ORDER BY appointment_time
    LIMIT 10
""")
for r in c.fetchall():
    print(r)

print()
print("=== Task stats by status ===")
c.execute("SELECT status, COUNT(*) FROM pickup_tasks GROUP BY status")
for r in c.fetchall():
    print(r)
