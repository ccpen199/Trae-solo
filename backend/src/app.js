require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('../config/database');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const deviceProtocol = require('./protocols');
const { Device, DeviceUsage, Booking } = require('./models');
const { checkAndAwardEcoRewards } = require('./controllers/ecoIncentiveController');
const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');

dayjs.extend(isBetween);

const app = express();
const PORT = process.env.PORT || 3001;

connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', routes);

deviceProtocol.on('device:heartbeat', async ({ deviceCode, data }) => {
  try {
    await Device.findOneAndUpdate(
      { deviceCode },
      { 
        lastHeartbeat: new Date(),
        status: 'online',
        ...(data?.status && { workingStatus: data.status }),
      }
    );
    console.log(`Heartbeat received from ${deviceCode}`);
  } catch (error) {
    console.error('Error processing heartbeat:', error);
  }
});

deviceProtocol.on('device:fault', async ({ deviceCode, faultCode, faultMessage }) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceCode },
      { 
        status: 'faulty',
        workingStatus: 'paused',
        $inc: { faultCount: 1 },
      },
      { new: true }
    );
    console.log(`Fault reported from ${deviceCode}: ${faultMessage}`);
  } catch (error) {
    console.error('Error processing fault:', error);
  }
});

deviceProtocol.on('device:status', async ({ deviceCode, status }) => {
  try {
    await Device.findOneAndUpdate(
      { deviceCode },
      { workingStatus: status }
    );
  } catch (error) {
    console.error('Error processing status update:', error);
  }
});

deviceProtocol.on('command:executed', async ({ deviceId, command, result }) => {
  try {
    if (command === 'stop' && result?.result?.data) {
      const deviceUsage = await DeviceUsage.findOne({
        deviceId,
        status: 'started',
      }).sort({ startTime: -1 });

      if (deviceUsage && deviceUsage.userId && deviceUsage.deviceType) {
        await checkAndAwardEcoRewards(deviceUsage.userId, deviceUsage.deviceType);
      }
    }
  } catch (error) {
    console.error('Error processing command executed event:', error);
  }
});

setInterval(async () => {
  try {
    const timeout = new Date(Date.now() - 5 * 60 * 1000);
    await Device.updateMany(
      { 
        status: 'online',
        lastHeartbeat: { $lt: timeout },
      },
      { status: 'offline' }
    );
  } catch (error) {
    console.error('Error checking device heartbeats:', error);
  }
}, 60 * 1000);

setInterval(async () => {
  try {
    const now = new Date();
    await Booking.updateMany(
      {
        status: 'pending',
        createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) },
      },
      { status: 'expired' }
    );

    const expiredConfirmed = await Booking.find({
      status: 'confirmed',
      endTime: { $lt: now },
    });

    for (const booking of expiredConfirmed) {
      if (booking.workingStatus !== 'active') {
        booking.status = 'expired';
        await booking.save();
        
        const device = await Device.findById(booking.deviceId);
        if (device && device.workingStatus === 'reserved') {
          device.workingStatus = 'idle';
          await device.save();
        }
      }
    }
  } catch (error) {
    console.error('Error processing expired bookings:', error);
  }
}, 5 * 60 * 1000);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
