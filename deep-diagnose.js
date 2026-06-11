const { generateNames } = require('./backend/src/utils/nameGenerator');
const { calculateBaZi } = require('./backend/src/utils/bazi');

console.log('=== 深度诊断名字生成引擎 ===\n');

const bazi = calculateBaZi(2025, 6, 15, 10, 30, 116.4, '男');
console.log('八字四柱:', bazi.eightChars.map(p => p.tianGan + p.diZhi).join(' '));
console.log('五行计数:', JSON.stringify(bazi.wuxingCount));
console.log('旺相:', bazi.wuxingWangshuai);
console.log('生肖:', bazi.shengxiao);
console.log('');

console.log('=== 调用 generateNames ===');
try {
  const result = generateNames(bazi, '李', {
    count: 30,
    gender: '男',
    nameLength: 2,
    wish: ''
  });
  
  console.log('返回 count:', result.count);
  console.log('targetWuxing:', JSON.stringify(result.targetWuxing));
  console.log('names 数组长度:', result.names.length);
  
  if (result.names.length === 0) {
    console.log('\n⚠️  名字数为0，进入内部诊断...');
    
    // 单独测试各个内部组件
    const { characters, getRandomByWuxing } = require('./backend/src/data/characters');
    console.log('\n汉字库总数量:', characters.length);
    
    const wuxingList = ['金', '木', '水', '火', '土'];
    wuxingList.forEach(wx => {
      const chars = characters.filter(c => c.wuxing === wx);
      console.log(`  五行[${wx}]: ${chars.length}个汉字`);
    });
    
    console.log('\ngetRandomByWuxing(金):', getRandomByWuxing('金', 5).map(c => c.char).join(','));
    console.log('getRandomByWuxing(木):', getRandomByWuxing('木', 5).map(c => c.char).join(','));
  } else {
    console.log('\n✅ 成功生成名字，前5个:');
    result.names.slice(0, 5).forEach(n => {
      console.log(`  ${n.rank}. ${n.fullName} - ${n.analysis.totalScore}分`);
    });
  }
} catch (e) {
  console.error('❌ generateNames 抛出异常:');
  console.error(e.message);
  console.error(e.stack);
}
