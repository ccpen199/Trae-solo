const http = require('http');

function doRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const opts = {
      hostname: '127.0.0.1', port: 59168, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      }
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const loginRes = await doRequest('POST', '/api/auth/login', { username: 'admin', password: '123456' });
  console.log('[LOGIN admin] user:', JSON.stringify(loginRes.data.user || loginRes.data).slice(0, 200));
  const adminToken = loginRes.data.token;

  const stats = await doRequest('GET', '/api/stats/dashboard', null, adminToken);
  console.log('[STATS]', JSON.stringify(stats.data));

  const jobs = await doRequest('GET', '/api/jobs', null, adminToken);
  console.log('[JOBS admin] count:', (jobs.data.jobs || []).length);

  const resumes = await doRequest('GET', '/api/resumes', null, adminToken);
  console.log('[RESUMES admin] count:', (resumes.data.resumes || []).length);
  if ((resumes.data.resumes || []).length > 0) {
    console.log('  resume sample skills:', JSON.stringify(resumes.data.resumes[0].skills));
  }

  const notifs = await doRequest('GET', '/api/notifications', null, adminToken);
  console.log('[NOTIFS admin] count:', (notifs.data.notifications || []).length);

  const switchHR = await doRequest('POST', '/api/auth/switch-role', { role: 'hr' }, adminToken);
  console.log('[SWITCH hr] user role:', switchHR.data.user?.role, 'tenantId:', switchHR.data.user?.tenantId);
  const hrToken = switchHR.data.token;

  const jobsHR = await doRequest('GET', '/api/jobs', null, hrToken);
  console.log('[JOBS hr] count:', (jobsHR.data.jobs || []).length);

  const resumesHR = await doRequest('GET', '/api/resumes', null, hrToken);
  console.log('[RESUMES hr] count:', (resumesHR.data.resumes || []).length);

  const switchJS = await doRequest('POST', '/api/auth/switch-role', { role: 'jobseeker' }, hrToken);
  console.log('[SWITCH jobseeker] user role:', switchJS.data.user?.role);
  const jsToken = switchJS.data.token;

  const resumesJS = await doRequest('GET', '/api/resumes', null, jsToken);
  console.log('[RESUMES jobseeker] count:', (resumesJS.data.resumes || []).length);

  const match = await doRequest('GET', '/api/matching/jobs/recommend', null, jsToken);
  console.log('[MATCHING] count:', (match.data.recommendations || []).length);

  const topics = await doRequest('GET', '/api/community/topics', null, adminToken);
  console.log('[COMMUNITY]', JSON.stringify(topics.data).slice(0, 200));

  const courses = await doRequest('GET', '/api/lms/courses', null, adminToken);
  console.log('[COURSES]', JSON.stringify(courses.data).slice(0, 200));
})().catch(e => console.error('ERROR', e));
