import app from './app.js';

const PORT = process.env.BACKEND_PORT || 59049;

const server = app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`Server ready on http://127.0.0.1:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});

export default app;
