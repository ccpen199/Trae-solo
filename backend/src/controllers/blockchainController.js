const crypto = require('crypto');
const BlockchainRecord = require('../models/BlockchainRecord');

const getRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { recordType, relatedId } = req.query;

    const query = {};
    if (recordType) query.recordType = recordType;
    if (relatedId) query.relatedId = relatedId;

    const total = await BlockchainRecord.countDocuments(query);
    const records = await BlockchainRecord.find(query)
      .populate('operatorId', 'username companyName')
      .sort({ blockNumber: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: {
        list: records,
        total,
        page,
        pageSize
      },
      message: '获取存证记录列表成功'
    });
  } catch (error) {
    next(error);
  }
};

const getByHash = async (req, res, next) => {
  try {
    const { hash } = req.params;

    const record = await BlockchainRecord.findOne({ dataHash: hash })
      .populate('operatorId', 'username companyName');

    if (!record) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '存证记录不存在'
      });
    }

    res.json({
      success: true,
      data: record,
      message: '获取存证详情成功'
    });
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  try {
    const { hash, data } = req.body;

    const record = await BlockchainRecord.findOne({ dataHash: hash });
    if (!record) {
      return res.status(404).json({
        success: false,
        data: { verified: false },
        message: '未找到对应存证记录'
      });
    }

    let verified = false;
    if (data) {
      const dataStr = JSON.stringify(data);
      const computedHash = crypto.createHash('sha256').update(dataStr).digest('hex');
      verified = computedHash === hash;
    } else {
      verified = true;
    }

    res.json({
      success: true,
      data: {
        verified,
        record: record
      },
      message: verified ? '存证验证通过' : '存证验证失败'
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { recordType, relatedId, relatedNo, data } = req.body;

    if (!recordType || !relatedId || !data) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '记录类型、关联ID和数据为必填项'
      });
    }

    const dataStr = JSON.stringify(data);
    const dataHash = crypto.createHash('sha256').update(dataStr).digest('hex');

    const lastRecord = await BlockchainRecord.findOne().sort({ blockNumber: -1 });
    const blockNumber = lastRecord ? lastRecord.blockNumber + 1 : 1;
    const previousHash = lastRecord ? lastRecord.dataHash : '0'.repeat(64);
    const txHash = crypto.createHash('sha256').update(dataHash + Date.now().toString()).digest('hex');

    const record = new BlockchainRecord({
      recordType,
      relatedId,
      relatedNo,
      dataHash,
      blockNumber,
      txHash,
      operatorId: req.user?._id,
      operatorName: req.user?.companyName || req.user?.username,
      previousHash,
      metadata: data
    });

    await record.save();

    res.status(201).json({
      success: true,
      data: {
        record,
        dataHash
      },
      message: '创建存证成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecords,
  getByHash,
  verify,
  create
};
