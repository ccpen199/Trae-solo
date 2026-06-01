const fs = require('fs');
const dash = JSON.parse(fs.readFileSync('dash.json')).data.summary;
const reports = JSON.parse(fs.readFileSync('reports.json')).data;
const eq = JSON.parse(fs.readFileSync('eq.json'));
const activeEq = eq.data.filter(x => ['open','processing'].includes(x.status)).length;
const resolvedEq = eq.data.filter(x => ['resolved','closed'].includes(x.status)).length;

console.log('=== 统计口径一致性 ===');
console.log('Dashboard 异常单:', dash.exceptionTickets);
console.log('异常队列活跃:', activeEq);
console.log('报表活跃异常单:', reports.exceptionTickets);
console.log('报表已解决异常单:', reports.exceptionResolvedTickets);
console.log('口径一致:', dash.exceptionTickets === activeEq && activeEq === reports.exceptionTickets ? '✓ 是' : '✗ 否');

console.log('');
console.log('=== 报表新维度 ===');
console.log('SLA达标率:', reports.slaComplianceRate + '%');
console.log('超时工单:', reports.slaOverdueCount);
console.log('升级工单:', reports.escalatedCount);
console.log('回访次数:', reports.totalFeedbackCalls);
console.log('平均满意度:', reports.avgSatisfaction);
console.log('SLA响应时长分布:', reports.responseTimeDistribution.length + '个时间段');
console.log('异常类型分布:', reports.byExceptionType.length + '种');
console.log('满意度分布:', reports.satisfactionDistribution.length + '个等级');
console.log('班次分布:', reports.byShift.length + '个班次');
console.log('队列分布:', reports.byQueue.length + '个队列');
console.log('人员绩效:', reports.staffPerformance.length + '人');
console.log('航班关联问题:', reports.flightIssues.length + '个航班');
console.log('热点区域:', reports.byArea.length + '个区域');

console.log('');
console.log('=== 访问地址 ===');
console.log('前端: http://127.0.0.1:46344/');
console.log('后端: http://127.0.0.1:56344/');

console.log('');
console.log('=== 主要文件 ===');
console.log('后端API: backend/server.js');
console.log('前端异常队列: frontend/src/pages/ExceptionQueue.tsx');
console.log('前端运营报表: frontend/src/pages/Reports.tsx');
console.log('前端API封装: frontend/src/lib/api.ts');

console.log('');
console.log('=== 测试路径 ===');
console.log('1. 异常队列: /exception-queue');
console.log('   - 点击"解决"按钮查看完整处理表单');
console.log('   - 不同异常类型显示不同必填字段');
console.log('   - 已解决工单显示处理环节标签');
console.log('');
console.log('2. 运营报表: /reports');
console.log('   - 12个统计卡片（SLA、超时、升级等）');
console.log('   - 统计口径说明面板');
console.log('   - 8个分析图表（SLA分布、队列、班次、类型等）');
console.log('   - 人员绩效排行');
console.log('   - 重置按钮恢复全部数据');
