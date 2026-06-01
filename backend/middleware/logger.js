import dayjs from 'dayjs';

function logger(req, res, next) {
  const start = Date.now();
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

function requestLogger(req, res, next) {
  console.log(`${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
}

export { logger, requestLogger };
export default logger;
