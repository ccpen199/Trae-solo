import Joi from 'joi';

export const validateCompetitor = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().max(100),
    category: Joi.string().required(),
    official_website: Joi.string().uri().allow(''),
    app_store_url: Joi.string().uri().allow(''),
    status: Joi.string().valid('active', 'inactive', 'archived').default('active'),
    created_by: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const validateCrawlTask = (req, res, next) => {
  const schema = Joi.object({
    competitor_id: Joi.number().integer().allow(null),
    task_type: Joi.string().valid('website', 'app_store', 'price', 'review', 'feature').required(),
    target_url: Joi.string().uri().required(),
    created_by: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const validatePriceRecord = (req, res, next) => {
  const schema = Joi.object({
    competitor_id: Joi.number().integer().required(),
    plan_name: Joi.string().required().max(100),
    price: Joi.number().min(0).required(),
    currency: Joi.string().default('CNY'),
    price_unit: Joi.string().allow(''),
    source_url: Joi.string().uri().allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const validateConfigRule = (req, res, next) => {
  const schema = Joi.object({
    rule_type: Joi.string().required(),
    rule_name: Joi.string().required(),
    rule_value: Joi.string().allow(''),
    owner: Joi.string().required(),
    permission: Joi.string().valid('business_owner', 'model_operator', 'auditor', 'frontline_user').required(),
    valid_from: Joi.date().allow(null),
    valid_to: Joi.date().allow(null),
    is_enabled: Joi.number().integer().valid(0, 1).default(1)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const validateWorkflow = (req, res, next) => {
  const schema = Joi.object({
    action: Joi.string().valid('create', 'submit', 'execute', 'review', 'reject', 'close').required(),
    operator: Joi.string().required(),
    reason: Joi.string().allow(''),
    result: Joi.string().valid('auto_block', 'manual_review', 'observe', 'closed').allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
