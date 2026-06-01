import sqlite3
conn = sqlite3.connect('data/app.sqlite')
c = conn.cursor()

# Fix dispatches 5 and 6 - set back to 'assigned' with no accept_time
c.execute('UPDATE dispatches SET status = "assigned", accept_time = NULL WHERE id = 5')
c.execute('UPDATE dispatches SET status = "assigned", accept_time = NULL WHERE id = 6')

# Make sure orders 5 and 6 are 'dispatched' (they should have dispatch assigned, not completed)
c.execute('UPDATE orders SET status = "dispatched" WHERE id = 5')
c.execute('UPDATE orders SET status = "dispatched" WHERE id = 6')

# Order 4 should be 'installing' (onsite in_progress)
c.execute('UPDATE orders SET status = "installing" WHERE id = 4')

# Add settlement for order 4 (it's installing but no settlement yet - that's correct for an in-progress order)
# Add settlement for order 4 once it's completed - but since it's still installing, no settlement yet

# Now let's add an onsite record for order 6 to show a more complete example
# Wait - order 6 is only dispatched, not yet accepted, so no onsite record yet. That's correct.

# Let's also add a ticket for order 5 to show a ticket attached to a dispatched order
c.execute('''INSERT INTO service_tickets (order_id, type, description, status, handler_name, resolution, created_at, updated_at)
             VALUES (5, 'missing_parts', '用户反映缺少室外机支架配件，需要补发', 'open', null, null, '2026-05-30 18:00:00', '2026-05-30 18:00:00')''')

conn.commit()

print('=== Verification ===')
c.execute('SELECT o.id, o.order_no, o.status, d.status as dispatch_status, d.accept_time, r.status as onsite_status, s.status as settlement_status FROM orders o LEFT JOIN dispatches d ON d.order_id = o.id AND d.status != "rejected" LEFT JOIN on_site_records r ON r.order_id = o.id LEFT JOIN settlements s ON s.order_id = o.id ORDER BY o.id')
for row in c.fetchall():
    print(f'  {row}')

print('\n=== Tickets ===')
c.execute('SELECT * FROM service_tickets')
for row in c.fetchall():
    print(f'  {row}')

conn.close()
print('\nData fix complete!')
