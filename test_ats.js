const http = require('http');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc4MDgyNDk4NCwiZXhwIjoxNzgzNDE2OTg0fQ.UtctyKgM6dwjzz14jEGke3QDzdqq3Ikd4RoHuDoTyRM';
const req = http.request({
  hostname: '127.0.0.1', port: 59067,
  path: '/api/export/9/ats',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('ATS导出成功:');
    console.log('长度:', result.atsText.length, '字符');
    console.log('前300字符:');
    console.log(result.atsText.substring(0, 300));
  });
});
req.write(JSON.stringify({ content: {} }));
req.end();
req.on('error', e => console.error('错误:', e.message));
