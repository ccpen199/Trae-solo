import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './database';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transaction';
import chatRoutes from './routes/chat';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 48381;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});