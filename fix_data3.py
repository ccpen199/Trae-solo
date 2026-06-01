import sqlite3
conn = sqlite3.connect('data/app.sqlite')
c = conn.cursor()

print('=== Fixing data inconsistencies ===')

# 1. Fix Order 9 (INS20260009): appointment time should be before onsite/settlement
# Current: appointment=2026-06-01 but onsite/settlement on 2026-05-27
# Change appointment to 2026-05-28 10:00 to make timeline logical
c.execute('UPDATE orders SET appointment_time = "2026-05-28 10:00:00" WHERE id = 9')
print('Fixed INS20260009: appointment changed to 2026-05-28 10:00:00')

# 2. Fix Order 2 (INS20260002): has active ticket but order is completed + settlement paid
# The charge_dispute ticket should be resolved to show a complete closed-loop example
# Update ticket 1 to resolved with a resolution
c.execute('''
UPDATE service_tickets 
SET status = "resolved", 
    handler_name = "赵建国", 
    resolution = "经核实，加长铜管确实使用了2.1米，按150元/米标准收费，已向用户解释清楚并提供耗材进货凭证，用户认可。",
    updated_at = "2026-05-30 10:00:00"
WHERE id = 1
''')
print('Fixed Ticket 1 (charge_dispute for INS20260002): status changed to resolved with resolution')

# 3. Fix Order 5 (INS20260005): order status shows completed but no onsite/settlement, has active ticket
# Should be 'dispatched' with dispatch status 'assigned' (no accept time)
c.execute('UPDATE orders SET status = "dispatched" WHERE id = 5')
c.execute('UPDATE dispatches SET status = "assigned", accept_time = NULL WHERE id = 5')
print('Fixed INS20260005: order status changed to dispatched, dispatch set to assigned (not accepted)')

# 4. Fix dispatch 5 accept time that was before dispatch time
c.execute('UPDATE dispatches SET accept_time = NULL WHERE id = 5')

# 5. Add settlement for Order 3 (completed, has onsite, but settlement pending)
# Mark it as approved to show different statuses
c.execute('UPDATE settlements SET status = "approved", updated_at = "2026-05-31 10:00:00" WHERE id = 3')
print('Fixed INS20260003 settlement: changed from pending to approved')

# 6. Let's add a rejected dispatch for Order 7 to show a more complete scenario
# Actually, let's create a more realistic scenario: 
# Order 7 has a reschedule ticket, so let's keep it pending but add more info

conn.commit()

print('\n=== Verification ===')
c.execute('''
SELECT o.id, o.order_no, o.status, o.appointment_time,
       d.status as dispatch_status, d.accept_time,
       r.status as onsite_status,
       (SELECT COUNT(*) FROM service_tickets WHERE order_id = o.id AND status IN ('open','in_progress')) as active_tickets,
       s.status as settlement_status
FROM orders o
LEFT JOIN dispatches d ON d.order_id = o.id AND d.status != 'rejected'
LEFT JOIN on_site_records r ON r.order_id = o.id
LEFT JOIN settlements s ON s.order_id = o.id
ORDER BY o.id
''')
for row in c.fetchall():
    print(f'Order {row[1]}: status={row[2]}, appt={row[3]}')
    print(f'  dispatch={row[4]}, onsite={row[6]}, active_tickets={row[7]}, settlement={row[8]}')
    print()

print('\n=== Tickets ===')
c.execute('SELECT st.id, o.order_no, st.type, st.status, st.handler_name, st.resolution FROM service_tickets st LEFT JOIN orders o ON st.order_id = o.id ORDER BY st.id')
for row in c.fetchall():
    print(f'Ticket {row[0]}: {row[1]} {row[2]} status={row[3]} handler={row[4]}')
    if row[5]:
        print(f'  resolution: {row[5][:50]}...')

conn.close()
print('\nData fix complete!')
