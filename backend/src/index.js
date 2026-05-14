const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = parseInt(process.env.PORT) || 1999;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:2999',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

const authRouter = require('./routes/auth');
const postsRouter = require('./routes/posts');
const productsRouter = require('./routes/products');
const designersRouter = require('./routes/designers');
const couponsRouter = require('./routes/coupons');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const casesRouter = require('./routes/cases');
const homeRouter = require('./routes/home');

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/products', productsRouter);
app.use('/api/designers', designersRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/cases', casesRouter);
app.use('/api/home', homeRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '合家具服务正常运行' });
});

app.listen(PORT, () => {
  console.log(`合家具后端服务已启动，访问地址: http://localhost:${PORT}`);
});