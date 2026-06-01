const Joi = require('joi');

const CONTAINER_TYPES = ['20GP', '40GP', '40HQ', '45HQ', '20RF', '40RF'];
const NODE_TYPES = ['PICKUP_EMPTY', 'IN_WAREHOUSE', 'IN_PORT', 'LOADED', 'DEPARTED', 'ARRIVED', 'CUSTOMS_CLEARED', 'PICKUP_LOADED', 'RETURN_EMPTY'];
const EXCEPTION_TYPES = ['DETENTION', 'INSPECTION', 'ROLLED', 'DELAYED', 'DAMAGED', 'MISSING_INFO'];
const RESPONSIBLE_PARTIES = ['CARRIER', 'FORWARDER', 'CUSTOMER', 'TRUCKING', 'WAREHOUSE', 'PORT', 'OTHER'];

const containerSchema = Joi.object({
  container_number: Joi.string()
    .pattern(/^[A-Z]{4}[0-9]{7}$/)
    .required()
    .messages({
      'string.pattern.base': '箱号格式不正确，应为4位大写字母+7位数字',
      'any.required': '箱号为必填项'
    }),
  booking_number: Joi.string().allow(''),
  bill_of_lading: Joi.string().allow(''),
  container_type: Joi.string().valid(...CONTAINER_TYPES).required(),
  seal_number: Joi.string().allow(''),
  shipper: Joi.string().allow(''),
  origin_port: Joi.string().allow(''),
  destination_port: Joi.string().allow('')
});

const nodeSchema = Joi.object({
  container_id: Joi.number().required(),
  node_type: Joi.string().valid(...NODE_TYPES).required(),
  node_time: Joi.date().required(),
  source: Joi.string().allow(''),
  remarks: Joi.string().allow('')
});

const exceptionSchema = Joi.object({
  container_id: Joi.number().required(),
  exception_type: Joi.string().valid(...EXCEPTION_TYPES).required(),
  description: Joi.string().allow(''),
  responsible_party: Joi.string().valid(...RESPONSIBLE_PARTIES).required(),
  action_taken: Joi.string().allow('')
});

module.exports = {
  containerSchema,
  nodeSchema,
  exceptionSchema,
  CONTAINER_TYPES,
  NODE_TYPES,
  EXCEPTION_TYPES,
  RESPONSIBLE_PARTIES
};
