const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

router.post('/generate', (req, res) => {
  try {
    const { names, bazi, userInfo, selectedNameIds } = req.body;
    
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: '中华姓名学智能起名报告',
        Author: '中华姓名学智能起名系统',
        Subject: '起名分析报告'
      }
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="起名报告.pdf"');
    
    doc.pipe(res);
    
    doc.fontSize(24).text('中华姓名学智能起名报告', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('—— 融合八字命理、生肖喜忌、五格数理、周易卦象 ——', { align: 'center' });
    doc.moveDown(2);
    
    if (userInfo) {
      doc.fontSize(16).text('一、基本信息', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`姓氏：${userInfo.surname || '未知'}`);
      doc.text(`性别：${userInfo.gender || '未知'}`);
      doc.text(`出生日期：${userInfo.birthday || '未知'}`);
      doc.text(`出生时辰：${userInfo.birthHour !== undefined ? userInfo.birthHour + '时' : '未知'}`);
      doc.moveDown();
    }
    
    if (bazi) {
      doc.fontSize(16).text('二、八字排盘分析', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      
      if (bazi.eightChars) {
        doc.text('八字四柱：');
        bazi.eightChars.forEach(pillar => {
          doc.text(`  ${pillar.position}：${pillar.tianGan}${pillar.diZhi}`);
        });
      }
      
      doc.moveDown();
      doc.text(`生肖：${bazi.shengxiao || '未知'}`);
      doc.text(`命宫：${bazi.wuxingWangshuai?.mingGe || '未知'}`);
      doc.moveDown();
      
      if (bazi.wuxingPercent) {
        doc.text('五行分布：');
        const wuxingColors = {
          '金': '#C0C0C0',
          '木': '#228B22',
          '水': '#1E90FF',
          '火': '#DC143C',
          '土': '#DAA520'
        };
        Object.entries(bazi.wuxingPercent).forEach(([wx, percent]) => {
          const barWidth = percent * 200;
          doc.text(`  ${wx}：${(percent * 100).toFixed(0)}%`);
        });
      }
      
      doc.moveDown();
      
      if (bazi.wuxingWangshuai) {
        doc.text(`旺相五行：${bazi.wuxingWangshuai.wang?.join('、') || '未知'}`);
        doc.text(`衰弱五行：${bazi.wuxingWangshuai.shuai?.join('、') || '未知'}`);
      }
      
      doc.moveDown(2);
    }
    
    doc.fontSize(16).text('三、候选名字分析', { underline: true });
    doc.moveDown();
    
    let displayNames = names;
    if (selectedNameIds && selectedNameIds.length > 0) {
      displayNames = names.filter(n => selectedNameIds.includes(n.id));
    }
    
    if (displayNames && displayNames.length > 0) {
      displayNames.slice(0, 10).forEach((nameItem, index) => {
        doc.fontSize(14).text(`${index + 1}. ${nameItem.fullName || nameItem.name}`);
        doc.fontSize(12);
        
        if (nameItem.analysis) {
          doc.text(`   综合评分：${nameItem.analysis.totalScore}分`);
          
          if (nameItem.analysis.wuxingBalance) {
            doc.text(`   五行平衡度：${nameItem.analysis.wuxingBalance.score}分`);
          }
          
          if (nameItem.analysis.wuge) {
            doc.text(`   五格评分：${nameItem.analysis.wuge.score}分`);
            if (nameItem.analysis.wuge.sanCai) {
              doc.text(`   三才配置：${nameItem.analysis.wuge.sanCai.type}（${nameItem.analysis.wuge.sanCai.jixiong}）`);
            }
          }
          
          if (nameItem.analysis.gua) {
            doc.text(`   周易卦象：${nameItem.analysis.gua.benGua?.name || '未知'}（${nameItem.analysis.gua.benGua?.jixiong || '平'}）`);
          }
          
          if (nameItem.analysis.chongmingRate) {
            doc.text(`   重名率：${nameItem.analysis.chongmingRate.rate}/10万（${nameItem.analysis.chongmingRate.level}）`);
          }
          
          if (nameItem.analysis.fayinTone) {
            doc.text(`   声调格局：${nameItem.analysis.fayinTone.description || '未知'}`);
          }
        }
        
        doc.moveDown();
      });
    }
    
    doc.moveDown(2);
    doc.fontSize(14).text('四、温馨提示', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text('1. 本报告由智能系统自动生成，仅供参考。');
    doc.text('2. 取名需综合考虑音形义、家族辈分、地域文化等因素。');
    doc.text('3. 建议结合命理师人工复核，以获得更精准的分析。');
    doc.text('4. 所有名字均符合《通用规范汉字表》用字规范。');
    doc.moveDown(2);
    
    doc.fontSize(10).text('报告生成时间：' + new Date().toLocaleString('zh-CN'), { align: 'right' });
    doc.text('中华姓名学智能起名系统 出品', { align: 'right' });
    
    doc.end();
    
  } catch (error) {
    console.error('PDF生成错误:', error);
    res.status(500).json({
      success: false,
      message: 'PDF生成失败',
      error: error.message
    });
  }
});

router.get('/preview/:nameId', (req, res) => {
  res.json({
    success: true,
    data: {
      previewUrl: '/api/report/generate',
      estimatedSize: '约2-3MB'
    }
  });
});

module.exports = router;
