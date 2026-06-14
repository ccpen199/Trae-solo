const Vehicle = require('../models/Vehicle');

const getList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { status, vehicleType, collectorId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;
    if (collectorId) {
      query.collectorId = collectorId;
    } else if (req.user.role !== 'admin') {
      query.collectorId = req.user._id;
    }

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .populate('collectorId', 'username companyName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: {
        list: vehicles,
        total,
        page,
        pageSize
      },
      message: '获取车辆列表成功'
    });
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id)
      .populate('collectorId', 'username companyName phone');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '车辆不存在'
      });
    }

    if (req.user.role !== 'admin' && vehicle.collectorId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限查看此车辆'
      });
    }

    res.json({
      success: true,
      data: vehicle,
      message: '获取车辆详情成功'
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      plateNo, vehicleType, loadCapacity,
      driverName, driverPhone, status,
      currentLocation, gpsLocation
    } = req.body;

    const existingVehicle = await Vehicle.findOne({ plateNo });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '该车牌号已存在'
      });
    }

    const vehicle = new Vehicle({
      plateNo,
      vehicleType,
      loadCapacity,
      driverName,
      driverPhone,
      collectorId: req.user._id,
      status: status || 'idle',
      currentLocation,
      gpsLocation
    });

    await vehicle.save();
    await vehicle.populate('collectorId', 'username companyName');

    res.status(201).json({
      success: true,
      data: vehicle,
      message: '添加车辆成功'
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '车辆不存在'
      });
    }

    if (vehicle.collectorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限修改此车辆'
      });
    }

    const {
      plateNo, vehicleType, loadCapacity,
      driverName, driverPhone, status,
      currentLocation, gpsLocation
    } = req.body;

    const updateData = {};
    if (plateNo !== undefined) updateData.plateNo = plateNo;
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
    if (loadCapacity !== undefined) updateData.loadCapacity = loadCapacity;
    if (driverName !== undefined) updateData.driverName = driverName;
    if (driverPhone !== undefined) updateData.driverPhone = driverPhone;
    if (status !== undefined) updateData.status = status;
    if (currentLocation !== undefined) updateData.currentLocation = currentLocation;
    if (gpsLocation !== undefined) updateData.gpsLocation = gpsLocation;

    const updated = await Vehicle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('collectorId', 'username companyName');

    res.json({
      success: true,
      data: updated,
      message: '更新车辆成功'
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '车辆不存在'
      });
    }

    if (vehicle.collectorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限删除此车辆'
      });
    }

    await Vehicle.findByIdAndDelete(id);

    res.json({
      success: true,
      data: null,
      message: '删除车辆成功'
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
  remove
};
