const { Device, Community, FunnelEvent } = require('../models');
const deviceProtocol = require('../protocols');

exports.getDevices = async (req, res, next) => {
  try {
    const { 
      deviceType, status, communityId, gridId, workingStatus, page = 1, pageSize = 20 
    } = req.query;

    const filter = {};
    if (deviceType) filter.deviceType = deviceType;
    if (status) filter.status = status;
    if (workingStatus) filter.workingStatus = workingStatus;
    
    if (communityId) filter.communityId = communityId;
    if (gridId) filter.gridId = gridId;

    if (req.user.role === 'resident' && req.user.communityId) {
      filter.communityId = req.user.communityId;
    }

    const devices = await Device.find(filter)
      .populate('communityId', 'name address')
      .populate('gridId', 'name')
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });

    const total = await Device.countDocuments(filter);

    if (req.user.role === 'resident') {
      await FunnelEvent.create({
        userId: req.user._id,
        event: 'browse_devices',
        deviceType,
        communityId: req.user.communityId,
        source: req.headers['source'] || 'web',
      });
    }

    res.json({
      success: true,
      data: {
        list: devices,
        pagination: { page: Number(page), pageSize: Number(pageSize), total },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeviceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const device = await Device.findById(id)
      .populate('communityId', 'name address')
      .populate('gridId', 'name');

    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }

    if (req.user.role === 'resident') {
      await FunnelEvent.create({
        userId: req.user._id,
        event: 'view_device_detail',
        deviceId: device._id,
        deviceType: device.deviceType,
        communityId: device.communityId,
        source: req.headers['source'] || 'web',
      });
    }

    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeviceByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const device = await Device.findOne({ deviceCode: code })
      .populate('communityId', 'name address')
      .populate('gridId', 'name');

    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }

    if (req.user.role === 'resident') {
      await FunnelEvent.create({
        userId: req.user._id,
        event: 'view_device_detail',
        deviceId: device._id,
        deviceType: device.deviceType,
        communityId: device.communityId,
        source: 'scan',
      });
    }

    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

exports.createDevice = async (req, res, next) => {
  try {
    const {
      deviceCode, deviceType, name, location, communityId, gridId,
      protocol, protocolVersion, capabilities, settings, manufacturer, model
    } = req.body;

    const existing = await Device.findOne({ deviceCode });
    if (existing) {
      return res.status(400).json({ message: '设备编号已存在' });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      community.deviceCount = (community.deviceCount || 0) + 1;
      await community.save();
    }

    const device = await Device.create({
      deviceCode,
      deviceType,
      name,
      location,
      communityId,
      gridId,
      protocol,
      protocolVersion,
      capabilities,
      settings,
      manufacturer,
      model,
      installDate: new Date(),
      qrCode: `https://iot.example.com/scan/${deviceCode}`,
      lastHeartbeat: new Date(),
    });

    res.status(201).json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const device = await Device.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }

    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDeviceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }

    if (status === 'retired') {
      const community = await Community.findById(device.communityId);
      if (community) {
        community.deviceCount = Math.max(0, (community.deviceCount || 0) - 1);
        await community.save();
      }
    }

    device.status = status;
    await device.save();

    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeviceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deviceProtocol.getDeviceStatus(id);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeviceHeatmap = async (req, res, next) => {
  try {
    const { communityId, deviceType } = req.query;

    const filter = { status: 'online' };
    if (communityId) filter.communityId = communityId;
    if (deviceType) filter.deviceType = deviceType;

    const devices = await Device.find(filter, 'deviceCode deviceType name location totalUsage totalDuration workingStatus');

    const heatmapData = devices.map(device => ({
      id: device._id,
      deviceCode: device.deviceCode,
      deviceType: device.deviceType,
      name: device.name,
      lat: device.location?.lat || 0,
      lng: device.location?.lng || 0,
      intensity: Math.min(100, (device.totalUsage || 0) / 10),
      workingStatus: device.workingStatus,
      totalUsage: device.totalUsage,
      totalDuration: device.totalDuration,
    }));

    res.json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    next(error);
  }
};

exports.syncOfflineCommands = async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await deviceProtocol.syncOfflineCommands(id);
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
