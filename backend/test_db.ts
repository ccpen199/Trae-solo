import Database from 'better-sqlite3';
const db = new Database('../data/app.sqlite');
try { console.log('1. pending cargo:', db.prepare("SELECT COUNT(*) as c FROM cargo WHERE status='pending'").get().c); } catch(e: any) { console.log('1. Error:', e.message); }
try { console.log('2. available vehicles:', db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status='available'").get().c); } catch(e: any) { console.log('2. Error:', e.message); }
try { console.log('3. in transit:', db.prepare("SELECT COUNT(*) as c FROM transport_tasks WHERE status IN ('loading','in_transit')").get().c); } catch(e: any) { console.log('3. Error:', e.message); }
try { console.log('4. pending contracts:', db.prepare("SELECT id,contract_no,status FROM contracts WHERE status IN ('draft','pending_signature') LIMIT 2").all()); } catch(e: any) { console.log('4. Error:', e.message); }
try { console.log('5. pending routes:', db.prepare("SELECT id,route_name,status FROM dedicated_routes WHERE status='pending_review' LIMIT 2").all()); } catch(e: any) { console.log('5. Error:', e.message); }
try { console.log('6. recent cargo:', db.prepare("SELECT id,cargo_name,origin_city,dest_city FROM cargo WHERE status='pending' ORDER BY created_at DESC LIMIT 3").all()); } catch(e: any) { console.log('6. Error:', e.message); }
try { console.log('7. recent vehicles:', db.prepare("SELECT id,plate_number,current_location FROM vehicles WHERE status='available' ORDER BY created_at DESC LIMIT 3").all()); } catch(e: any) { console.log('7. Error:', e.message); }
db.close();
