const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../', process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只支持图片文件'));
  }
});

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post('/send-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone } = req.body;
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.verificationCode.create({
      data: {
        phone,
        code,
        expiresAt
      }
    });

    console.log(`[验证码] 手机号: ${phone}, 验证码: ${code}`);

    res.json({
      success: true,
      message: '验证码已发送',
      debug: { code }
    });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({ success: false, message: '发送验证码失败' });
  }
});

const registerUpload = upload.fields([
  { name: 'idCardFront', maxCount: 1 },
  { name: 'studentCardPage', maxCount: 1 }
]);

router.post('/register', registerUpload, [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('验证码为6位数字'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('realName').notEmpty().withMessage('请输入真实姓名'),
  body('idCardNumber').isLength({ min: 18, max: 18 }).withMessage('身份证号为18位'),
  body('emergencyContact').notEmpty().withMessage('请输入紧急联系人'),
  body('emergencyPhone').isMobilePhone('zh-CN').withMessage('请输入有效的紧急联系电话'),
  body('cityId').notEmpty().withMessage('请选择城市'),
  body('schoolId').notEmpty().withMessage('请选择学校')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      phone, code, password, realName, idCardNumber,
      emergencyContact, emergencyPhone, cityId, schoolId,
      faceVerified
    } = req.body;

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        phone,
        code,
        expiresAt: { gt: new Date() },
        used: false
      }
    });

    if (!verificationCode) {
      return res.status(400).json({ success: false, message: '验证码无效或已过期' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, { idCardNumber }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.phone === phone ? '手机号已注册' : '身份证号已注册'
      });
    }

    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true }
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const idCardFront = req.files?.idCardFront?.[0]?.filename || null;
    const studentCardPage = req.files?.studentCardPage?.[0]?.filename || null;

    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        realName,
        idCardNumber,
        idCardFront,
        studentCardPage,
        faceVerified: faceVerified === 'true' || Boolean(faceVerified),
        emergencyContact,
        emergencyPhone,
        cityId,
        schoolId,
        status: 'pending',
        role: 'user'
      }
    });

    await prisma.audit.create({
      data: {
        userId: user.id,
        auditType: 'registration',
        status: 'pending'
      }
    });

    res.json({
      success: true,
      message: '注册成功，请等待审核',
      data: {
        userId: user.id,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '注册失败', error: error.message });
  }
});

router.post('/login', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { rider: true, riderSettings: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({
    success: true,
    data: userWithoutPassword
  });
});

router.post('/become-rider', authenticateToken, async (req, res) => {
  try {
    const { isOffsite = false, isOnsite = true } = req.body;

    if (req.user.status !== 'approved') {
      return res.status(400).json({ success: false, message: '账号尚未审核通过，不能成为骑手' });
    }

    if (req.user.rider) {
      return res.status(400).json({ success: false, message: '您已经是骑手了' });
    }

    const rider = await prisma.rider.create({
      data: {
        userId: req.user.id,
        isOffsite,
        isOnsite,
        hasInsurance: false,
        hasDeposit: false,
        isOnline: false,
        currentOrders: 0,
        maxOrders: 3
      }
    });

    await prisma.riderSetting.create({
      data: {
        userId: req.user.id,
        autoAccept: false,
        maxSimultaneous: 3,
        workStartTime: '08:00',
        workEndTime: '22:00'
      }
    });

    res.json({
      success: true,
      message: '成为骑手成功',
      data: rider
    });
  } catch (error) {
    console.error('成为骑手错误:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

module.exports = router;
