// 测试完整业务链路
// 此脚本模拟从需求到安装的完整业务流程

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8002/api/v1';

// 测试数据
const testData = {
  demand: {
    customerId: 'test-user-id',
    houseType: '三居室',
    area: 120,
    style: '现代简约',
    budgetRange: '10-15万',
    address: '北京市朝阳区建国路88号',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    contactName: '张三',
    contactPhone: '13800138000',
    description: '全屋定制家具'
  },
  measurement: {
    designerId: 'test-designer-id',
    address: '北京市朝阳区建国路88号',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    contactName: '张三',
    contactPhone: '13800138000',
    scheduledDate: new Date(Date.now() + 86400000).toISOString() // 明天
  },
  design: {
    designerId: 'test-designer-id',
    title: '现代简约全屋定制',
    designType: '全屋定制',
    style: '现代简约',
    materials: ['实木颗粒板', '三聚氰胺板'],
    estimatedCost: 120000,
    renderings: ['rendering1.jpg', 'rendering2.jpg'],
    blueprints: ['blueprint1.pdf']
  },
  quote: {
    designerId: 'test-designer-id',
    items: [
      {
        name: '客厅衣柜',
        quantity: 1,
        unitPrice: 15000,
        totalPrice: 15000,
        hardware: [],
        processSteps: [],
        dimensions: {
          width: 2000,
          height: 2400,
          depth: 600
        }
      },
      {
        name: '卧室衣柜',
        quantity: 2,
        unitPrice: 12000,
        totalPrice: 24000,
        hardware: [],
        processSteps: [],
        dimensions: {
          width: 1800,
          height: 2400,
          depth: 600
        }
      }
    ],
    totalAmount: 39000,
    discount: 3000,
    finalAmount: 36000
  },
  order: {
    customerId: 'test-user-id',
    title: '全屋定制订单',
    totalAmount: 36000,
    paymentMethod: '银行转账',
    address: '北京市朝阳区建国路88号',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    contactName: '张三',
    contactPhone: '13800138000'
  },
  split: {
    splitterId: 'test-user-id',
    note: '拆单测试'
  },
  production: {
    factoryId: 'test-factory-id',
    estimatedDuration: 15,
    note: '生产测试'
  },
  installation: {
    address: '北京市朝阳区建国路88号',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    contactName: '张三',
    contactPhone: '13800138000',
    difficultyLevel: 'MEDIUM',
    estimatedDuration: 240
  }
};

let businessData = {
  demandId: '',
  measurementId: '',
  designId: '',
  quoteId: '',
  orderId: '',
  splitId: '',
  productionTaskId: '',
  installationId: ''
};

