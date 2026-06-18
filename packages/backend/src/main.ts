import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { tenantResolver } from './middleware/tenant.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import topicRoutes from './routes/topic.js';
import productRoutes from './routes/product.js';
import orderRoutes from './routes/order.js';
import redpacketRoutes from './routes/redpacket.js';
import secondhandRoutes from './routes/secondhand.js';
import partnerRoutes from './routes/partner.js';
import propertyRoutes from './routes/property.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(tenantResolver);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', redpacketRoutes);
app.use('/api/secondhand', secondhandRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ code: 500, message: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export default app;
