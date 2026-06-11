const http = require('http');

function testAPI() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      surname: '李',
      gender: '男',
      birthday: '2025-06-15',
      birthHour: 10,
      birthMinute: 30,
      longitude: 116.4,
      nameLength: 2,
      wish: '聪明健康'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/names/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('=== API 响应状态 ===');
        console.log('HTTP Status:', res.statusCode);
        console.log('响应长度:', data.length, '字节');
        
        if (data.length > 0) {
          try {
            const json = JSON.parse(data);
            console.log('\n=== 解析结果 ===');
            console.log('success:', json.success);
            if (!json.success) {
              console.log('ERROR:', json.message);
              console.log('Stack:', json.error);
            } else {
              console.log('八字生肖:', json.data.bazi.shengxiao);
              console.log('生成名字数:', json.data.names.count);
              console.log('目标五行:', json.data.names.targetWuxing);
              
              if (json.data.names.names.length > 0) {
                console.log('\n=== 前5名候选名 ===');
                json.data.names.names.slice(0, 5).forEach(n => {
                  console.log(`  ${n.rank}. ${n.fullName} - ${n.analysis.totalScore}分 | 五行:${n.analysis.wuxingBalance.score} 五格:${n.analysis.wuge.score}`);
                });
              } else {
                console.log('\n⚠️  没有生成任何名字！');
                console.log('targetWuxing:', JSON.stringify(json.data.names.targetWuxing));
              }
              
              if (json.data.liuNian2025) {
                console.log('\n=== 2025流年 ===');
                console.log('关系:', json.data.liuNian2025.relation, json.data.liuNian2025.jixiong);
              }
            }
            resolve(json);
          } catch (e) {
            console.log('JSON解析失败:', e.message);
            console.log('原始数据前1000字符:', data.substring(0, 1000));
            resolve(null);
          }
        } else {
          console.log('⚠️  响应为空！');
          resolve(null);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('请求错误:', e.message);
      resolve(null);
    });
    
    req.write(postData);
    req.end();
  });
}

testAPI();
