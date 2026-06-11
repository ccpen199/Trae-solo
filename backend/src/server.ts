import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDb } from './db/database';
import routes from './routes';
import { startOcppGateway } from './services/ocppGateway';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export function startServer() {
  initDb();

  app.listen(config.port, config.host, () => {
    console.log(`API Server running on http://${config.host}:${config.port}`);
  });

  startOcppGateway();

  return app;
}
