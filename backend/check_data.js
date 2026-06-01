const db = require('./src/database');
const moment = require('moment');

console.log('=== 1. 预算表数据 ===');
const budgets = db.prepare('SELECT * FROM budgets').all();
console.table(budgets);
const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0);
console.log('预算总额:', totalBudget);

console.log('\n=== 2. 账单日期范围 ===');
console.log(db.prepare('SELECT MIN(bill_date) as min_date, MAX(bill_date) as max_date, COUNT(*) as count FROM bills').get());

console.log('\n=== 3. 5月总成本 ===');
console.log(db.prepare("SELECT IFNULL(SUM(cost), 0) as total_may FROM bills WHERE bill_date BETWEEN '2026-05-01' AND '2026-05-31'").get());

console.log('\n=== 4. 优化建议总节省 ===');
console.log(db.prepare('SELECT SUM(estimated_saving_monthly) as total_saving FROM optimization_suggestions').get());

console.log('\n=== 5. moment 可变对象问题演示 ===');
const currentDate = moment('2026-05-25');
console.log('初始 currentDate:', currentDate.format('YYYY-MM-DD HH:mm:ss'));

const currentStart = currentDate.startOf('month').format('YYYY-MM-DD');
console.log('调用 startOf(\'month\') 后 currentDate:', currentDate.format('YYYY-MM-DD HH:mm:ss'));
console.log('currentStart:', currentStart);

const currentEnd = currentDate.format('YYYY-MM-DD');
console.log('currentEnd:', currentEnd);

const prevStart = currentDate.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
console.log('调用 subtract(1, \'month\') 后 currentDate:', currentDate.format('YYYY-MM-DD HH:mm:ss'));
console.log('prevStart:', prevStart);

const budgetPeriod = currentDate.format('YYYY-MM');
console.log('最后用于查询预算的 period:', budgetPeriod);
console.log('❌ 问题：period 变成了 ' + budgetPeriod + '，而不是 2026-05！');

console.log('\n=== 6. 修正后的查询 ===');
const fixedCurrent = moment('2026-05-25');
const fixedPeriod = fixedCurrent.format('YYYY-MM');  // 先保存 period
const fixedStart = fixedCurrent.clone().startOf('month').format('YYYY-MM-DD');  // 使用 clone()
const fixedEnd = moment('2026-05-25').format('YYYY-MM-DD');
const fixedPrevStart = moment('2026-05-25').subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
const fixedPrevEnd = moment('2026-05-25').subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

console.log('fixedPeriod:', fixedPeriod);
console.log('fixedStart:', fixedStart);
console.log('fixedEnd:', fixedEnd);
console.log('fixedPrevStart:', fixedPrevStart);
console.log('fixedPrevEnd:', fixedPrevEnd);

const fixedBudget = db.prepare('SELECT IFNULL(SUM(budget_amount), 0) as total_budget FROM budgets WHERE period = ?').get(fixedPeriod);
console.log('修正后的预算总额:', fixedBudget.total_budget);

const fixedCurrentCost = db.prepare('SELECT IFNULL(SUM(cost), 0) as total FROM bills WHERE bill_date BETWEEN ? AND ?').get(fixedStart, fixedEnd);
console.log('修正后的当月成本:', fixedCurrentCost.total);
