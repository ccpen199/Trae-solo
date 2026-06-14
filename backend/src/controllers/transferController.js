const TransferOrder = require('../models/TransferOrder');

const getList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { status, role } = req.query;

    const query = {};
    if (status) query.status = status;

    if (role === 'out') {
      query.outEnterpriseId = req.user._id;
    } else if (role === 'in') {
      query.inEnterpriseId = req.user._id;
    } else if (role === 'transporter') {
      query.transporterId = req.user._id;
    } else if (req.user.role !== 'admin') {
      query.$or = [
        { outEnterpriseId: req.user._id },
        { inEnterpriseId: req.user._id },
        { transporterId: req.user._id }
      ];
    }

    const total = await TransferOrder.countDocuments(query);
    const transferOrders = await TransferOrder.find(query)
      .populate('outEnterpriseId', 'username companyName')
      .populate('inEnterpriseId', 'username companyName')
      .populate('transporterId', 'username companyName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: {
        list: transferOrders,
        total,
        page,
        pageSize
      },
      message: '获取转移联单列表成功'
    });
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transferOrder = await TransferOrder.findById(id)
      .populate('outEnterpriseId', 'username companyName phone')
      .populate('inEnterpriseId', 'username companyName phone')
      .populate('transporterId', 'username companyName phone');

    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '转移联单不存在'
      });
    }

    if (req.user.role !== 'admin' &&
        transferOrder.outEnterpriseId?.toString() !== req.user._id.toString() &&
        transferOrder.inEnterpriseId?.toString() !== req.user._id.toString() &&
        transferOrder.transporterId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限查看此转移联单'
      });
    }

    res.json({
      success: true,
      data: transferOrder,
      message: '获取转移联单详情成功'
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      wasteId, wasteName, hazardousCode, weight,
      outProvince, outCity, outEnterpriseName,
      inProvince, inCity, inEnterpriseId, inEnterpriseName,
      transporterId, transporterName, attachments
    } = req.body;

    const transferNo = 'TRF' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

    const transferOrder = new TransferOrder({
      transferNo,
      wasteId,
      wasteName,
      hazardousCode,
      weight,
      outProvince,
      outCity,
      outEnterpriseId: req.user._id,
      outEnterpriseName: outEnterpriseName || req.user.companyName || req.user.username,
      inProvince,
      inCity,
      inEnterpriseId,
      inEnterpriseName,
      transporterId,
      transporterName,
      status: 'draft',
      attachments
    });

    await transferOrder.save();

    res.status(201).json({
      success: true,
      data: transferOrder,
      message: '创建转移联单成功'
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transferOrder = await TransferOrder.findById(id);
    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '转移联单不存在'
      });
    }

    if (transferOrder.outEnterpriseId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限修改此转移联单'
      });
    }

    if (transferOrder.status !== 'draft') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法修改'
      });
    }

    const {
      wasteName, hazardousCode, weight,
      outProvince, outCity, outEnterpriseName,
      inProvince, inCity, inEnterpriseId, inEnterpriseName,
      transporterId, transporterName, attachments
    } = req.body;

    const updateData = {};
    if (wasteName !== undefined) updateData.wasteName = wasteName;
    if (hazardousCode !== undefined) updateData.hazardousCode = hazardousCode;
    if (weight !== undefined) updateData.weight = weight;
    if (outProvince !== undefined) updateData.outProvince = outProvince;
    if (outCity !== undefined) updateData.outCity = outCity;
    if (outEnterpriseName !== undefined) updateData.outEnterpriseName = outEnterpriseName;
    if (inProvince !== undefined) updateData.inProvince = inProvince;
    if (inCity !== undefined) updateData.inCity = inCity;
    if (inEnterpriseId !== undefined) updateData.inEnterpriseId = inEnterpriseId;
    if (inEnterpriseName !== undefined) updateData.inEnterpriseName = inEnterpriseName;
    if (transporterId !== undefined) updateData.transporterId = transporterId;
    if (transporterName !== undefined) updateData.transporterName = transporterName;
    if (attachments !== undefined) updateData.attachments = attachments;

    const updated = await TransferOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updated,
      message: '更新转移联单成功'
    });
  } catch (error) {
    next(error);
  }
};

const submit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transferOrder = await TransferOrder.findById(id);
    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '转移联单不存在'
      });
    }

    if (transferOrder.outEnterpriseId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限提交审核'
      });
    }

    if (transferOrder.status !== 'draft') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法提交审核'
      });
    }

    transferOrder.status = 'submitted';
    transferOrder.submitTime = new Date();
    await transferOrder.save();

    res.json({
      success: true,
      data: transferOrder,
      message: '提交审核成功'
    });
  } catch (error) {
    next(error);
  }
};

const approve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const transferOrder = await TransferOrder.findById(id);
    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '转移联单不存在'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限审核'
      });
    }

    if (transferOrder.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法审核'
      });
    }

    transferOrder.status = 'approved';
    transferOrder.approvalRemark = remark;
    transferOrder.approvalTime = new Date();
    await transferOrder.save();

    res.json({
      success: true,
      data: transferOrder,
      message: '审核通过成功'
    });
  } catch (error) {
    next(error);
  }
};

const reject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const transferOrder = await TransferOrder.findById(id);
    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '转移联单不存在'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限审核'
      });
    }

    if (transferOrder.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法审核'
      });
    }

    transferOrder.status = 'rejected';
    transferOrder.approvalRemark = remark;
    transferOrder.approvalTime = new Date();
    await transferOrder.save();

    res.json({
      success: true,
      data: transferOrder,
      message: '审核拒绝成功'
    });
  } catch (error) {
    next(error);
  }
};

const complete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transferOrder = await TransferOrder.findById(id);
    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '转移联单不存在'
      });
    }

    if (req.user.role !== 'admin' &&
        transferOrder.inEnterpriseId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限完成转移'
      });
    }

    if (transferOrder.status !== 'approved' && transferOrder.status !== 'transferred') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法完成转移'
      });
    }

    transferOrder.status = 'received';
    transferOrder.completeTime = new Date();
    await transferOrder.save();

    res.json({
      success: true,
      data: transferOrder,
      message: '转移完成成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  update,
  submit,
  approve,
  reject,
  complete
};
