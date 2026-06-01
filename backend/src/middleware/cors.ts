import cors from 'cors';

const ALLOWED_ORIGIN = 'http://127.0.0.1:43391';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || origin === ALLOWED_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
