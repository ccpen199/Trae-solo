const axios = require('axios');
const BASE = 'http://127.0.0.1:49023';

async function test() {
  try {
    console.log('=== 1. Login as author ===');
    const login = await axios.post(`${BASE}/api/auth/login`, { username: 'author1', password: 'author123' });
    const token = login.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('Login OK');

    console.log('\n=== 2. Get topics via proxy ===');
    const topics = await axios.get(`${BASE}/api/topics`);
    console.log(`Topics: ${topics.data.data.length}`);

    console.log('\n=== 3. Get contents via proxy ===');
    const contents = await axios.get(`${BASE}/api/contents`);
    console.log(`Contents: ${contents.data.data.total}`);

    console.log('\n=== 4. Get content detail ===');
    const firstContent = contents.data.data.list[0];
    const detail = await axios.get(`${BASE}/api/contents/${firstContent.id}`);
    console.log(`Detail: ${detail.data.data.title}, Views: ${detail.data.data.view_count}`);

    console.log('\n=== 5. Like content ===');
    const like = await axios.post(`${BASE}/api/contents/${firstContent.id}/like`, {}, { headers });
    console.log(`Liked: ${like.data.data.liked}`);

    console.log('\n=== 6. Add comment ===');
    const comment = await axios.post(`${BASE}/api/contents/${firstContent.id}/comments`, { body: 'Proxy test comment' }, { headers });
    console.log(`Comment: ${comment.data.message}`);

    console.log('\n=== 7. Get comments ===');
    const comments = await axios.get(`${BASE}/api/contents/${firstContent.id}/comments`);
    console.log(`Comments: ${comments.data.data.list.length}`);

    console.log('\n=== 8. Login as admin ===');
    const adminLogin = await axios.post(`${BASE}/api/auth/login`, { username: 'admin', password: 'admin123' });
    const adminToken = adminLogin.data.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    console.log('\n=== 9. Admin dashboard ===');
    const dash = await axios.get(`${BASE}/api/admin/dashboard`, { headers: adminHeaders });
    console.log(`Dashboard: Users=${dash.data.data.totalUsers}, Contents=${dash.data.data.totalContents}`);

    console.log('\n=== 10. Admin sensitive words ===');
    const words = await axios.get(`${BASE}/api/admin/sensitive-words`, { headers: adminHeaders });
    console.log(`Sensitive words: ${words.data.data.length}`);

    console.log('\n=== 11. Admin analytics ===');
    const analytics = await axios.get(`${BASE}/api/admin/analytics?period=weekly`, { headers: adminHeaders });
    console.log(`Weekly new contents: ${analytics.data.data.stats.newContents}`);

    console.log('\n=== 12. Notifications ===');
    const notifs = await axios.get(`${BASE}/api/notifications`, { headers });
    console.log(`Notifications: ${notifs.data.data.list.length}`);

    console.log('\n=== 13. Earnings ===');
    const earnings = await axios.get(`${BASE}/api/earnings/my`, { headers });
    console.log(`Earnings: total=${earnings.data.data.total_earnings}, tips=${earnings.data.data.tip_earnings}`);

    console.log('\n=== 14. Create collection ===');
    const coll = await axios.post(`${BASE}/api/collections`, { name: '我的收藏', description: '测试收藏夹' }, { headers });
    console.log(`Collection: ${coll.data.message}`);

    console.log('\n=== 15. Follow user ===');
    const follow = await axios.post(`${BASE}/api/users/08f20009-dc1f-4fc1-9dbb-b323dd806544/follow`, {}, { headers });
    console.log(`Follow: ${follow.data.message}`);

    console.log('\n=== ALL PROXY TESTS PASSED ===');
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

test();
