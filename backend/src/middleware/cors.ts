import cors from 'cors';

const corsOptions = {
  origin: 'http://127.0.0.1:49271',
  credentials: true,
  optionsSuccessStatus: 200,
};

export default cors(corsOptions);
