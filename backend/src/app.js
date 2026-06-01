require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./database/init');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const creditRoutes = require('./routes/credit');
const loanRoutes = require('./routes/loan');

const app = express();
const PORT = process.env.PORT || 48401;

app.use(cors({
  origin: ['http://localhost:48402', 'http://127.0.0.1:48402'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
  const oldJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object' && !('success' in data)) {
      return oldJson.call(this, { success: true, data });
    }
    return oldJson.call(this, data);
  };
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/loan', loanRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend should run on http://localhost:48402`);
});
