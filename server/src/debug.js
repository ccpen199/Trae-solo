console.log('DEBUG 0: start');
const express = require('express');
console.log('DEBUG 1: express loaded');
const cors = require('cors');
console.log('DEBUG 2: cors loaded');
const path = require('path');
const fs = require('fs');
const config = require('./config');
console.log('DEBUG 3: config loaded', config.port, config.wsPort);
try {
  require('./config/database');
  console.log('DEBUG 4: database loaded');
} catch (e) {
  console.log('DEBUG 4 ERR:', e.message);
}
try {
  const wss = require('./websocket/streamServer');
  console.log('DEBUG 5: streamServer loaded, wss ok');
} catch (e) {
  console.log('DEBUG 5 ERR:', e.message, e.stack);
  process.exit(1);
}
console.log('DEBUG 6: all modules loaded');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ code: 200, data: { status: 'ok', timestamp: Date.now() } });
});

app.listen(config.port, config.host, () => {
  console.log(`Server started on port ${config.port}`);
});
