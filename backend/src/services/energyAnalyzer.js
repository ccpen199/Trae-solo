require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const EnergyUsage = require('../models/EnergyUsage');
const DormitoryBuilding = require('../models/DormitoryBuilding');
const StudentAccount = require('../models/StudentAccount');
const Device = require('../models/Device');
const moment = require('moment');

class EnergyAnalyzer {
  constructor() {
    this.running = false;
  }

  async init() {
    await connectDB();
    console.log('📊 能耗分析器初始化完成');
  }

  async generateHistoricalData(days = 365) {
    console.log(`📊 生成过去 ${days} 天的历史能耗数据...`);
    
    const buildings = await DormitoryBuilding.find();
    const students = await StudentAccount.find({ status: 'active' });
    const devices = await Device.find({ status: { $in: ['online', 'offline'] } });

    if (buildings.length === 0 || devices.length === 0) {
      console.log('⚠️  缺少楼栋或设备数据，无法生成历史数据');
      return;
    }

    const unitPrice = 0.05;
    const batchSize = 100;
    let totalRecords = 0;

    for (let dayOffset = days; dayOffset >= 0; dayOffset--) {
      const date = moment().subtract(dayOffset, 'days');
      const month = date.month() + 1;
      const season = this.getSeason(month);
      
      const records = [];
      const dailyUsageCount = Math.floor(Math.random() * 30) + 20;

      for (let i = 0; i < dailyUsageCount; i++) {
        const device = devices[Math.floor(Math.random() * devices.length)];
        const building = buildings.find(b => b._id.toString() === device.buildingId?.toString()) || buildings[0];
        const student = Math.random() > 0.1 ? students[Math.floor(Math.random() * students.length)] : null;
        
        const hour = this.getRandomHourBySeason(season);
        const startTime = date.clone().hour(hour).minute(Math.floor(Math.random() * 60)).second(0);
        const duration = Math.floor(Math.random() * 25) + 5;
        const endTime = startTime.clone().add(duration, 'minutes');
        
        const baseVolume = duration * (Math.random() * 3 + 4);
        const seasonMultiplier = season === 'winter' ? 1.3 : season === 'summer' ? 0.7 : 1;
        const waterVolume = parseFloat((baseVolume * seasonMultiplier).toFixed(2));
        
        const avgTemperature = season === 'winter' ? 
          Math.random() * 10 + 40 : 
          season === 'summer' ? 
            Math.random() * 8 + 32 : 
            Math.random() * 10 + 36;
        
        const cost = parseFloat((waterVolume * unitPrice).toFixed(2));
        const isAbnormal = Math.random() < 0.03;

        const record = new EnergyUsage({
          recordId: `EU${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          deviceId: device.deviceId,
          buildingId: building._id,
          floor: device.floor || Math.floor(Math.random() * 6) + 1,
          studentId: student?.studentId,
          usageType: 'hot_water',
          startTime: startTime.toDate(),
          endTime: endTime.toDate(),
          duration,
          waterVolume,
          avgFlowRate: parseFloat((waterVolume / duration).toFixed(2)),
          avgTemperature: parseFloat(avgTemperature.toFixed(1)),
          energyConsumed: parseFloat((waterVolume * 0.03).toFixed(2)),
          cost,
          unitPrice,
          season,
          hourOfDay: hour,
          dayOfWeek: startTime.day(),
          month,
          year: date.year(),
          isAbnormal,
          abnormalReason: isAbnormal ? (Math.random() > 0.5 ? '长时间用水' : '高流量异常') : undefined
        });

        records.push(record);
      }

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await EnergyUsage.insertMany(batch);
        totalRecords += batch.length;
      }

      if (dayOffset % 30 === 0) {
        console.log(`📊 已生成 ${totalRecords} 条记录，还剩 ${dayOffset} 天`);
      }
    }

    console.log(`✅ 历史数据生成完成，共 ${totalRecords} 条能耗记录`);
  }

  getSeason(month) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  getRandomHourBySeason(season) {
    const hours = [];
    if (season === 'winter') {
      for (let h = 7; h <= 9; h++) hours.push(h);
      for (let h = 12; h <= 14; h++) hours.push(h);
      for (let h = 20; h <= 23; h++) hours.push(h);
    } else if (season === 'summer') {
      for (let h = 6; h <= 8; h++) hours.push(h);
      for (let h = 11; h <= 13; h++) hours.push(h);
      for (let h = 18; h <= 22; h++) hours.push(h);
    } else {
      for (let h = 6; h <= 8; h++) hours.push(h);
      for (let h = 12; h <= 13; h++) hours.push(h);
      for (let h = 19; h <= 22; h++) hours.push(h);
    }
    return hours[Math.floor(Math.random() * hours.length)];
  }

  async generateMonthlyReport(year, month) {
    console.log(`📊 生成 ${year}年${month}月 能耗报告...`);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const query = {
      startTime: { $gte: startDate, $lt: endDate }
    };

    const totalStats = await EnergyUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          totalRecords: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          abnormalCount: { $sum: { $cond: ['$isAbnormal', 1, 0] } }
        }
      }
    ]);

    const buildingStats = await EnergyUsage.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'dormitorybuildings',
          localField: 'buildingId',
          foreignField: '_id',
          as: 'building'
        }
      },
      { $unwind: '$building' },
      {
        $group: {
          _id: '$buildingId',
          buildingName: { $first: '$building.buildingName' },
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          usageCount: { $sum: 1 },
          studentCount: { $addToSet: '$studentId' }
        }
      },
      { $sort: { totalWater: -1 } }
    ]);

    const gradeStats = await EnergyUsage.aggregate([
      { $match: { ...query, studentId: { $exists: true } } },
      {
        $lookup: {
          from: 'studentaccounts',
          localField: 'studentId',
          foreignField: 'studentId',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.grade',
          totalWater: { $sum: '$waterVolume' },
          totalCost: { $sum: '$cost' },
          usageCount: { $sum: 1 },
          studentCount: { $addToSet: '$studentId' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const season = this.getSeason(month);
    const report = {
      reportId: `RPT-${year}-${month.toString().padStart(2, '0')}`,
      period: `${year}年${month}月`,
      season,
      generatedAt: new Date(),
      summary: {
        totalWater: totalStats[0]?.totalWater || 0,
        totalCost: totalStats[0]?.totalCost || 0,
        totalRecords: totalStats[0]?.totalRecords || 0,
        avgDuration: totalStats[0]?.avgDuration || 0,
        abnormalCount: totalStats[0]?.abnormalCount || 0,
        abnormalRate: totalStats[0] ? ((totalStats[0].abnormalCount / totalStats[0].totalRecords) * 100).toFixed(2) : 0
      },
      buildingStats: buildingStats.map(b => ({
        ...b,
        studentCount: b.studentCount.filter(s => s).length,
        avgPerStudent: b.studentCount.filter(s => s).length > 0 ? (b.totalWater / b.studentCount.filter(s => s).length).toFixed(1) : 0
      })),
      gradeStats: gradeStats.map(g => ({
        ...g,
        studentCount: g.studentCount.filter(s => s).length,
        avgPerStudent: g.studentCount.filter(s => s).length > 0 ? (g.totalWater / g.studentCount.filter(s => s).length).toFixed(1) : 0
      }))
    };

    console.log(`✅ ${year}年${month}月能耗报告生成完成`);
    console.log(`   总用水量: ${report.summary.totalWater.toFixed(1)}L`);
    console.log(`   总费用: ¥${report.summary.totalCost.toFixed(2)}`);
    console.log(`   异常率: ${report.summary.abnormalRate}%`);

    return report;
  }

  async generateYoYComparison(year) {
    console.log(`📊 生成 ${year}年 同比分析报告...`);

    const currentYear = year;
    const lastYear = year - 1;

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const currentData = await EnergyUsage.aggregate([
        { $match: { year: currentYear, month: m } },
        {
          $group: {
            _id: null,
            totalWater: { $sum: '$waterVolume' },
            totalCost: { $sum: '$cost' },
            usageCount: { $sum: 1 }
          }
        }
      ]);

      const lastYearData = await EnergyUsage.aggregate([
        { $match: { year: lastYear, month: m } },
        {
          $group: {
            _id: null,
            totalWater: { $sum: '$waterVolume' },
            totalCost: { $sum: '$cost' },
            usageCount: { $sum: 1 }
          }
        }
      ]);

      const curr = currentData[0] || { totalWater: 0, totalCost: 0, usageCount: 0 };
      const last = lastYearData[0] || { totalWater: 0, totalCost: 0, usageCount: 0 };

      months.push({
        month: m,
        currentYear: {
          totalWater: curr.totalWater,
          totalCost: curr.totalCost,
          usageCount: curr.usageCount
        },
        lastYear: {
          totalWater: last.totalWater,
          totalCost: last.totalCost,
          usageCount: last.usageCount
        },
        waterGrowthRate: last.totalWater > 0 ? 
          (((curr.totalWater - last.totalWater) / last.totalWater) * 100).toFixed(1) : null,
        costGrowthRate: last.totalCost > 0 ? 
          (((curr.totalCost - last.totalCost) / last.totalCost) * 100).toFixed(1) : null
      });
    }

    const totalCurrent = months.reduce((sum, m) => sum + m.currentYear.totalWater, 0);
    const totalLast = months.reduce((sum, m) => sum + m.lastYear.totalWater, 0);

    const report = {
      reportId: `YOY-${year}`,
      year,
      generatedAt: new Date(),
      totalCurrent,
      totalLast,
      overallGrowthRate: totalLast > 0 ? (((totalCurrent - totalLast) / totalLast) * 100).toFixed(1) : null,
      months
    };

    console.log(`✅ ${year}年同比分析完成`);
    console.log(`   今年总用水量: ${totalCurrent.toFixed(1)}L`);
    console.log(`   去年总用水量: ${totalLast.toFixed(1)}L`);
    console.log(`   同比增长: ${report.overallGrowthRate || 'N/A'}%`);

    return report;
  }

  async analyzePeakHours(startDate, endDate) {
    console.log('📊 分析用水高峰时段...');

    const query = {};
    if (startDate) query.startTime = { ...query.startTime, $gte: new Date(startDate) };
    if (endDate) query.startTime = { ...query.startTime, $lte: new Date(endDate) };

    const hourStats = await EnergyUsage.aggregate([
      { $match: Object.keys(query).length > 0 ? query : {} },
      {
        $group: {
          _id: '$hourOfDay',
          count: { $sum: 1 },
          totalWater: { $sum: '$waterVolume' },
          avgDuration: { $avg: '$duration' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const peakHours = hourStats.slice(0, 5);
    const offPeakHours = hourStats.slice(-5).reverse();

    console.log('✅ 高峰时段分析完成');
    console.log('   高峰时段 (TOP 5):');
    peakHours.forEach((h, i) => {
      console.log(`   ${i + 1}. ${h._id}:00 - ${h.count}次用水, ${h.totalWater.toFixed(0)}L`);
    });

    return { peakHours, offPeakHours, allHours: hourStats.sort((a, b) => a._id - b._id) };
  }

  async runFullAnalysis() {
    console.log('📊 开始全面能耗分析...\n');

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const results = {};

    results.monthlyReport = await this.generateMonthlyReport(currentYear, currentMonth);
    results.yoyComparison = await this.generateYoYComparison(currentYear);
    results.peakHours = await this.analyzePeakHours();

    console.log('\n📊 全面能耗分析完成');
    return results;
  }

  start() {
    if (this.running) return;
    this.running = true;
    console.log('🚀 能耗分析服务启动');
    
    this.runFullAnalysis().catch(err => console.error('能耗分析失败:', err));
  }

  stop() {
    this.running = false;
    console.log('⏹️ 能耗分析服务已停止');
  }
}

if (require.main === module) {
  const analyzer = new EnergyAnalyzer();
  
  analyzer.init().then(async () => {
    const args = process.argv.slice(2);
    
    if (args.includes('--generate-history')) {
      const days = parseInt(args[args.indexOf('--generate-history') + 1]) || 365;
      await analyzer.generateHistoricalData(days);
      process.exit(0);
    } else if (args.includes('--monthly-report')) {
      const idx = args.indexOf('--monthly-report');
      const year = parseInt(args[idx + 1]) || new Date().getFullYear();
      const month = parseInt(args[idx + 2]) || new Date().getMonth() + 1;
      await analyzer.generateMonthlyReport(year, month);
      process.exit(0);
    } else if (args.includes('--yoy')) {
      const year = parseInt(args[args.indexOf('--yoy') + 1]) || new Date().getFullYear();
      await analyzer.generateYoYComparison(year);
      process.exit(0);
    } else if (args.includes('--peak-hours')) {
      await analyzer.analyzePeakHours();
      process.exit(0);
    } else {
      await analyzer.runFullAnalysis();
      process.exit(0);
    }
  }).catch(err => {
    console.error('能耗分析器初始化失败:', err);
    process.exit(1);
  });
}

module.exports = EnergyAnalyzer;
