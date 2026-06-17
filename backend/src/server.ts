import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './db';
import { initSchema } from './db/schema';
import { seedDatabase } from './data/seed';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import riderRouter from './routes/rider';
import merchantRouter from './routes/merchant';
import adminRouter from './routes/admin';
import commonRouter from './routes/common';

const app = express();
const PORT = 58921;
const HOST = '127.0.0.1';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/rider', riderRouter);
app.use('/api/merchant', merchantRouter);
app.use('/api/admin', adminRouter);
app.use('/api/common', commonRouter);

app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      timestamp: new Date().toISOString()
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

const db = initDatabase();
initSchema(db);
seedDatabase(db);

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
