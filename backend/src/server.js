
const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9871;

app.use(cors());
app.use(express.json());

const users = [];
const verificationCodes = {};
const rides = [];
let userIdCounter = 1;
let rideIdCounter = 1;

app.get('/api/health', function(req, res) {
  res.json({ status: 'ok', message: 'Didi Backend is running' });
});

app.post('/api/auth/check-phone', function(req, res) {
  const phone = req.body.phone;
  const user = users.find(function(u) { return u.phone === phone; });
  res.json({ registered: user != null, phone: phone });
});

app.post('/api/auth/send-code', function(req, res) {
  const phone = req.body.phone;
  const code = Math.random().toString().slice(2, 8);
  verificationCodes[phone] = {
    code: code,
    expiresAt: Date.now() + 60 * 60 * 1000
  };
  console.log('Verification code for', phone, ':', code);
  res.json({ success: true, message: 'Code sent', verificationCode: code });
});

app.post('/api/auth/verify-code', function(req, res) {
  const phone = req.body.phone;
  const code = req.body.code;
  const stored = verificationCodes[phone];
  
  if (!stored) {
    return res.status(400).json({ success: false, message: 'Invalid code' });
  }
  
  if (stored.code !== code) {
    return res.status(400).json({ success: false, message: 'Invalid code' });
  }
  
  if (Date.now() > stored.expiresAt) {
    return res.status(400).json({ success: false, message: 'Code expired' });
  }
  
  res.json({ success: true });
});

app.post('/api/auth/register', function(req, res) {
  const phone = req.body.phone;
  const password = req.body.password;
  const user = {
    id: userIdCounter++,
    phone: phone,
    password: password,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  res.json({ success: true, userId: user.id });
});

app.post('/api/auth/login', function(req, res) {
  const phone = req.body.phone;
  const password = req.body.password;
  const user = users.find(function(u) { return u.phone === phone; });
  
  if (!user || user.password !== password) {
    return res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
  
  res.json({ success: true, userId: user.id, phone: user.phone });
});

app.post('/api/ride/create', function(req, res) {
  const ride = {
    id: rideIdCounter++,
    userId: req.body.userId,
    startLocation: req.body.startLocation,
    endLocation: req.body.endLocation,
    city: req.body.city || '北京',
    serviceType: req.body.serviceType || 'fast',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  rides.push(ride);
  res.json({ success: true, rideId: ride.id });
});

app.get('/api/ride/list/:userId', function(req, res) {
  const userId = parseInt(req.params.userId);
  const userRides = rides.filter(function(r) { return r.userId === userId; });
  res.json({ rides: userRides });
});

app.get('/api/ride/:rideId', function(req, res) {
  const rideId = parseInt(req.params.rideId);
  const ride = rides.find(function(r) { return r.id === rideId; });
  if (!ride) {
    return res.status(404).json({ success: false, message: 'Ride not found' });
  }
  res.json({ ride: ride });
});

app.listen(PORT, function() {
  console.log('Didi Backend running on http://localhost:' + PORT);
});
