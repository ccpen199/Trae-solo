const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  scheduleNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  driverName: {
    type: String,
    trim: true
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  ],
  totalWeight: {
    type: Number,
    default: 0
  },
  routePoints: [
    {
      address: {
        type: String,
        trim: true
      },
      orderNo: {
        type: String,
        trim: true
      },
      weight: {
        type: Number
      }
    }
  ],
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'in_progress', 'completed', 'cancelled']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
