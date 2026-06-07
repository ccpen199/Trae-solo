const cors = require('cors');

const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://127.0.0.1:49010',
      'http://localhost:49010',
      'http://127.0.0.1:50010',
      'http://localhost:50010'
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = cors(corsOptions);
