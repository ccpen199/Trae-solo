const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Order, OrderItem } = require('../models/Order');
const User = require('../models/User');

const contractController = {
  
  generateContractPdf: async (req, res) => {
    try {
      const userId = req.userId;
      const { orderId } = req.params;

      const order = await Order.findOne({
        where: { id: orderId, userId },
        include: [
          {
            model: OrderItem,
            as: 'items',
            order: [['createdAt', 'ASC']]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'phone', 'realName', 'idCard', 'city', 'district', 'project', 'building', 'floor', 'houseType', 'houseArea']
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'contracts');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `contract_${order.orderNo}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc.fontSize(24).font('Helvetica-Bold').text('家装套餐服务合同', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).font('Helvetica-Bold').text('合同编号：', { continued: true });
      doc.font('Helvetica').text(order.orderNo);
      doc.text(`签订日期：${new Date().toLocaleDateString('zh-CN')}`);
      doc.moveDown(1);

      doc.strokeColor('#333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(16).font('Helvetica-Bold').text('一、甲方（业主）信息');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text(`姓名：${order.contactName || order.user?.realName || '未填写'}`);
      doc.text(`联系电话：${order.contactPhone || order.user?.phone || '未填写'}`);
      doc.text(`身份证号：${order.user?.idCard ? order.user.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : '未填写'}`);
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text('房屋信息：');
      doc.fontSize(12).font('Helvetica');
      doc.text(`城市：${order.city || order.user?.city || '未填写'}`);
      doc.text(`区域：${order.district || order.user?.district || '未填写'}`);
      doc.text(`项目：${order.project || order.user?.project || '未填写'}`);
      doc.text(`楼栋：${order.building || order.user?.building || '未填写'}`);
      doc.text(`楼层：${order.floor || order.user?.floor || '未填写'} 层`);
      doc.text(`户型：${order.houseType || order.user?.houseType || '未填写'}`);
      doc.text(`房屋面积：${order.houseArea || order.user?.houseArea || '未填写'} 平方米`);
      doc.moveDown(1);

      doc.strokeColor('#333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(16).font('Helvetica-Bold').text('二、乙方（服务方）信息');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text('公司名称：标准化套餐服务有限公司');
      doc.text('联系电话：400-888-8888');
      doc.text('地址：北京市朝阳区服务中心大厦');
      doc.moveDown(1);

      doc.strokeColor('#333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(16).font('Helvetica-Bold').text('三、套餐及服务内容');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text(`套餐名称：${order.packageName}`);
      doc.text(`套餐编码：${order.packageCode}`);
      doc.text(`套餐单价：¥${order.packageUnitPrice || 0} 元/平方米`);
      doc.text(`房屋面积：${order.houseArea || 0} 平方米`);
      doc.text(`套餐总价：¥${order.packagePrice || 0} 元`);
      doc.moveDown(0.5);

      if (order.selectedAttributes && Object.keys(order.selectedAttributes).length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('选择的套餐属性：');
        doc.fontSize(12).font('Helvetica');
        Object.entries(order.selectedAttributes).forEach(([key, value]) => {
          doc.text(`  • ${key}：${value}`);
        });
        doc.moveDown(0.5);
      }

      if (order.items && order.items.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('订单项详情：');
        doc.moveDown(0.3);
        
        const tableStartY = doc.y;
        const col1X = 50;
        const col2X = 180;
        const col3X = 320;
        const col4X = 400;
        const col5X = 480;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('商品类型', col1X, tableStartY);
        doc.text('商品名称', col2X, tableStartY);
        doc.text('单价', col3X, tableStartY);
        doc.text('数量', col4X, tableStartY);
        doc.text('小计', col5X, tableStartY);
        
        let rowY = tableStartY + 20;
        
        order.items.forEach(item => {
          doc.fontSize(10).font('Helvetica');
          const itemType = {
            'package': '套餐',
            'accessory': '配件',
            'upgrade': '改造包'
          }[item.itemType] || item.itemType;
          
          doc.text(itemType, col1X, rowY);
          doc.text(item.itemName?.substring(0, 15), col2X, rowY);
          doc.text(`¥${item.unitPrice || 0}`, col3X, rowY);
          doc.text(`${item.quantity || 1}`, col4X, rowY);
          doc.text(`¥${item.totalPrice || 0}`, col5X, rowY);
          rowY += 20;
        });

        doc.y = rowY + 10;
      }
      doc.moveDown(1);

      doc.strokeColor('#333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(16).font('Helvetica-Bold').text('四、价格及付款方式');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text(`套餐费用：¥${order.packagePrice || 0} 元`);
      doc.text(`优化改造包费用：¥${order.upgradePrice || 0} 元`);
      doc.text(`配件费用：¥${order.accessoryPrice || 0} 元`);
      if (order.discountAmount > 0) {
        doc.text(`优惠减免：-¥${order.discountAmount || 0} 元`);
      }
      doc.moveDown(0.3);
      doc.fontSize(14).font('Helvetica-Bold').text(`合同总金额：¥${order.totalPrice || 0} 元`);
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text('付款方式：');
      doc.text('  1. 合同签订时支付30%定金');
      doc.text('  2. 材料进场后支付40%进度款');
      doc.text('  3. 工程竣工验收合格后支付30%尾款');
      doc.moveDown(1);

      doc.strokeColor('#333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(16).font('Helvetica-Bold').text('五、双方权利与义务');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text('（一）甲方权利与义务：');
      doc.text('1. 有权监督乙方的服务质量和进度；');
      doc.text('2. 应按合同约定及时支付款项；');
      doc.text('3. 应配合乙方进行现场测量、设计等前期工作；');
      doc.text('4. 应提供施工所需的场地条件。');
      doc.moveDown(0.5);
      doc.text('（二）乙方权利与义务：');
      doc.text('1. 有权按合同约定收取服务费用；');
      doc.text('2. 应按合同约定提供合格的产品和服务；');
      doc.text('3. 应保证施工质量和工期；');
      doc.text('4. 应提供售后服务和质量保证。');
      doc.moveDown(1);

      doc.strokeColor('#333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(16).font('Helvetica-Bold').text('六、违约责任');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text('1. 甲方逾期付款的，每逾期一日按应付金额的0.1‰支付违约金；');
      doc.text('2. 乙方逾期完工的，每逾期一日按合同总金额的0.1‰支付违约金；');
      doc.text('3. 任何一方擅自解除合同的，应向对方支付合同总金额10%的违约金；');
      doc.text('4. 因质量问题造成损失的，责任方应承担全部赔偿责任。');
      doc.moveDown(1);

      doc.strokeColor('#333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(16).font('Helvetica-Bold').text('七、争议解决');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text('本合同履行过程中发生的争议，双方应友好协商解决；协商不成的，');
      doc.text('任何一方可向合同签订地人民法院提起诉讼。');
      doc.moveDown(1);

      doc.strokeColor('#333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(16).font('Helvetica-Bold').text('八、其他约定');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text('1. 本合同自双方签字盖章之日起生效；');
      doc.text('2. 本合同未尽事宜，双方可另行签订补充协议；');
      doc.text('3. 本合同一式两份，甲乙双方各执一份，具有同等法律效力。');
      doc.moveDown(2);

      const signY = doc.y;
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('甲方（业主）签字：', 50, signY);
      doc.text('乙方（服务方）盖章：', 350, signY);
      
      doc.fontSize(10).font('Helvetica');
      doc.text('日期：________________', 50, signY + 80);
      doc.text('日期：________________', 350, signY + 80);

      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      const pdfUrl = `/uploads/contracts/${fileName}`;

      await order.update({
        contractGenerated: true,
        contractPdfUrl: pdfUrl
      });

      res.json({
        success: true,
        message: '合同生成成功',
        data: {
          orderId: order.id,
          orderNo: order.orderNo,
          pdfUrl,
          fileName
        }
      });
    } catch (error) {
      console.error('生成合同PDF失败:', error);
      res.status(500).json({
        success: false,
        message: '生成合同PDF失败',
        error: error.message
      });
    }
  },

  getContractPreview: async (req, res) => {
    try {
      const userId = req.userId;
      const { orderId } = req.params;

      const order = await Order.findOne({
        where: { id: orderId, userId },
        include: [
          {
            model: OrderItem,
            as: 'items'
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'phone', 'realName', 'idCard', 'city', 'district', 'project', 'building', 'floor', 'houseType', 'houseArea']
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      const contractData = {
        orderNo: order.orderNo,
        contractDate: new Date().toLocaleDateString('zh-CN'),
        partyA: {
          name: order.contactName || order.user?.realName || '未填写',
          phone: order.contactPhone || order.user?.phone || '未填写',
          idCard: order.user?.idCard ? order.user.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : '未填写'
        },
        houseInfo: {
          city: order.city || order.user?.city || '未填写',
          district: order.district || order.user?.district || '未填写',
          project: order.project || order.user?.project || '未填写',
          building: order.building || order.user?.building || '未填写',
          floor: order.floor || order.user?.floor || '未填写',
          houseType: order.houseType || order.user?.houseType || '未填写',
          houseArea: order.houseArea || order.user?.houseArea || '未填写'
        },
        package: {
          name: order.packageName,
          code: order.packageCode,
          unitPrice: order.packageUnitPrice || 0,
          houseArea: order.houseArea || 0,
          totalPrice: order.packagePrice || 0,
          selectedAttributes: order.selectedAttributes || {}
        },
        items: order.items || [],
        pricing: {
          packagePrice: order.packagePrice || 0,
          upgradePrice: order.upgradePrice || 0,
          accessoryPrice: order.accessoryPrice || 0,
          discountAmount: order.discountAmount || 0,
          totalPrice: order.totalPrice || 0
        },
        status: order.status,
        contractGenerated: order.contractGenerated,
        contractPdfUrl: order.contractPdfUrl
      };

      res.json({
        success: true,
        data: contractData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取合同预览失败',
        error: error.message
      });
    }
  },

  downloadContract: async (req, res) => {
    try {
      const { fileName } = req.params;
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'contracts', fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: '合同文件不存在'
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '下载合同失败',
        error: error.message
      });
    }
  }
};

module.exports = contractController;
