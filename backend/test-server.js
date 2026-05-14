
const express = require('express');
const app = express();
const PORT = 9871;

app.get('/', function(req, res) {
  res.send('Test server works!');
});

app.get('/health', function(req, res) {
  res.json({ status: 'ok' });
});

app.listen(PORT, function() {
  console.log('Test server running on http://localhost:' + PORT);
});
