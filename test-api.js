const testUserId = '8a6aaf87-ce63-4c70-a4f6-a9ffed1c1aa8';

const testDeclaration = {
  declarationType: "IMPORT",
  tradeMode: "GENERAL",
  customsCode: "2200",
  iePort: "上海港",
  shipper: "ABC贸易有限公司",
  consignee: "XYZ进出口公司",
  transportMode: "SEA",
  billOfLadingNo: "BL20260501001",
  voyageNo: "V123",
  currency: "USD",
  totalValue: 50000,
  items: [
    {
      hsCode: "8525801300",
      productName: "智能手机",
      specification: "128GB 黑色",
      originCountry: "CN",
      quantity: 100,
      unit: "台",
      unitPrice: 500,
      totalAmount: 50000
    }
  ]
};

console.log('=== 测试报关单创建 ===');
console.log('请求数据:', JSON.stringify(testDeclaration, null, 2));

fetch('http://localhost:11851/api/declarations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': testUserId
  },
  body: JSON.stringify(testDeclaration)
})
  .then(r => r.json())
  .then(data => {
    console.log('\n=== 响应结果 ===');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      const decId = data.data.id;
      console.log('\n=== 测试状态获取 ===');
      return fetch(`http://localhost:11851/api/declarations/${decId}/available-actions`, {
        headers: { 'X-User-Id': testUserId, 'X-User-Role': 'ADMIN' }
      })
        .then(r => r.json())
        .then(actions => {
          console.log('可用操作:', JSON.stringify(actions, null, 2));
          return { declaration: data.data, actions };
        });
    }
    return { declaration: data.data, actions: null };
  })
  .then(({ declaration, actions }) => {
    if (declaration && actions?.data?.availableActions?.length > 0) {
      console.log('\n=== 测试状态流转: 提交归类 ===');
      return fetch(`http://localhost:11851/api/declarations/${declaration.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': testUserId,
          'X-User-Role': 'ADMIN'
        },
        body: JSON.stringify({
          action: 'SUBMIT_FOR_CLASSIFICATION',
          comment: '测试状态流转：提交归类'
        })
      })
        .then(r => r.json())
        .then(result => {
          console.log('流转结果:', JSON.stringify(result, null, 2));
          return { declarationId: declaration.id, afterAction: result };
        });
    }
    return { declarationId: declaration?.id, afterAction: null };
  })
  .then(({ declarationId }) => {
    if (declarationId) {
      console.log('\n=== 测试税费计算 ===');
      return fetch(`http://localhost:11851/api/declarations/${declarationId}/calculate-tax`, {
        method: 'POST',
        headers: { 'X-User-Id': testUserId }
      })
        .then(r => r.json())
        .then(taxResult => {
          console.log('税费计算结果:', JSON.stringify(taxResult, null, 2));
          return declarationId;
        });
    }
    return null;
  })
  .then(declarationId => {
    if (declarationId) {
      console.log('\n=== 测试看板数据 ===');
      return Promise.all([
        fetch('http://localhost:11851/api/dashboard/status-counts').then(r => r.json()),
        fetch('http://localhost:11851/api/dashboard/kanban').then(r => r.json()),
        fetch('http://localhost:11851/api/dashboard/statistics').then(r => r.json())
      ])
        .then(([statusCounts, kanban, statistics]) => {
          console.log('状态统计:', JSON.stringify(statusCounts, null, 2));
          console.log('\n看板数据:', JSON.stringify(kanban, null, 2));
          console.log('\n统计数据:', JSON.stringify(statistics, null, 2));
        });
    }
  })
  .catch(error => {
    console.error('测试失败:', error);
  });
