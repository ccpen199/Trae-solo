import './database/connection';
import app from './app';
import { config } from './config';

app.listen(config.PORT, config.HOST, () => {
  console.log(`🚀 Server is running on http://${config.HOST}:${config.PORT}`);
  console.log(`📡 API base path: /api`);
  console.log(`💾 Database initialized successfully`);
});