// 辅助函数
async function makeRequest(method: string, url: string, data?: any) {
  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}${url}`,
      data,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
}

// 测试步骤
async function testBusinessFlow() {
  console.log('开始测试完整业务链路...');
  console.log('=' .repeat(60));

  try {
    // 1. 创建需求
    console.log('1. 创建需求...');
    const demandResponse = await makeRequest('POST', '/demands', testData.demand);
    businessData.demandId = demandResponse.data.demand.id;
    console.log(`   ✓ 需求创建成功: ${businessData.demandId}`);
    
    // 2. 分配设计师
    console.log('2. 分配设计师...');
    await makeRequest('POST', `/demands/${businessData.demandId}/assign-designer`, {
      designerId: 'test-designer-id'
    });
    console.log('   ✓ 设计师分配成功');
    
    // 3. 创建量尺任务
    console.log('3. 创建量尺任务...');
    const measurementResponse = await makeRequest('POST', '/measurements', {
      demandId: businessData.demandId,
      ...testData.measurement
    });
    businessData.measurementId = measurementResponse.data.measurement.id;
    console.log(`   ✓ 量尺任务创建成功: ${businessData.measurementId}`);
    
    // 4. 开始量尺
    console.log('4. 开始量尺...');
    await makeRequest('POST', `/measurements/${businessData.measurementId}/start`, {
      designerId: 'test-designer-id'
    });
    console.log('   ✓ 量尺开始成功');
    
    // 5. 完成量尺
    console.log('5. 完成量尺...');
    await makeRequest('POST', `/measurements/${businessData.measurementId}/complete`, {
      designerId: 'test-designer-id',
      houseArea: 120,
      roomMeasurements: {
        客厅: {
          width: 4000,
          height: 2800,
          depth: 5000
        }
      },
      sitePhotos: ['photo1.jpg', 'photo2.jpg'],
      notes: '量尺完成'
    });
    console.log('   ✓ 量尺完成成功');
    
    // 6. 创建设计
    console.log('6. 创建设计...');
    const designResponse = await makeRequest('POST', '/designs', {
      demandId: businessData.demandId,
      designerId: 'test-designer-id',
      title: testData.design.title,
      description: '全屋定制设计方案'
    });
    businessData.designId = designResponse.data.design.id;
    console.log(`   ✓ 设计创建成功: ${businessData.designId}`);
    
    // 7. 更新设计，添加效果图和设计数据
    console.log('7. 更新设计...');
    await makeRequest('PUT', `/designs/${businessData.designId}`, {
      designerId: 'test-designer-id',
      renderings: testData.design.renderings,
      blueprints: testData.design.blueprints,
      designData: {
        style: testData.design.style,
        materials: testData.design.materials,
        estimatedCost: testData.design.estimatedCost
      }
    });
    console.log('   ✓ 设计更新成功');
    
    // 8. 提交设计
    console.log('8. 提交设计...');
    await makeRequest('POST', `/designs/${businessData.designId}/submit`, {
      designerId: 'test-designer-id',
      notes: '设计已完成，请审核'
    });
    console.log('   ✓ 设计提交成功');
    
    // 9. 审核设计
    console.log('9. 审核设计...');
    await makeRequest('POST', `/designs/${businessData.designId}/review`, {
      reviewerId: 'test-user-id',
      approved: true,
      notes: '设计审核通过'
    });
    console.log('   ✓ 设计审核成功');
    
    // 10. 生成报价
    console.log('10. 生成报价...');
    const quoteResponse = await makeRequest('POST', '/quotes', {
      designId: businessData.designId,
      designerId: 'test-designer-id',
      items: testData.quote.items,
      totalAmount: testData.quote.totalAmount,
      discount: testData.quote.discount,
      finalAmount: testData.quote.finalAmount
    });
    businessData.quoteId = quoteResponse.data.quote.id;
    console.log(`   ✓ 报价生成成功: ${businessData.quoteId}`);
    
    // 11. 提交报价
    console.log('11. 提交报价...');
    await makeRequest('POST', `/quotes/${businessData.quoteId}/submit`, {});
    console.log('   ✓ 报价提交成功');
    
    // 12. 确认报价
    console.log('12. 确认报价...');
    await makeRequest('POST', `/quotes/${businessData.quoteId}/confirm`, {
      customerId: 'test-user-id'
    });
    console.log('   ✓ 报价确认成功');
    
    // 13. 创建订单
    console.log('13. 创建订单...');
    const orderResponse = await makeRequest('POST', '/orders', {
      demandId: businessData.demandId,
      quoteId: businessData.quoteId,
      designId: businessData.designId,
      ...testData.order
    });
    businessData.orderId = orderResponse.data.order.id;
    console.log(`   ✓ 订单创建成功: ${businessData.orderId}`);
    
    // 14. 签约
    console.log('14. 签约...');
    await makeRequest('POST', `/orders/${businessData.orderId}/sign-contract`, {
      contractData: {
        terms: '标准合同条款'
      }
    });
    console.log('   ✓ 签约成功');
    
    // 15. 支付
    console.log('15. 支付...');
    await makeRequest('POST', `/orders/${businessData.orderId}/payment`, {
      amount: 36000,
      paymentMethod: '银行转账',
      transactionId: 'TXN' + Date.now()
    });
    console.log('   ✓ 支付成功');
    
    // 16. 开始拆单
    console.log('16. 开始拆单...');
    const splitResponse = await makeRequest('POST', '/splits', {
      orderId: businessData.orderId,
      designId: businessData.designId,
      ...testData.split
    });
    businessData.splitId = splitResponse.data.split.id;
    console.log(`   ✓ 拆单开始成功: ${businessData.splitId}`);
    
    // 17. 执行拆单
    console.log('17. 执行拆单...');
    await makeRequest('POST', `/splits/${businessData.splitId}/execute`, {
      components: [
        {
          id: '1',
          name: '客厅衣柜门',
          type: 'DOOR',
          material: {
            materialId: 'particle_board_18',
            materialName: '实木颗粒板',
            edgeBanding: {
              top: {
                enabled: true,
                material: 'PVC_1mm',
                thickness: 1
              },
              bottom: {
                enabled: true,
                material: 'PVC_1mm',
                thickness: 1
              },
              left: {
                enabled: true,
                material: 'PVC_1mm',
                thickness: 1
              },
              right: {
                enabled: true,
                material: 'PVC_1mm',
                thickness: 1
              }
            }
          },
          dimensions: {
            width: 500,
            height: 2400,
            depth: 18,
            unit: 'mm'
          },
          hardware: [],
          processing: []
        },
        {
          id: '2',
          name: '客厅衣柜柜体',
          type: 'CABINET',
          material: {
            materialId: 'particle_board_18',
            materialName: '实木颗粒板',
            edgeBanding: {
              top: {
                enabled: true,
                material: 'PVC_1mm',
                thickness: 1
              },
              bottom: {
                enabled: true,
                material: 'PVC_1mm',
                thickness: 1
              },
              left: {
                enabled: true,
                material: 'PVC_1mm',
                thickness: 1
              },
              right: {
                enabled: true,
                material: 'PVC_1mm',
                thickness: 1
              }
            }
          },
          dimensions: {
            width: 2000,
            height: 2400,
            depth: 600,
            unit: 'mm'
          },
          hardware: [],
          processing: []
        }
      ],
      materialBom: [
        {
          material: '实木颗粒板',
          quantity: 10,
          unit: '张'
        }
      ],
      hardwareBom: [
        {
          hardware: '铰链',
          quantity: 16,
          unit: '个'
        }
      ]
    });
    console.log('   ✓ 拆单执行成功');
    
    // 18. 提交拆单
    console.log('18. 提交拆单...');
    await makeRequest('POST', `/splits/${businessData.splitId}/submit`, {
      splitterId: 'test-user-id',
      components: [
        {
          id: '1',
          name: '客厅衣柜门',
          type: 'door',
          material: '实木颗粒板',
          quantity: 4,
          dimensions: {
            width: 500,
            height: 2400,
            thickness: 18
          }
        },
        {
          id: '2',
          name: '客厅衣柜柜体',
          type: 'cabinet',
          material: '实木颗粒板',
          quantity: 1,
          dimensions: {
            width: 2000,
            height: 2400,
            depth: 600
          }
        }
      ],
      materialBom: [
        {
          material: '实木颗粒板',
          quantity: 10,
          unit: '张'
        }
      ],
      hardwareBom: [
        {
          hardware: '铰链',
          quantity: 16,
          unit: '个'
        }
      ],
      processingInstructions: [
        {
          step: '切割',
          details: '按尺寸切割板材'
        },
        {
          step: '封边',
          details: '对板材边缘进行封边处理'
        }
      ]
    });
    console.log('   ✓ 拆单提交成功');
    
    // 19. 审核拆单
    console.log('19. 审核拆单...');
    await makeRequest('POST', `/splits/${businessData.splitId}/review`, {
      reviewerId: 'test-user-id',
      approved: true,
      notes: '拆单审核通过'
    });
    console.log('   ✓ 拆单审核成功');
    
    // 20. 创建生产任务
    console.log('20. 创建生产任务...');
    const productionResponse = await makeRequest('POST', '/production', {
      orderId: businessData.orderId,
      splitId: businessData.splitId,
      title: '全屋定制生产任务',
      ...testData.production
    });
    businessData.productionTaskId = productionResponse.data.task.id;
    console.log(`   ✓ 生产任务创建成功: ${businessData.productionTaskId}`);
    
    // 21. 开始生产
    console.log('21. 开始生产...');
    await makeRequest('POST', `/production/${businessData.productionTaskId}/start`, {
      factoryId: 'test-factory-id'
    });
    console.log('   ✓ 生产开始成功');
    
    // 22. 更新生产进度
    console.log('22. 更新生产进度...');
    await makeRequest('POST', `/production/${businessData.productionTaskId}/progress`, {
      progress: 100,
      notes: '生产完成'
    });
    console.log('   ✓ 生产进度更新成功');
    
    // 23. 完成生产
    console.log('23. 完成生产...');
    await makeRequest('POST', `/production/${businessData.productionTaskId}/complete`, {
      qualityCheckPassed: true,
      notes: '生产完成'
    });
    console.log('   ✓ 生产完成成功');
    
    // 24. 创建安装任务
    console.log('24. 创建安装任务...');
    const installationResponse = await makeRequest('POST', '/installations', {
      orderId: businessData.orderId,
      ...testData.installation
    });
    businessData.installationId = installationResponse.data.installation.id;
    console.log(`   ✓ 安装任务创建成功: ${businessData.installationId}`);
    
    // 25. 智能派工
    console.log('25. 智能派工...');
    await makeRequest('POST', `/installations/${businessData.installationId}/auto-assign`, {
      preferredDate: new Date(Date.now() + 172800000).toISOString(), // 后天
      timeSlot: '上午'
    });
    console.log('   ✓ 智能派工成功');
    
    // 26. 开始安装
    console.log('26. 开始安装...');
    await makeRequest('POST', `/installations/${businessData.installationId}/start`, {
      installerId: 'test-installer-id'
    });
    console.log('   ✓ 安装开始成功');
    
    // 27. 完成安装
    console.log('27. 完成安装...');
    await makeRequest('POST', `/installations/${businessData.installationId}/complete`, {
      installerId: 'test-installer-id',
      installationPhotos: ['install1.jpg', 'install2.jpg'],
      notes: '安装完成'
    });
    console.log('   ✓ 安装完成成功');
    
    // 28. 验收安装
    console.log('28. 验收安装...');
    await makeRequest('POST', `/installations/${businessData.installationId}/accept`, {
      customerId: 'test-user-id',
      customerFeedback: '安装效果很好',
      customerRating: 5
    });
    console.log('   ✓ 安装验收成功');
    
    console.log('=' .repeat(60));
    console.log('✅ 完整业务链路测试成功！');
    console.log('业务数据:');
    console.log(JSON.stringify(businessData, null, 2));
    
  } catch (error) {
    console.log('=' .repeat(60));
    console.log('❌ 业务链路测试失败:', (error as any).message || error);
    console.log('当前业务数据:');
    console.log(JSON.stringify(businessData, null, 2));
  }
}

// 运行测试
testBusinessFlow();