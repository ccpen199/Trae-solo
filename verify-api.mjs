const BASE = 'http://localhost:3003/api';
let token = '', adminToken = '';

async function api(path, method = 'GET', body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return r.json();
}
async function apiAdmin(path, method = 'GET', body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminToken },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return r.json();
}

async function run() {
  const r1 = await api('/auth/login', 'POST', { phone: 'admin', password: '123456' });
  adminToken = r1.success ? r1.data.token : '';
  console.log('1. Admin login:', r1.success);

  const r2 = await api('/auth/login', 'POST', { phone: 'user1', password: '123456' });
  token = r2.success ? r2.data.token : '';
  console.log('2. User1 login:', r2.success);

  const r3 = await api('/events');
  console.log('3. Events list:', r3.success, 'total=' + r3.data.total);
  const eventId = r3.data.events[0].id;

  const r4 = await api('/events/' + eventId);
  console.log('4. Event detail:', r4.success, 'showtimes=' + r4.data.showtimes.length);
  const showtimeId = r4.data.showtimes[0].id;

  const r5 = await api('/showtimes/' + showtimeId + '/seats');
  console.log('5. Showtime seats:', r5.success, 'zones=' + r5.data.zones.length);

  const r6 = await api('/queue/join', 'POST', { showtimeId, seatIds: [] });
  console.log('6. Join queue:', r6.success);
  const qId = r6.data?.queueId;

  const r7 = await api('/queue/' + qId + '/status');
  console.log('7. Queue status:', r7.success, 'status=' + r7.data.status);

  const r8 = await apiAdmin('/analytics/heatmap/' + showtimeId);
  console.log('8. Heatmap:', r8.success);

  const r9 = await apiAdmin('/analytics/sales-ranking?type=zone');
  console.log('9. Sales ranking:', r9.success, 'rankings=' + r9.data.rankings.length);

  const r10 = await apiAdmin('/analytics/refund-analysis');
  console.log('10. Refund analysis:', r10.success, 'clusters=' + r10.data.clusters.length);

  const r11 = await api('/orders');
  console.log('11. Orders list:', r11.success, 'count=' + r11.data.length);

  const firstOrder = r11.data[0];
  if (firstOrder) {
    const firstTicket = firstOrder.tickets[0];
    if (firstTicket) {
      const r12 = await api('/tickets/verify', 'POST', { antiFakeCode: firstTicket.anti_fake_code });
      console.log('12. Ticket verify:', r12.success, 'valid=' + r12.data.valid);
    }
  }

  console.log('\n=== 所有核心API验证完成 ===');
}
run().catch(console.error);
