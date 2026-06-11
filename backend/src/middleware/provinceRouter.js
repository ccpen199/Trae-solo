const db = require('../config/database');

const routeToProvince = async (req, res, next) => {
  const userProvince = req.user?.province || req.query.province || req.body?.province;
  
  if (!userProvince) {
    return next();
  }

  const province = await db.getAsync('SELECT * FROM provinces WHERE name = ? AND enabled = 1', [userProvince]);
  
  if (province && province.api_endpoint) {
    req.provinceContext = {
      code: province.code,
      name: province.name,
      apiEndpoint: province.api_endpoint,
    };
  }
  
  req.province = userProvince;
  next();
};

module.exports = { routeToProvince };
