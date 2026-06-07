const express = require('express');
const http = require('http');
const app = express();
app.use(express.json());
app.use('/api/rescue', require('./src/routes/rescue'));
app.use('/api/mentor', require('./src/routes/mentor'));
app.use('/api/community', require('./src/routes/community'));
app.use('/api/fault-codes', require('./src/routes/faultCodes'));
const server = app.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  const tests = [
    '/api/rescue',
    '/api/rescue/dispatch/recommend?lat=39.9&lng=116.4',
    '/api/rescue/1',
    '/api/mentor/pairs',
    '/api/mentor/tasks',
    '/api/community/posts',
    '/api/community/posts/1',
    '/api/fault-codes',
    '/api/fault-codes/1',
    '/api/fault-codes?search=P0087',
  ];
  let done = 0;
  let errors = 0;
  tests.forEach(url => {
    http.get('http://127.0.0.1:' + port + url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        console.log(res.statusCode, ok ? 'OK' : 'FAIL', url);
        if (!ok) errors++;
        done++;
        if (done === tests.length) {
          server.close();
          console.log(errors === 0 ? 'All endpoint tests passed' : errors + ' test(s) failed');
          process.exit(errors);
        }
      });
    });
  });
});
