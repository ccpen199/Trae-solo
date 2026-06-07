const axios = require('axios');
const BASE = 'http://127.0.0.1:49023';

async function test() {
  try {
    console.log('=== 1. Login as author1 ===');
    const login = await axios.post(`${BASE}/api/auth/login`, { username: 'author1', password: 'author123' });
    const token = login.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('Author token:', token.substring(0, 30) + '...');

    console.log('');
    console.log('=== 2. Get topic by slug (food) ===');
    const topicRes = await axios.get(`${BASE}/api/topics/food`);
    console.log('Topic found:', topicRes.data.data.name, '| post_count:', topicRes.data.data.post_count);

    console.log('');
    console.log('=== 3. Get topic contents ===');
    const contentsRes = await axios.get(`${BASE}/api/topics/food/contents`);
    console.log('Topic contents count:', contentsRes.data.data.list.length);

    console.log('');
    console.log('=== 4. List topics ===');
    const topicsRes = await axios.get(`${BASE}/api/topics`);
    console.log('Topics list count:', topicsRes.data.data.length);
    topicsRes.data.data.slice(0, 3).forEach(t => {
      console.log('  -', t.name, '| post_count:', t.post_count);
    });

    console.log('');
    console.log('=== 5. City filter ===');
    const cityRes = await axios.get(`${BASE}/api/contents`, { params: { city: '北京' } });
    console.log('Beijing contents:', cityRes.data.data.list.length);

    console.log('');
    console.log('=== 6. Hot contents ===');
    const hotRes = await axios.get(`${BASE}/api/contents`, { params: { sort: 'hot' } });
    console.log('Hot contents:', hotRes.data.data.list.length);
    hotRes.data.data.list.slice(0, 3).forEach((c, i) => {
      console.log('  ', i+1, c.title, '| likes:', c.like_count, '| views:', c.view_count);
    });

    console.log('');
    console.log('=== 7. Follow topic ===');
    const firstTopic = topicsRes.data.data[0];
    const followRes = await axios.post(`${BASE}/api/topics/${firstTopic.id}/follow`, {}, { headers });
    console.log('Follow result:', followRes.data.data.followed ? 'followed' : 'unfollowed');

    console.log('');
    console.log('=== 8. Following contents filter ===');
    const followingRes = await axios.get(`${BASE}/api/contents`, { params: { following: '1' }, headers });
    console.log('Following contents:', followingRes.data.data.list.length);

    console.log('');
    console.log('=== 9. Earnings stats ===');
    const earningsRes = await axios.get(`${BASE}/api/earnings/my`, { headers });
    console.log('Earnings: total=' + earningsRes.data.data.total_earnings + ', level=' + earningsRes.data.data.creator_level + ', score=' + earningsRes.data.data.creator_score);

    console.log('');
    console.log('=== 10. Admin dashboard ===');
    const adminLogin = await axios.post(`${BASE}/api/auth/login`, { username: 'admin', password: 'admin123' });
    const adminHeaders = { Authorization: `Bearer ${adminLogin.data.data.token}` };
    const dashRes = await axios.get(`${BASE}/api/admin/dashboard`, { headers: adminHeaders });
    console.log('Dashboard: users=' + dashRes.data.data.totalUsers + ', contents=' + dashRes.data.data.totalContents + ', pending=' + dashRes.data.data.pendingReviews);

    console.log('');
    console.log('=== 11. Analytics ===');
    const analyticsRes = await axios.get(`${BASE}/api/admin/analytics?period=weekly`, { headers: adminHeaders });
    console.log('Weekly: newUsers=' + analyticsRes.data.data.stats.newUsers + ', newContents=' + analyticsRes.data.data.stats.newContents);

    console.log('');
    console.log('=== 12. Sensitive words ===');
    const swRes = await axios.get(`${BASE}/api/admin/sensitive-words`, { headers: adminHeaders });
    console.log('Sensitive words count:', swRes.data.data.length);

    console.log('');
    console.log('=== ALL TESTS PASSED ===');
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

test();
