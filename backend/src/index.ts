import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './utils/initDb';

import authRoutes from './routes/authRoutes';
import certificationRoutes from './routes/certificationRoutes';
import skillRoutes from './routes/skillRoutes';
import jobRoutes from './routes/jobRoutes';
import projectRoutes from './routes/projectRoutes';
import contractRoutes from './routes/contractRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import payrollRoutes from './routes/payrollRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '59066', 10);
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '49066', 10);
const PROJECT_DIR = process.env.PROJECT_DIR || process.cwd();

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.get('/uploads/certificates/:fileName', (req, res, next) => {
  const fileName = req.params.fileName;
  const filePath = path.join(uploadsDir, 'certificates', fileName);

  if (fs.existsSync(filePath) || !/^HA\d{9}\.jpg$/i.test(fileName)) {
    next();
    return;
  }

  const certNo = fileName.replace(/\.[^.]+$/, '');
  res.type('image/svg+xml').send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <rect width="900" height="560" fill="#f8fbff"/>
      <rect x="45" y="45" width="810" height="470" rx="18" fill="#ffffff" stroke="#1677ff" stroke-width="6"/>
      <text x="450" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#1f2937">Trade Certificate</text>
      <text x="450" y="235" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#4b5563">Verified demo credential</text>
      <text x="450" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#1677ff">${certNo}</text>
      <text x="450" y="405" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">Construction labor certification platform</text>
    </svg>
  `);
});

app.use('/uploads', express.static(uploadsDir));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'construction-labor-platform-backend',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', certificationRoutes);
app.use('/api', skillRoutes);
app.use('/api', jobRoutes);
app.use('/api', projectRoutes);
app.use('/api', contractRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', payrollRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

function checkPort(port: number): Promise<number | null> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t | head -n1`, (err: any, stdout: string) => {
      if (stdout.trim()) {
        resolve(parseInt(stdout.trim(), 10));
      } else {
        resolve(null);
      }
    });
  });
}

function getProcessCwd(pid: number): Promise<string> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`lsof -nP -a -p ${pid} -d cwd -Fn`, (err: any, stdout: string) => {
      if (err) {
        resolve('');
        return;
      }

      const cwdLine = stdout
        .split('\n')
        .find((line: string) => line.startsWith('n'));
      resolve(cwdLine ? cwdLine.slice(1).trim() : '');
    });
  });
}

function getProcessCommand(pid: number): Promise<string> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`ps -o command= -p ${pid}`, (err: any, stdout: string) => {
      resolve(err ? '' : stdout.trim());
    });
  });
}

async function verifyAndKillPort(port: number, portName: string) {
  const pid = await checkPort(port);
  if (pid) {
    const cwd = await getProcessCwd(pid);
    const cmd = await getProcessCommand(pid);
    if (cwd.startsWith(PROJECT_DIR) || cmd.includes('may-89066') || cmd.includes('construction-labor')) {
      console.log(`Killing ${portName} process on port ${port}, PID: ${pid}, cwd: ${cwd || 'unknown'}`);
      process.kill(pid, 'SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }

    console.log(`Port ${port} is occupied by another project (PID: ${pid}, cwd: ${cwd || 'unknown'}). Cannot kill.`);
    throw new Error(`Port ${port} occupied by foreign process. Please use alternative port.`);
  }
}

async function startServer() {
  const portSlots = [
    { fe: 40000 + 9066, be: 50000 + 9066 },
    { fe: 41000 + 9066, be: 51000 + 9066 },
    { fe: 42000 + 9066, be: 52000 + 9066 },
    { fe: 43000 + 9066, be: 53000 + 9066 },
    { fe: 44000 + 9066, be: 54000 + 9066 },
    { fe: 45000 + 9066, be: 55000 + 9066 }
  ];

  let currentFePort = PORT;
  let currentBePort = PORT;

  for (const slot of portSlots) {
    if (slot.be === PORT) {
      currentFePort = slot.fe;
      currentBePort = slot.be;
      break;
    }
  }

  try {
    await verifyAndKillPort(currentBePort, 'backend');
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  const server = app.listen(currentBePort, '127.0.0.1', () => {
    console.log(`🚀 Backend server is running on http://127.0.0.1:${currentBePort}`);
    console.log(`📦 API base: http://127.0.0.1:${currentBePort}/api`);
    console.log(`💊 Health check: http://127.0.0.1:${currentBePort}/api/health`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${currentBePort} is already in use.`);
      process.exit(1);
    }
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
