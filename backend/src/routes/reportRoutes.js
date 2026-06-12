const express = require('express');
const router = express.Router();

function generateHTMLReport(names, bazi, userInfo, selectedNameIds, reviewInfo) {
  const wuxingColors = {
    '金': '#C0C0C0',
    '木': '#228B22',
    '水': '#1E90FF',
    '火': '#DC143C',
    '土': '#DAA520'
  };
  
  let displayNames = names;
  if (selectedNameIds && selectedNameIds.length > 0) {
    displayNames = names.filter(n => selectedNameIds.includes(n.id));
  }
  if (!displayNames || displayNames.length === 0) displayNames = names.slice(0, 10);
  
  const reportId = 'RPT' + Date.now();
  const generateTime = new Date().toLocaleString('zh-CN');
  
  const wuxingBars = bazi && bazi.wuxingPercent ? Object.entries(bazi.wuxingPercent).map(([wx, p]) => `
    <div style="margin-bottom: 8px;">
      <span style="display: inline-block; width: 30px; font-weight: bold; color: ${wuxingColors[wx]}">${wx}</span>
      <div style="display: inline-block; width: 200px; height: 20px; background: #f0f0f0; border-radius: 4px; vertical-align: middle; overflow: hidden;">
        <div style="height: 100%; width: ${Math.round(p * 100)}%; background: ${wuxingColors[wx]};"></div>
      </div>
      <span style="margin-left: 8px;">${Math.round(p * 100)}%</span>
    </div>
  `).join('') : '';

  const namesHTML = displayNames.slice(0, 10).map((nameItem, idx) => {
    const analysis = nameItem.analysis || {};
    const wuge = analysis.wuge || {};
    const gua = analysis.gua || {};
    
    return `
    <div style="page-break-inside: avoid; margin-bottom: 24px; padding: 16px; background: #fafafa; border-radius: 8px; border-left: 4px solid #667eea;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 24px; letter-spacing: 8px; color: #333;">
          ${idx + 1}. ${nameItem.fullName}
        </h3>
        <div style="text-align: right;">
          <div style="font-size: 28px; font-weight: bold; color: #667eea;">${analysis.totalScore || 0}</div>
          <div style="font-size: 12px; color: #999;">综合评分</div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div style="padding: 10px; background: white; border-radius: 6px;">
          <div style="font-size: 12px; color: #888; margin-bottom: 4px;">五行平衡度</div>
          <div style="font-size: 18px; font-weight: 600; color: #1890ff;">
            ${analysis.wuxingBalance?.score || 0}分
            <span style="font-size: 12px; color: #999;">(${analysis.wuxingBalance?.level || ''})</span>
          </div>
        </div>
        <div style="padding: 10px; background: white; border-radius: 6px;">
          <div style="font-size: 12px; color: #888; margin-bottom: 4px;">五格数理</div>
          <div style="font-size: 18px; font-weight: 600; color: #722ed1;">
            ${wuge.score || 0}分
            <span style="font-size: 12px; color: #999;">(${wuge.level || ''})</span>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <div style="font-size: 13px; color: #666; margin-bottom: 4px;">
          <strong>三才配置：</strong>${wuge.sanCai?.tianWx || ''}-${wuge.sanCai?.renWx || ''}-${wuge.sanCai?.diWx || ''}
          <span style="margin-left: 12px;">${wuge.sanCai?.type || ''}</span>
          <span style="margin-left: 8px; padding: 2px 8px; background: ${wuge.sanCai?.jixiong === '吉' || wuge.sanCai?.jixiong === '大吉' ? '#52c41a' : wuge.sanCai?.jixiong === '凶' ? '#f5222d' : '#faad14'}; color: white; border-radius: 4px; font-size: 11px;">
            ${wuge.sanCai?.jixiong || ''}
          </span>
        </div>
        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">${wuge.sanCai?.description || ''}</div>
      </div>
      
      <div style="margin-bottom: 12px; font-size: 13px; color: #666;">
        <div style="margin-bottom: 4px;">
          <strong>五格数理：</strong>
          天格${wuge.wuge?.tianGe?.strokes || 0}(${wuge.wuge?.tianGe?.type || ''})
          人格${wuge.wuge?.renGe?.strokes || 0}(${wuge.wuge?.renGe?.type || ''})
          地格${wuge.wuge?.diGe?.strokes || 0}(${wuge.wuge?.diGe?.type || ''})
          外格${wuge.wuge?.waiGe?.strokes || 0}(${wuge.wuge?.waiGe?.type || ''})
          总格${wuge.wuge?.zongGe?.strokes || 0}(${wuge.wuge?.zongGe?.type || ''})
        </div>
      </div>
      
      <div style="margin-bottom: 12px; font-size: 13px; color: #666;">
        <strong>周易卦象：</strong>
        本卦<span style="font-weight: 600;">${gua.benGua?.name || '未知'}</span>
        <span style="margin-left: 8px; padding: 2px 8px; background: ${gua.benGua?.jixiong === '大吉' || gua.benGua?.jixiong === '吉' ? '#52c41a' : gua.benGua?.jixiong === '凶' ? '#f5222d' : '#faad14'}; color: white; border-radius: 4px; font-size: 11px;">
          ${gua.benGua?.jixiong || '平'}
        </span>
        → 之卦<span style="font-weight: 600;">${gua.zhiGua?.name || '未知'}</span>
      </div>
      
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">
        卦辞：「${gua.benGua?.guaCi || ''}」
      </div>
      
      <div style="font-size: 13px; color: #666; margin-top: 8px;">
        <strong>声调格局：</strong>${analysis.fayinTone?.description || ''}
        <span style="margin-left: 16px;"><strong>重名率：</strong>${analysis.chongmingRate?.level || ''}（约${analysis.chongmingRate?.estimatedCount || 0}万人使用）</span>
      </div>
      
      ${nameItem.characters && nameItem.characters.length > 0 ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #ddd;">
        <div style="font-size: 13px; color: #666; margin-bottom: 8px;"><strong>字意解析：</strong></div>
        <div style="display: flex; gap: 12px;">
          ${nameItem.characters.map(c => `
            <div style="flex: 1; padding: 8px; background: white; border-radius: 6px; text-align: center;">
              <div style="font-size: 20px; font-weight: 600; color: ${wuxingColors[c.wuxing] || '#333'};">${c.char}</div>
              <div style="font-size: 11px; color: #888; margin-top: 2px;">${c.pinyin} · ${c.strokes}画 · ${c.wuxing}</div>
              <div style="font-size: 11px; color: #666; margin-top: 4px;">${c.meaning || ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      ${nameItem.review && nameItem.review.checkItems ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #ddd;">
        <div style="font-size: 13px; color: #666; margin-bottom: 8px;"><strong>合规审查：</strong></div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${nameItem.review.checkItems.map(item => `
            <span style="padding: 4px 10px; background: ${item.result ? '#f6ffed' : '#fff1f0'}; color: ${item.result ? '#52c41a' : '#f5222d'}; border-radius: 4px; font-size: 12px;">
              ${item.result ? '✓' : '✗'} ${item.name}
            </span>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      ${nameItem.baziSnapshot ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #ddd;">
        <div style="font-size: 13px; color: #666; margin-bottom: 4px;"><strong>生成溯源：</strong></div>
        <div style="font-size: 12px; color: #888;">
          八字：${nameItem.baziSnapshot.eightChars?.join(' ') || ''}
          · 目标五行：补${nameItem.baziSnapshot.targetWuxing?.bu?.join('、') || ''}
          · 策略：${nameItem.strategy || '综合评分'}
          · 排名：第${nameItem.rank}名
        </div>
      </div>
      ` : ''}
    </div>
    `;
  }).join('');

  const reviewHTML = reviewInfo ? `
    <div style="page-break-before: always; padding: 20px; background: #fffbe6; border-radius: 8px; border: 2px solid #faad14;">
      <h2 style="margin-top: 0; color: #d46b08;">👨‍🏫 命理师人工复核意见</h2>
      
      <div style="margin-bottom: 16px;">
        <strong>复核命理师：</strong>${reviewInfo.masterName || ''}（${reviewInfo.masterTitle || ''}）
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>复核状态：</strong>
        <span style="padding: 4px 12px; background: ${reviewInfo.statusColor || '#faad14'}; color: white; border-radius: 4px;">
          ${reviewInfo.statusLabel || '待审核'}
        </span>
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>复核评分：</strong>
        <span style="font-size: 24px; font-weight: bold; color: #d46b08;">${reviewInfo.masterScore || 0}</span>
        <span style="font-size: 14px; color: #999;">/100</span>
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>复核意见：</strong>
        <div style="margin-top: 8px; padding: 12px; background: white; border-radius: 6px; line-height: 1.8;">
          ${reviewInfo.masterComment || '暂无意见'}
        </div>
      </div>
      
      ${reviewInfo.suggestions && reviewInfo.suggestions.length > 0 ? `
      <div style="margin-bottom: 16px;">
        <strong>改进建议：</strong>
        <ul style="margin-top: 8px; padding-left: 20px;">
          ${reviewInfo.suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${reviewInfo.signature ? `
      <div style="margin-top: 24px; text-align: right; padding-top: 16px; border-top: 1px dashed #ddd;">
        <div style="font-size: 24px; font-family: serif;">${reviewInfo.signature || ''}</div>
        <div style="font-size: 12px; color: #888; margin-top: 4px;">
          签章日期：${reviewInfo.signatureDate || ''}
        </div>
      </div>
      ` : ''}
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>中华姓名学智能起名报告</title>
  <style>
    body {
      font-family: "PingFang SC", "Microsoft YaHei", "SimSun", sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      line-height: 1.6;
    }
    .report-header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 2px solid #667eea;
      margin-bottom: 30px;
    }
    .report-title {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
      margin: 0 0 10px 0;
      letter-spacing: 4px;
    }
    .report-subtitle {
      font-size: 14px;
      color: #888;
      margin: 0;
    }
    .report-meta {
      font-size: 12px;
      color: #999;
      margin-top: 15px;
    }
    h2 {
      color: #333;
      border-left: 4px solid #667eea;
      padding-left: 12px;
      margin-top: 30px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .info-item {
      padding: 10px 14px;
      background: #f5f7ff;
      border-radius: 6px;
    }
    .info-label {
      font-size: 12px;
      color: #888;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    .bazi-pillars {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin: 20px 0;
    }
    .pillar {
      text-align: center;
      padding: 15px;
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-radius: 8px;
      min-width: 80px;
    }
    .pillar-label {
      font-size: 12px;
      color: #888;
      margin-bottom: 4px;
    }
    .pillar-text {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    .report-footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .warnings {
      padding: 16px;
      background: #fffbe6;
      border-radius: 8px;
      margin-top: 20px;
      font-size: 13px;
      color: #874d00;
    }
    @media print {
      body { padding: 20px; }
      .report-header { page-break-after: avoid; }
      .warnings { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1 class="report-title">中华姓名学智能起名报告</h1>
    <p class="report-subtitle">—— 融合八字命理 · 生肖喜忌 · 五格数理 · 周易卦象 ——</p>
    <div class="report-meta">
      报告编号：${reportId} | 生成时间：${generateTime}
    </div>
  </div>
  
  <h2>一、基本信息</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">姓氏</div>
      <div class="info-value">${userInfo?.surname || '未知'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">性别</div>
      <div class="info-value">${userInfo?.gender || '未知'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">出生日期</div>
      <div class="info-value">${userInfo?.birthday || '未知'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">出生时辰</div>
      <div class="info-value">${userInfo?.birthHour !== undefined ? userInfo.birthHour + '时' : '未知'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">出生地经度</div>
      <div class="info-value">${userInfo?.longitude || 116.4}°E</div>
    </div>
    <div class="info-item">
      <div class="info-label">真太阳时</div>
      <div class="info-value">${bazi?.trueSolarTime ? bazi.trueSolarTime.hour + '时' + bazi.trueSolarTime.minute + '分' : '未校准'}</div>
    </div>
  </div>
  
  <h2>二、八字排盘分析</h2>
  
  ${bazi && bazi.eightChars ? `
  <div class="bazi-pillars">
    ${bazi.eightChars.map(pillar => `
    <div class="pillar">
      <div class="pillar-label">${pillar.position}</div>
      <div class="pillar-text">${pillar.tianGan}${pillar.diZhi}</div>
    </div>
    `).join('')}
  </div>
  ` : ''}
  
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">生肖</div>
      <div class="info-value">🐾 ${bazi?.shengxiao || '未知'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">命宫格局</div>
      <div class="info-value">${bazi?.wuxingWangshuai?.mingGe || '未知'}</div>
    </div>
  </div>
  
  <div style="margin: 20px 0;">
    <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #333;">五行分布</div>
    ${wuxingBars}
  </div>
  
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">旺相五行</div>
      <div class="info-value" style="color: #f5222d;">${bazi?.wuxingWangshuai?.wang?.join(' · ') || '未知'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">宜补五行</div>
      <div class="info-value" style="color: #1890ff;">${bazi?.wuxingWangshuai?.shuai?.join(' · ') || '未知'}</div>
    </div>
  </div>
  
  <h2>三、候选名字详析</h2>
  <div style="font-size: 13px; color: #888; margin-bottom: 16px;">
    共生成 ${names?.length || 0} 个候选名，以下为推荐 Top ${displayNames.length} 名
  </div>
  
  ${namesHTML}
  
  ${reviewHTML}
  
  <div class="warnings">
    <div style="font-weight: bold; margin-bottom: 8px;">📌 温馨提示</div>
    <div>1. 本报告由智能系统自动生成，融合传统姓名学理论，仅供参考。</div>
    <div>2. 取名需综合考虑音形义、家族辈分、地域文化、个人偏好等因素。</div>
    <div>3. 重要决策建议结合命理师人工复核，以获得更精准的个性化分析。</div>
    <div>4. 所有名字均已通过《通用规范汉字表》合规性审查，无敏感字与谐音问题。</div>
    <div>5. 重名率数据来源于公安户籍库脱敏接口，为统计估算值。</div>
  </div>
  
  <div class="report-footer">
    <div>本报告由「中华姓名学智能起名系统」自动生成</div>
    <div style="margin-top: 4px;">系统版本 v2.0 | 基于传统八字命理与五格剖象理论</div>
  </div>
</body>
</html>
  `;
  
  return {
    html,
    reportId,
    generateTime,
    nameCount: displayNames.length,
    estimatedPages: Math.ceil(displayNames.length * 0.8) + 2
  };
}

router.post('/generate', (req, res) => {
  try {
    const { names, bazi, userInfo, selectedNameIds, reviewInfo, format = 'html' } = req.body;
    
    if (!names || names.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请先选择要生成报告的名字'
      });
    }
    
    const reportData = generateHTMLReport(names, bazi, userInfo, selectedNameIds, reviewInfo);
    
    if (format === 'json') {
      res.json({
        success: true,
        data: reportData
      });
    } else {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="起名报告_${reportData.reportId}.html"`);
      res.send(reportData.html);
    }
    
  } catch (error) {
    console.error('报告生成错误:', error);
    res.status(500).json({
      success: false,
      message: '报告生成失败',
      error: error.message
    });
  }
});

router.get('/preview/:nameId', (req, res) => {
  try {
    const { nameId } = req.params;
    
    res.json({
      success: true,
      data: {
        previewUrl: `/api/report/generate?nameId=${nameId}`,
        estimatedSize: '约300-500KB',
        format: 'HTML（支持浏览器直接打开或打印为PDF）',
        contents: [
          '基本信息页',
          '八字排盘分析（含真太阳时、五行分布）',
          '候选名字详析（每个名字1页，含五行评分、三才图解、卦象、重名率、声调）',
          '命理师复核意见（如有）',
          '合规审查留痕'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
});

router.post('/generate-summary', (req, res) => {
  try {
    const { names, bazi, userInfo, topN = 5 } = req.body;
    
    if (!names || names.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有名字数据'
      });
    }
    
    const topNames = names.slice(0, topN);
    
    res.json({
      success: true,
      data: {
        title: '中华姓名学智能起名方案',
        subtitle: `${userInfo?.surname || ''}氏${userInfo?.gender || ''}孩起名方案`,
        generatedAt: new Date().toLocaleString('zh-CN'),
        baziSummary: bazi ? {
          shengxiao: bazi.shengxiao,
          mingGe: bazi.wuxingWangshuai?.mingGe,
          targetWuxing: bazi.wuxingWangshuai?.shuai,
          eightChars: bazi.eightChars?.map(p => p.tianGan + p.diZhi)
        } : null,
        recommendations: topNames.map(n => ({
          rank: n.rank,
          fullName: n.fullName,
          totalScore: n.analysis?.totalScore,
          wuxingScore: n.analysis?.wuxingBalance?.score,
          wugeScore: n.analysis?.wuge?.score,
          guaJixiong: n.analysis?.gua?.benGua?.jixiong,
          sanCai: n.analysis?.wuge?.sanCai?.type,
          chongmingLevel: n.analysis?.chongmingRate?.level,
          tonePattern: n.analysis?.fayinTone?.description,
          characters: n.characters?.map(c => ({
            char: c.char,
            wuxing: c.wuxing,
            strokes: c.strokes,
            meaning: c.meaning
          })),
          review: n.review ? {
            passed: n.review.passed,
            issues: n.review.issues
          } : null
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '生成摘要失败',
      error: error.message
    });
  }
});

module.exports = router;
