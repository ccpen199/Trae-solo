const db = require('../database/init');

const getBrands = (req, res) => {
  try {
    const brands = db.prepare('SELECT * FROM car_brands ORDER BY sort_order, initial').all();

    const grouped = {};
    brands.forEach(brand => {
      const initial = brand.initial || '#';
      if (!grouped[initial]) {
        grouped[initial] = [];
      }
      grouped[initial].push(brand);
    });

    const result = Object.keys(grouped).sort().map(key => ({
      initial: key,
      brands: grouped[key]
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: result
    });
  } catch (err) {
    console.error('获取品牌列表失败:', err);
    return res.status(500).json({
      code: 500,
      message: '获取品牌列表失败',
      data: null
    });
  }
};

const getSeriesByBrand = (req, res) => {
  const { brandId } = req.params;

  if (!brandId) {
    return res.status(400).json({
      code: 400,
      message: '请选择品牌',
      data: null
    });
  }

  try {
    const series = db.prepare('SELECT * FROM car_series WHERE brand_id = ? ORDER BY name').all(brandId);

    res.json({
      code: 200,
      message: '获取成功',
      data: series
    });
  } catch (err) {
    console.error('获取车系列表失败:', err);
    return res.status(500).json({
      code: 500,
      message: '获取车系列表失败',
      data: null
    });
  }
};

const getSpecsBySeries = (req, res) => {
  const { seriesId } = req.params;

  if (!seriesId) {
    return res.status(400).json({
      code: 400,
      message: '请选择车系',
      data: null
    });
  }

  try {
    const specs = db.prepare(
      'SELECT id, displacement, year, engine_model FROM car_specs WHERE series_id = ? ORDER BY year DESC, displacement'
    ).all(seriesId);

    const grouped = {};
    specs.forEach(spec => {
      if (!grouped[spec.year]) {
        grouped[spec.year] = [];
      }
      grouped[spec.year].push(spec);
    });

    const result = Object.keys(grouped).sort().reverse().map(year => ({
      year,
      displacements: grouped[year]
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: result
    });
  } catch (err) {
    console.error('获取规格列表失败:', err);
    return res.status(500).json({
      code: 500,
      message: '获取规格列表失败',
      data: null
    });
  }
};

const getModelsBySpec = (req, res) => {
  const { specId } = req.params;

  if (!specId) {
    return res.status(400).json({
      code: 400,
      message: '请选择规格',
      data: null
    });
  }

  try {
    const models = db.prepare('SELECT * FROM car_models WHERE spec_id = ? ORDER BY name').all(specId);

    res.json({
      code: 200,
      message: '获取成功',
      data: models
    });
  } catch (err) {
    console.error('获取车型列表失败:', err);
    return res.status(500).json({
      code: 500,
      message: '获取车型列表失败',
      data: null
    });
  }
};

const getModelDetail = (req, res) => {
  const { modelId } = req.params;

  try {
    const model = db.prepare(`
      SELECT 
        cm.*,
        cs.displacement,
        cs.year,
        cs.engine_model,
        cs.series_id,
        cs2.name as series_name,
        cs2.type as series_type,
        cs2.price_range,
        cb.id as brand_id,
        cb.name as brand_name
      FROM car_models cm
      LEFT JOIN car_specs cs ON cm.spec_id = cs.id
      LEFT JOIN car_series cs2 ON cs.series_id = cs2.id
      LEFT JOIN car_brands cb ON cs2.brand_id = cb.id
      WHERE cm.id = ?
    `).get(modelId);

    if (!model) {
      return res.status(404).json({
        code: 404,
        message: '车型不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: model.id,
        name: model.name,
        fullName: model.full_name,
        transmission: model.transmission,
        fuelType: model.fuel_type,
        displacement: model.displacement,
        year: model.year,
        engineModel: model.engine_model,
        series: {
          id: model.series_id,
          name: model.series_name,
          type: model.series_type,
          priceRange: model.price_range
        },
        brand: {
          id: model.brand_id,
          name: model.brand_name
        }
      }
    });
  } catch (err) {
    console.error('获取车型详情失败:', err);
    return res.status(500).json({
      code: 500,
      message: '获取车型详情失败',
      data: null
    });
  }
};

const getUserCars = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null
    });
  }

  try {
    const cars = db.prepare(`
      SELECT 
        uc.*,
        cm.full_name as car_full_name,
        cm.name as car_name,
        cm.transmission,
        cm.fuel_type,
        cs.displacement,
        cs.year,
        cs2.name as series_name,
        cb.name as brand_name
      FROM user_cars uc
      LEFT JOIN car_models cm ON uc.car_model_id = cm.id
      LEFT JOIN car_specs cs ON cm.spec_id = cs.id
      LEFT JOIN car_series cs2 ON cs.series_id = cs2.id
      LEFT JOIN car_brands cb ON cs2.brand_id = cb.id
      WHERE uc.user_id = ?
      ORDER BY uc.is_default DESC, uc.created_at DESC
    `).all(req.user.id);

    const result = cars.map(car => ({
      id: car.id,
      carModelId: car.car_model_id,
      licensePlate: car.license_plate,
      mileage: car.mileage,
      isDefault: car.is_default === 1,
      carInfo: {
        fullName: car.car_full_name,
        name: car.car_name,
        transmission: car.transmission,
        fuelType: car.fuel_type,
        displacement: car.displacement,
        year: car.year,
        seriesName: car.series_name,
        brandName: car.brand_name
      }
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: result
    });
  } catch (err) {
    console.error('获取车辆列表失败:', err);
    return res.status(500).json({
      code: 500,
      message: '获取车辆列表失败',
      data: null
    });
  }
};

