const { characters, getWuxing, getStrokes, calculateWuxingBalance } = require('./backend/src/data/characters');
const { calculateWuge, calculateWugeScore } = require('./backend/src/utils/wuge');
const { generateNameGua } = require('./backend/src/utils/zhouyi');
const { getShengxiaoInfo, getLiuNianYunshi } = require('./backend/src/data/shengxiao');
const { filterSensitiveWord, checkHomophone } = require('./backend/src/utils/sensitiveWords');

console.log('=== 诊断 nameGenerator 核心循环 ===\n');

// 手动复制核心逻辑
const baziResult = {
  wuxingWangshuai: { wang: ['火', '水'], shuai: ['木', '金'], mingGe: '水命' },
  shengxiao: '蛇',
  dayGanWuxing: '水',
  wuxingCount: { '金': 0.4, '木': 1, '水': 2, '火': 6.8, '土': 1.8 },
  wuxingPercent: {}
};
const surname = '李';
const gender = '男';
const nameLength = 2;
const avoidWords = [];

// 1. 测试 targetWuxing
const sorted = Object.entries(baziResult.wuxingCount).sort((a, b) => b[1] - a[1]);
const wangZhe = sorted[0][0];
const ruoZhe = sorted[sorted.length - 1][0];
const targetWuxing = {
  bu: [ruoZhe],
  xie: sorted.slice(0, 2).map(s => s[0]),
  wang: wangZhe,
  shuai: ruoZhe
};
console.log('1. targetWuxing:', JSON.stringify(targetWuxing));

// 2. 测试候选字符池
const candidateChars = { '金': [], '木': [], '水': [], '火': [], '土': [] };
let filteredCount = 0;
characters.forEach(char => {
  if (avoidWords.includes(char.char)) { filteredCount++; return; }
  const sensitive = filterSensitiveWord(char.char);
  if (sensitive && sensitive.sensitive) { filteredCount++; return; }
  const wx = char.wuxing;
  if (wx && candidateChars[wx]) {
    candidateChars[wx].push(char);
  }
});
console.log('\n2. 候选字符池过滤后:');
Object.entries(candidateChars).forEach(([wx, chars]) => {
  console.log(`   ${wx}: ${chars.length}个`);
});
console.log(`   被过滤: ${filteredCount}个`);

// 3. 测试 selectNameChars
const strategies = ['补旺优先', '平衡优先', '生肖喜用', '五格吉数', '音形义佳', '综合评分'];
const wuxingOrder = ['金', '木', '水', '火', '土'];

console.log('\n3. 测试 selectNameChars:');
for (let attempt = 0; attempt < 10; attempt++) {
  const strategy = strategies[attempt % strategies.length];
  const chars = [];
  
  if (strategy === '补旺优先') {
    for (let i = 0; i < nameLength; i++) {
      const wx = targetWuxing.bu[i % targetWuxing.bu.length];
      const pool = candidateChars[wx];
      if (pool && pool.length > 0) {
        const char = pool[Math.floor(Math.random() * pool.length)];
        chars.push(char);
      }
    }
  } else if (strategy === '平衡优先') {
    const usedWuxing = [];
    for (let i = 0; i < nameLength; i++) {
      const availableWx = wuxingOrder.filter(wx => !usedWuxing.includes(wx));
      const wx = availableWx[Math.floor(Math.random() * availableWx.length)];
      usedWuxing.push(wx);
      const pool = candidateChars[wx];
      if (pool && pool.length > 0) {
        const char = pool[Math.floor(Math.random() * pool.length)];
        chars.push(char);
      }
    }
  } else {
    for (let i = 0; i < nameLength; i++) {
      const wx = wuxingOrder[Math.floor(Math.random() * wuxingOrder.length)];
      const pool = candidateChars[wx];
      if (pool && pool.length > 0) {
        const char = pool[Math.floor(Math.random() * pool.length)];
        chars.push(char);
      }
    }
  }
  
  const fullName = chars.map(c => c.char).join('');
  
  // 测试敏感词和谐音
  const sen = filterSensitiveWord(fullName);
  const homo = checkHomophone(fullName);
  
  console.log(`  尝试${attempt+1}: strategy=${strategy}, chars=${fullName}, length=${chars.length}, sensitive=${sen.sensitive}, homo=${homo.hasBadHomophone}`);
  
  if (chars.length === nameLength && !sen.sensitive && !homo.hasBadHomophone) {
    console.log('  ✅ 找到可用名字！尝试调用 analyzeName...');
    try {
      // 调用 analyzeName
      const analysis = analyzeName2(surname, fullName, baziResult);
      console.log('  ✅ analyzeName 成功，总分:', analysis.totalScore);
      break;
    } catch (e) {
      console.log('  ❌ analyzeName 出错:', e.message);
      console.log(e.stack.substring(0, 300));
      break;
    }
  }
}

function analyzeName2(surname, name, baziResult) {
  const fullName = surname + name;
  console.log('    [analyzeName] fullName:', fullName);
  
  const wuxingBalance = calculateWuxingBalance(fullName.split(''));
  console.log('    [analyzeName] wuxingBalance OK, score:', wuxingBalance.score);
  
  const wugeResult = calculateWuge(surname, name);
  const wugeScore = calculateWugeScore(wugeResult);
  console.log('    [analyzeName] wugeScore OK:', wugeScore);
  
  let guaResult = null;
  try {
    guaResult = generateNameGua(surname, name);
    console.log('    [analyzeName] guaResult OK:', guaResult.benGua?.name);
  } catch (e) {
    console.log('    [analyzeName] guaResult 出错:', e.message);
    guaResult = { benGua: { name: '未知', jixiong: '平' }, zhiGua: { name: '未知' }, yaoCis: [], dongYao: 1, jieshi: { zongJie: '' } };
  }
  
  return { totalScore: 80, wuxingBalance, wuge: { ...wugeResult, score: wugeScore }, gua: guaResult };
}

console.log('\n=== 诊断完成 ===');
