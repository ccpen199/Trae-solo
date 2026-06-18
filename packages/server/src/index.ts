import express from 'express';
import cors from 'cors';
import http from 'http';
import config from './config';
import routes from './routes';
import { errorHandler } from './middleware';
import { initSocket } from './sockets';
import logger from './utils/logger';

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use(errorHandler);

server.listen(config.port, () => {
  logger.info(`🚀 Server is running on port ${config.port}`);
  logger.info(`📍 Environment: ${config.nodeEnv}`);
  logger.info(`🔌 Health check: http://localhost:${config.port}/api/health`);
});

export default app;
