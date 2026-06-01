import sqlite3
conn = sqlite3.connect('data/app.sqlite')
c = conn.cursor()

print('=== All orders with full details ===')
c.execute('''
SELECT o.id, o.order_no, o.status, o.appointment_time, o.created_at,
       d.status as dispatch_status, d.dispatch_time, d.accept_time,
       r.status as onsite_status, r.created_at as onsite_created,
       (SELECT COUNT(*) FROM service_tickets WHERE order_id = o.id AND status IN ('open','in_progress')) as active_tickets,
       (SELECT COUNT(*) FROM service_tickets WHERE order_id = o.id) as total_tickets,
       s.status as settlement_status, s.total_fee
FROM orders o
LEFT JOIN dispatches d ON d.order_id = o.id AND d.status != 'rejected'
LEFT JOIN on_site_records r ON r.order_id = o.id
LEFT JOIN settlements s ON s.order_id = o.id
ORDER BY o.id
''')
for row in c.fetchall():
    print(f'Order {row[0]} ({row[1]}):')
    print(f'  status={row[2]}, appointment={row[3]}, created={row[4]}')
    print(f'  dispatch: status={row[5]}, time={row[6]}, accept={row[7]}')
    print(f'  onsite: status={row[8]}, created={row[9]}')
    print(f'  tickets: active={row[10]}, total={row[11]}')
    print(f'  settlement: status={row[12]}, fee={row[13]}')
    print()

print('=== All service tickets ===')
c.execute('''
SELECT st.id, st.order_id, o.order_no, st.type, st.status, st.handler_name, st.resolution, st.created_at, st.updated_at
FROM service_tickets st
LEFT JOIN orders o ON st.order_id = o.id
ORDER BY st.id
''')
for row in c.fetchall():
    print(f'Ticket {row[0]}: order={row[2]}, type={row[3]}, status={row[4]}, handler={row[5]}, resolution={row[6]}')
    print(f'  created={row[7]}, updated={row[8]}')
    print()

conn.close()
