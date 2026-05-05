const { validationResult } = require('express-validator');
const { error } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json(error(firstError.msg, 400));
  }
  
  next();
};

module.exports = validate;
