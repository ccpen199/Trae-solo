const express = require('express');
const cors = require('cors');
const { connectDB, useMockData } = require('./config/db');
const config = require('./config/config');
const routes = require('./routes');
const { log } = require('./middleware/log');
const cron = require('node-cron');

// 初始化应用
const app = express();

// 连接数据库
connectDB();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(log);

// 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// 定时任务：每天检查设备保养计划
if (!useMockData) {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running maintenance plan check...');
      
      // 动态导入模型，避免模拟数据模式下的错误
      const Equipment = require('./models/Equipment');
      const MaintenancePlan = require('./models/MaintenancePlan');
      
      // 获取所有正常状态的设备
      const equipments = await Equipment.find({ status: 'normal' });
      
      // 检查每个设备的下次保养日期
      for (const equipment of equipments) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextMaintenanceDate = new Date(equipment.nextMaintenanceDate);
        nextMaintenanceDate.setHours(0, 0, 0, 0);
        
        // 如果下次保养日期是今天或已过期，生成保养计划
        if (nextMaintenanceDate <= today) {
          // 检查是否已有未完成的保养计划
          const existingPlan = await MaintenancePlan.findOne({
            equipmentId: equipment._id,
            status: { $in: ['pending', 'inProgress'] }
          });
          
          if (!existingPlan) {
            const newPlan = new MaintenancePlan({
              equipmentId: equipment._id,
              planDate: today,
              status: 'pending'
            });
            
            await newPlan.save();
            console.log(`Generated maintenance plan for equipment ${equipment.name}`);
          }
        }
      }
      
      console.log('Maintenance plan check completed');
    } catch (error) {
      console.error('Error running maintenance plan check:', error);
    }
  });
}

// 启动服务
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;