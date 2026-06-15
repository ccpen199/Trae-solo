import { mockData, generateMockData } from './src/mock/data';
import { getTownshipStats } from './src/mock/townships';

console.log('=== 统计数据一致性验证 ===\n');

const data1 = generateMockData();
const data2 = generateMockData();

console.log('1. 验证 unifiedStats 字段存在:');
console.log('   mockData.unifiedStats:', !!mockData.unifiedStats);
console.log('   data1.unifiedStats:', !!data1.unifiedStats);
console.log('   data2.unifiedStats:', !!data2.unifiedStats);

console.log('\n2. 验证统计数据一致性:');
console.log('   totalJobs:', mockData.unifiedStats.totalJobs, '===', mockData.positions.length, '?', mockData.unifiedStats.totalJobs === mockData.positions.length);
console.log('   totalEnterprises:', mockData.unifiedStats.totalEnterprises, '===', mockData.enterprises.length, '?', mockData.unifiedStats.totalEnterprises === mockData.enterprises.length);
console.log('   totalSeekers:', mockData.unifiedStats.totalSeekers, '===', mockData.jobSeekers.length, '?', mockData.unifiedStats.totalSeekers === mockData.jobSeekers.length);
console.log('   totalTownships:', mockData.unifiedStats.totalTownships, '=== 25 ?', mockData.unifiedStats.totalTownships === 25);

console.log('\n3. 验证认证企业真实统计（非硬编码比例）:');
const actualCertified = mockData.enterprises.filter(e => e.verified).length;
console.log('   真实认证企业数:', actualCertified);
console.log('   unifiedStats.certifiedEnterprises:', mockData.unifiedStats.certifiedEnterprises);
console.log('   是否一致:', actualCertified === mockData.unifiedStats.certifiedEnterprises);
console.log('   认证比例:', (actualCertified / mockData.enterprises.length * 100).toFixed(2) + '%');
console.log('   验证: 不是硬编码 72%:', Math.abs(actualCertified / mockData.enterprises.length - 0.72) > 0.001 ? '✓ 正确，非硬编码' : '✗ 可能是硬编码');

console.log('\n4. 验证镇街统计真实计算:');
console.log('   townshipStats 数量:', mockData.unifiedStats.townshipStats.length);
const townshipStat = mockData.unifiedStats.townshipStats[0];
console.log('   第一个镇街:', townshipStat.name);
const actualJobs = mockData.positions.filter(p => p.township === townshipStat.code).length;
const actualEnterprises = mockData.enterprises.filter(e => e.township === townshipStat.code).length;
console.log('   真实职位数:', actualJobs, '===', townshipStat.jobCount, '?', actualJobs === townshipStat.jobCount);
console.log('   真实企业数:', actualEnterprises, '===', townshipStat.enterpriseCount, '?', actualEnterprises === townshipStat.enterpriseCount);

console.log('\n5. 验证 getTownshipStats 真实计算:');
const stats = getTownshipStats(mockData.enterprises, mockData.positions);
console.log('   totalJobs:', stats.totalJobs, '===', mockData.positions.length, '?', stats.totalJobs === mockData.positions.length);
console.log('   totalEnterprises:', stats.totalEnterprises, '===', mockData.enterprises.length, '?', stats.totalEnterprises === mockData.enterprises.length);
console.log('   certifiedEnterprises:', stats.certifiedEnterprises, '===', actualCertified, '?', stats.certifiedEnterprises === actualCertified);

console.log('\n6. 验证多次 generateMockData 产生不同数据（确保随机性）:');
console.log('   data1.totalJobs:', data1.unifiedStats.totalJobs);
console.log('   data2.totalJobs:', data2.unifiedStats.totalJobs);
console.log('   数据不同:', data1.unifiedStats.totalJobs !== data2.unifiedStats.totalJobs ? '✓ 正确' : '✗ 数据相同（可能有问题）');

console.log('\n=== 验证完成 ===');
