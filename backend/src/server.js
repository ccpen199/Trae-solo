require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./models/database');
const { authMiddleware } = require('./middleware/auth');

const dataSourcesRouter = require('./routes/dataSources');
const fieldCalibersRouter = require('./routes/fieldCalibers');
const { router: queryTasksRouter } = require('./routes/queryTasks');
const cleaningRulesRouter = require('./routes/cleaningRules');
const explanationReportsRouter = require('./routes/explanationReports');
const configurationRouter = require('./routes/configuration');

const app = express();
const PORT = process.env.BACKEND_PORT || 53378;
const HOST = '127.0.0.1';

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

initDatabase();

app.use(authMiddleware);

app.use('/api/data-sources', dataSourcesRouter);
app.use('/api/field-calibers', fieldCalibersRouter);
app.use('/api/query-tasks', queryTasksRouter);
app.use('/api/cleaning-rules', cleaningRulesRouter);
app.use('/api/explanation-reports', explanationReportsRouter);
app.use('/api/config', configurationRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, HOST, () => {
  console.log(`Backend server running at http://${HOST}:${PORT}`);
});
