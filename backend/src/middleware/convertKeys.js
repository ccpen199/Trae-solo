const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const convertKeys = (obj, converter) => {
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeys(item, converter));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[converter(key)] = convertKeys(obj[key], converter);
      }
    }
    return converted;
  }
  
  return obj;
};

const camelToSnakeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = convertKeys(req.body, camelToSnake);
  }
  
  if (req.query && typeof req.query === 'object') {
    req.query = convertKeys(req.query, camelToSnake);
  }
  
  next();
};

const snakeToCamelMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(body) {
    if (body && typeof body === 'object') {
      body = convertKeys(body, snakeToCamel);
    }
    return originalJson.call(this, body);
  };
  
  next();
};

module.exports = {
  camelToSnake,
  snakeToCamel,
  convertKeys,
  camelToSnakeMiddleware,
  snakeToCamelMiddleware
};
