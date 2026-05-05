const express = require('express');
const prisma = require('../utils/prisma');

const router = express.Router();

router.get('/cities', async (req, res) => {
  try {
    let cities = await prisma.city.findMany({
      include: { schools: true },
      orderBy: { name: 'asc' }
    });
    
    if (cities.length === 0) {
      const beijing = await prisma.city.create({
        data: {
          name: '北京市',
          province: '北京市'
        }
      });
      
      const shanghai = await prisma.city.create({
        data: {
          name: '上海市',
          province: '上海市'
        }
      });
      
      const guangzhou = await prisma.city.create({
        data: {
          name: '广州市',
          province: '广东省'
        }
      });
      
      await prisma.school.createMany({
        data: [
          { cityId: beijing.id, name: '北京大学', address: '北京市海淀区颐和园路5号' },
          { cityId: beijing.id, name: '清华大学', address: '北京市海淀区双清路30号' },
          { cityId: beijing.id, name: '北京邮电大学', address: '北京市海淀区西土城路10号' },
          { cityId: shanghai.id, name: '复旦大学', address: '上海市杨浦区邯郸路220号' },
          { cityId: shanghai.id, name: '上海交通大学', address: '上海市闵行区东川路800号' },
          { cityId: guangzhou.id, name: '中山大学', address: '广州市海珠区新港西路135号' },
          { cityId: guangzhou.id, name: '华南理工大学', address: '广州市天河区五山路381号' }
        ]
      });
      
      cities = await prisma.city.findMany({
        include: { schools: true },
        orderBy: { name: 'asc' }
      });
    }
    
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('获取城市列表错误:', error);
    res.status(500).json({ success: false, message: '获取城市列表失败' });
  }
});

router.get('/schools/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    
    const schools = await prisma.school.findMany({
      where: { cityId },
      include: { dormitories: true },
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: schools
    });
  } catch (error) {
    console.error('获取学校列表错误:', error);
    res.status(500).json({ success: false, message: '获取学校列表失败' });
  }
});

router.post('/init-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    
    const existingAdmin = await prisma.user.findUnique({
      where: { phone: '13800000000' }
    });
    
    if (existingAdmin) {
      return res.json({
        success: true,
        message: '管理员已存在',
        data: { phone: existingAdmin.phone, status: existingAdmin.status }
      });
    }
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const city = await prisma.city.findFirst();
    
    const admin = await prisma.user.create({
      data: {
        phone: '13800000000',
        password: hashedPassword,
        realName: '系统管理员',
        idCardNumber: '110101199001011234',
        faceVerified: true,
        emergencyContact: '管理员',
        emergencyPhone: '13800000000',
        cityId: city?.id,
        schoolId: null,
        status: 'approved',
        role: 'admin'
      }
    });
    
    const approvedUser = await prisma.user.create({
      data: {
        phone: '13800138000',
        password: hashedPassword,
        realName: '测试骑手',
        idCardNumber: '110101199001011235',
        faceVerified: true,
        emergencyContact: '测试联系人',
        emergencyPhone: '13900139000',
        cityId: city?.id,
        schoolId: null,
        status: 'approved',
        role: 'user'
      }
    });
    
    await prisma.rider.create({
      data: {
        userId: approvedUser.id,
        isOffsite: false,
        isOnsite: true,
        hasInsurance: true,
        hasDeposit: true,
        depositAmount: 500,
        isOnline: false,
        currentOrders: 0,
        maxOrders: 3
      }
    });
    
    await prisma.riderSetting.create({
      data: {
        userId: approvedUser.id,
        autoAccept: false,
        maxSimultaneous: 3,
        workStartTime: '08:00',
        workEndTime: '22:00'
      }
    });
    
    const offsiteRider = await prisma.user.create({
      data: {
        phone: '13900139000',
        password: hashedPassword,
        realName: '校外骑手',
        idCardNumber: '110101199001011236',
        faceVerified: true,
        emergencyContact: '校外联系人',
        emergencyPhone: '13700137000',
        cityId: city?.id,
        schoolId: null,
        status: 'approved',
        role: 'user'
      }
    });
    
    await prisma.rider.create({
      data: {
        userId: offsiteRider.id,
        isOffsite: true,
        isOnsite: false,
        hasInsurance: true,
        hasDeposit: true,
        depositAmount: 1000,
        isOnline: false,
        currentOrders: 0,
        maxOrders: 5
      }
    });
    
    res.json({
      success: true,
      message: '初始化成功',
      data: {
        admin: { phone: '13800000000', password: 'admin123' },
        testRider: { phone: '13800138000', password: 'admin123' },
        offsiteRider: { phone: '13900139000', password: 'admin123' }
      }
    });
  } catch (error) {
    console.error('初始化管理员错误:', error);
    res.status(500).json({ success: false, message: '初始化失败' });
  }
});

module.exports = router;
