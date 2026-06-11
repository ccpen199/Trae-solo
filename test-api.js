const http = require('http');

const data = JSON.stringify({
  surname: '李',
  gender: '男',
  birthday: '2025-06-01',
  birthHour: 8,
  birthMinute: 0,
  longitude: 116.4,
  nameLength: 2
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/names/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      console.log('===== 中华姓名学智能起名系统测试 =====');
      console.log('API调用成功:', result.success);
      
      if (result.success && result.data) {
        const { bazi, names, liuNian2025 } = result.data;
        
        console.log('\n【八字排盘】');
        console.log('  生肖:', bazi.shengxiao);
        console.log('  命宫:', bazi.wuxingWangshuai.mingGe);
        console.log('  四柱:', bazi.eightChars.map(p => `${p.position} ${p.tianGan}${p.diZhi}`).join(' | '));
        console.log('  真太阳时:', bazi.trueSolarTime.hour + '时' + bazi.trueSolarTime.minute + '分');
        
        console.log('\n【五行分布】');
        Object.entries(bazi.wuxingPercent).forEach(([wx, p]) => {
          console.log(`  ${wx}: ${(p * 100).toFixed(0)}%`);
        });
        
        console.log('\n【2025流年运势】');
        if (liuNian2025) {
          console.log('  关系:', liuNian2025.relation, '-', liuNian2025.jixiong);
          console.log('  运势:', liuNian2025.yunyishi);
        }
        
        console.log('\n【生成候选名字】共', names.count, '个');
        console.log('  宜补五行:', names.targetWuxing.bu.join('、'));
        
        const top5 = names.names.slice(0, 5);
        top5.forEach((n, i) => {
          console.log(`\n  TOP${i + 1}: ${n.fullName} (${n.analysis.totalScore}分)`);
          console.log('    五行平衡:', n.analysis.wuxingBalance.score, '分');
          console.log('    五格数理:', n.analysis.wuge.score, '分');
          console.log('    三才配置:', n.analysis.wuge.sanCai.type, '-', n.analysis.wuge.sanCai.jixiong);
          console.log('    周易卦象:', n.analysis.gua.benGua.name, '-', n.analysis.gua.benGua.jixiong);
          console.log('    声调:', n.analysis.fayinTone.description);
          console.log('    重名率:', n.analysis.chongmingRate.level, '(约', Math.floor(n.analysis.chongmingRate.rate * 100), '万人)');
        });
        
        console.log('\n===== 测试完成，所有功能正常！=====');
      } else {
        console.log('错误信息:', result.message);
      }
    } catch (e) {
      console.error('解析响应失败:', e.message);
      console.log('原始响应:', body.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('请求失败:', e.message);
});

req.write(data);
req.end();