const addUserCar = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null
    });
  }

  const { carModelId, licensePlate, mileage, isDefault } = req.body;

  if (!carModelId) {
    return res.status(400).json({
      code: 400,
      message: '请选择车型',
      data: null
    });
  }

  try {
    if (isDefault) {
      db.prepare('UPDATE user_cars SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    const result = db.prepare(
      'INSERT INTO user_cars (user_id, car_model_id, license_plate, mileage, is_default) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, carModelId, licensePlate || '', mileage || 0, isDefault ? 1 : 0);

    res.json({
      code: 200,
      message: '添加成功',
      data: {
        id: result.lastInsertRowid
      }
    });
  } catch (err) {
    console.error('添加车辆失败:', err);
    return res.status(500).json({
      code: 500,
      message: '添加车辆失败',
      data: null
    });
  }
};

const updateUserCar = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null
    });
  }

  const { carId } = req.params;
  const { licensePlate, mileage, isDefault } = req.body;

  const fields = [];
  const values = [];

  if (licensePlate !== undefined) {
    fields.push('license_plate = ?');
    values.push(licensePlate);
  }

  if (mileage !== undefined) {
    fields.push('mileage = ?');
    values.push(mileage);
  }

  if (isDefault !== undefined) {
    if (isDefault) {
      db.prepare('UPDATE user_cars SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }
    fields.push('is_default = ?');
    values.push(isDefault ? 1 : 0);
  }

  if (fields.length === 0) {
    return res.status(400).json({
      code: 400,
      message: '没有需要更新的内容',
      data: null
    });
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(carId);
  values.push(req.user.id);

  try {
    db.prepare(`UPDATE user_cars SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);

    res.json({
      code: 200,
      message: '更新成功',
      data: null
    });
  } catch (err) {
    console.error('更新车辆失败:', err);
    return res.status(500).json({
      code: 500,
      message: '更新失败',
      data: null
    });
  }
};

const deleteUserCar = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null
    });
  }

  const { carId } = req.params;

  try {
    const result = db.prepare('DELETE FROM user_cars WHERE id = ? AND user_id = ?').run(carId, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({
        code: 404,
        message: '车辆不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (err) {
    console.error('删除车辆失败:', err);
    return res.status(500).json({
      code: 500,
      message: '删除失败',
      data: null
    });
  }
};

module.exports = {
  getBrands,
  getSeriesByBrand,
  getSpecsBySeries,
  getModelsBySpec,
  getModelDetail,
  getUserCars,
  addUserCar,
  updateUserCar,
  deleteUserCar
};
