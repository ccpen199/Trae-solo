const { validateName, checkHomophone, filterSensitiveWord } = require('./backend/src/utils/sensitiveWords');
const { calculateBaZi } = require('./backend/src/utils/bazi');
const { calculateWuge, calculateWugeScore } = require('./backend/src/utils/wuge');
const { generateNameGua } = require('./backend/src/utils/zhouyi');

console.log('========== 中华姓名学智能起名系统 - 模块测试 ==========\n');

console.log('1. 【敏感词过滤测试】');
console.log('   杨伟(谐音不雅):', JSON.stringify(checkHomophone('杨伟')));
console.log('   史珍香(谐音不雅):', JSON.stringify(checkHomophone('史珍香')));
console.log('   浩然(正常):', JSON.stringify(checkHomophone('浩然')));
console.log('   含敏感词傻瓜:', JSON.stringify(filterSensitiveWord('这个傻瓜')));
console.log('   张明华(正常):', JSON.stringify(filterSensitiveWord('张明华')));

console.log('\n2. 【八字排盘测试】');
const bazi = calculateBaZi(2025, 6, 15, 10, 30, 116.4, '男');
console.log('   2025年6月15日10:30 男 北京');
console.log('   四柱:', bazi.eightChars.map(p => p.tianGan + p.diZhi).join(' '));
console.log('   生肖:', bazi.shengxiao);
console.log('   命宫:', bazi.wuxingWangshuai.mingGe);
console.log('   真太阳时:', bazi.trueSolarTime.hour + '时' + bazi.trueSolarTime.minute + '分');
console.log('   五行(旺→衰):', Object.entries(bazi.wuxingCount).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).join('>'));

console.log('\n3. 【五格数理测试】');
const wuge = calculateWuge('李', '浩然');
const wugeScore = calculateWugeScore(wuge);
console.log('   姓名: 李浩然');
console.log('   天格:', wuge.wuge.tianGe.strokes, wuge.wuge.tianGe.type, '-', wuge.wuge.tianGe.name);
console.log('   人格:', wuge.wuge.renGe.strokes, wuge.wuge.renGe.type, '-', wuge.wuge.renGe.name);
console.log('   地格:', wuge.wuge.diGe.strokes, wuge.wuge.diGe.type, '-', wuge.wuge.diGe.name);
console.log('   外格:', wuge.wuge.waiGe.strokes, wuge.wuge.waiGe.type, '-', wuge.wuge.waiGe.name);
console.log('   总格:', wuge.wuge.zongGe.strokes, wuge.wuge.zongGe.type, '-', wuge.wuge.zongGe.name);
console.log('   三才配置:', wuge.sanCai.tianWx + '-' + wuge.sanCai.renWx + '-' + wuge.sanCai.diWx, wuge.sanCai.type, wuge.sanCai.jixiong);
console.log('   五格综合评分:', wugeScore, '分');
console.log('   变格检查:', wuge.biange.description);

console.log('\n4. 【周易卦象测试】');
const gua = generateNameGua('李', '浩然');
console.log('   本卦:', gua.benGua.name, gua.benGua.symbol, '-', gua.benGua.jixiong);
console.log('   卦辞:', gua.benGua.guaCi);
console.log('   动爻: 第' + gua.dongYao + '爻');
console.log('   之卦:', gua.zhiGua.name, gua.zhiGua.symbol);
console.log('   总结:', gua.jieshi.zongJie.substring(0, 50) + '...');

console.log('\n5. 【名字验证测试】');
const validation = validateName('李浩然');
console.log('   验证"李浩然":', validation.valid ? '通过' : '不通过');
console.log('   问题数:', validation.issues.length);

console.log('\n========== 所有模块测试完成！ ==========');
