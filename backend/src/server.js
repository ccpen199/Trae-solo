require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 57882;

app.use(cors());
app.use(express.json());

initDatabase();

require('./routes/inquiries')(app);
require('./routes/quotations')(app);
require('./routes/space')(app);
require('./routes/bookings')(app);
require('./routes/bl')(app);
require('./routes/settlements')(app);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
