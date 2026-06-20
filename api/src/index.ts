import './database/connection';
import app from './app';
import { config } from './config';

app.listen(config.PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${config.PORT}`);
  console.log(`📡 API base path: /api`);
  console.log(`💾 Database initialized successfully`);
});

