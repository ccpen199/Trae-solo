import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { AppDataSource } from './data-source';
import { seedAll } from './utils/seeder';
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import resumeRoutes from './routes/resumeRoutes';
import jobseekerRoutes from './routes/jobseekerRoutes';
import communityRoutes from './routes/communityRoutes';
import interviewRoutes from './routes/interviewRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = 59151;
const HOST = '127.0.0.1';

app.use(cors({
  origin: ['http://127.0.0.1:49151', 'http://localhost:49151'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now()
  });
});

app.get(['/api/user/profile', '/api/users/profile'], (req: Request, res: Response) => {
  res.json({
    success: true,
    authenticated: false,
    data: null,
    message: '当前未登录'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/jobseeker', jobseekerRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/admin', adminRoutes);

AppDataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized!');

    const seedResult = await seedAll();
    console.log('Data initialization result:', {
      skills: seedResult.skills.message,
      sensitiveWords: seedResult.sensitiveWords.message,
      sampleData: seedResult.sampleData.message
    });

    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

export default app;
