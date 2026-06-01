const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const sendVerificationCode = async (req, res) => {
  const { phone, email, type = 'login' } = req.body;

  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone or email required' });
  }

  if (phone && !validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  if (email && !validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const code = generateVerificationCode();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  const stmt = db.prepare(`
    INSERT INTO verification_codes (id, phone, email, code, type, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(uuidv4(), phone || null, email || null, code, type, expiresAt, Date.now());

  console.log(`Verification code for ${phone || email}: ${code}`);

  res.json({ success: true, message: 'Verification code sent', code: code });
};

const verifyCodeAndLogin = async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code required' });
  }

  const verification = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE phone = ? AND code = ? AND expires_at > ?
    ORDER BY created_at DESC LIMIT 1
  `).get(phone, code, Date.now());

  if (!verification) {
    return res.status(400).json({ error: 'Invalid or expired verification code' });
  }

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (!user) {
    const userId = uuidv4();
    const personalMeetingId = Math.floor(100000000 + Math.random() * 900000000).toString();
    
    db.prepare(`
      INSERT INTO users (id, phone, name, personal_meeting_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, phone, `用户${phone.slice(-4)}`, personalMeetingId, Date.now(), Date.now());
    
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      personalMeetingId: user.personal_meeting_id
    }
  });
};

const register = async (req, res) => {
  const { phone, email, password, code, name } = req.body;

  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone or email required' });
  }

  if (phone && !validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  if (email && !validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (!code) {
    return res.status(400).json({ error: 'Verification code required' });
  }

  const verification = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE (phone = ? OR email = ?) AND code = ? AND expires_at > ?
    ORDER BY created_at DESC LIMIT 1
  `).get(phone || null, email || null, code, Date.now());

  if (!verification) {
    return res.status(400).json({ error: 'Invalid or expired verification code' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE phone = ? OR email = ?').get(phone || null, email || null);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const userId = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const personalMeetingId = Math.floor(100000000 + Math.random() * 900000000).toString();

  db.prepare(`
    INSERT INTO users (id, phone, email, password, name, personal_meeting_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, phone || null, email || null, hashedPassword, name || `新用户`, personalMeetingId, Date.now(), Date.now());

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user: {
      id: userId,
      phone,
      email,
      name: name || '新用户',
      personalMeetingId
    }
  });
};

const passwordLogin = async (req, res) => {
  const { phone, email, password } = req.body;

  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone or email required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(phone || null, email || null);
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (!user.password) {
    return res.status(401).json({ error: 'Please use verification code login' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      personalMeetingId: user.personal_meeting_id
    }
  });
};

const ssoLogin = async (req, res) => {
  const { enterprise, token: ssoToken } = req.body;

  if (!enterprise || !ssoToken) {
    return res.status(400).json({ error: 'Enterprise and SSO token required' });
  }

  const mockSSOUserId = uuidv4();
  const mockEmail = `user@${enterprise}.com`;

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(mockEmail);

  if (!user) {
    const personalMeetingId = Math.floor(100000000 + Math.random() * 900000000).toString();
    db.prepare(`
      INSERT INTO users (id, email, name, personal_meeting_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(mockSSOUserId, mockEmail, `${enterprise}员工`, personalMeetingId, Date.now(), Date.now());
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(mockSSOUserId);
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      personalMeetingId: user.personal_meeting_id
    }
  });
};

const wechatLogin = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'WeChat code required' });
  }

  const mockWechatOpenId = `wx_${uuidv4().slice(0, 8)}`;
  const mockPhone = `138${Math.floor(10000000 + Math.random() * 90000000)}`;

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(mockPhone);

  if (!user) {
    const userId = uuidv4();
    const personalMeetingId = Math.floor(100000000 + Math.random() * 900000000).toString();
    db.prepare(`
      INSERT INTO users (id, phone, name, personal_meeting_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, mockPhone, '微信用户', personalMeetingId, Date.now(), Date.now());
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      personalMeetingId: user.personal_meeting_id
    }
  });
};

const getCurrentUser = (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

const guestJoinMeeting = async (req, res) => {
  const { meetingNumber, phone, code, name } = req.body;

  if (!meetingNumber) {
    return res.status(400).json({ error: 'Meeting number required' });
  }

  if (phone) {
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    if (!code) {
      return res.status(400).json({ error: 'Verification code required' });
    }
    
    const verification = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE phone = ? AND code = ? AND expires_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, code, Date.now());

    if (!verification) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
  }

  const meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingNumber);
  
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  if (meeting.status !== 'active') {
    return res.status(400).json({ error: 'Meeting is not active' });
  }

  const participantId = uuidv4();
  const participantName = name || '访客用户';

  db.prepare(`
    INSERT INTO meeting_participants (id, meeting_id, name, role, status, joined_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(participantId, meeting.id, participantName, 'guest', 'joined', Date.now());

  const guestToken = jwt.sign({ participantId, meetingId: meeting.id, isGuest: true }, process.env.JWT_SECRET, { expiresIn: '24h' });

  res.json({
    success: true,
    token: guestToken,
    meeting: {
      id: meeting.id,
      meetingNumber: meeting.meeting_number,
      title: meeting.title,
      hostId: meeting.host_id
    },
    participant: {
      id: participantId,
      name: participantName,
      role: 'guest'
    }
  });
};

module.exports = {
  sendVerificationCode,
  verifyCodeAndLogin,
  register,
  passwordLogin,
  ssoLogin,
  wechatLogin,
  getCurrentUser,
  guestJoinMeeting
};
