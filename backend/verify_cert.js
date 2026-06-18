const Database = require('better-sqlite3');
const axios = require('axios');

const db = new Database('data/app.sqlite');
const cert = db.prepare('SELECT * FROM training_progress WHERE certificate_hash IS NOT NULL LIMIT 1').get();
console.log('证书记录:', cert.worker_id, cert.certificate_hash.slice(0, 20) + '...');

const url = `http://127.0.0.1:59231/api/training/certificates/${cert.worker_id}/verify/${cert.certificate_hash}`;
axios.get(url).then(res => {
  console.log('证书验证结果: valid =', res.data.valid);
  if (res.data.valid) {
    console.log('  worker_id:', res.data.data.worker_id);
    console.log('  course_id:', res.data.data.course_id);
    console.log('  score:', res.data.data.quiz_score);
    console.log('  completed_at:', res.data.data.completed_at);
    console.log('  certificate_hash:', res.data.data.certificate_hash.slice(0, 20) + '...');
  }
}).catch(e => {
  console.error('错误:', e.response?.data || e.message);
});
