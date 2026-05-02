const express = require('express');
const router = express.Router();
const VariableFactory = require('../engines/variable-factory');

const variableFactory = new VariableFactory();

router.get('/', (req, res) => {
  try {
    const variables = variableFactory.getAllVariables();
    res.json({ success: true, data: variables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:code', (req, res) => {
  try {
    const { code } = req.params;
    const variable = variableFactory.getVariableByCode(code);
    if (!variable) {
      return res.status(404).json({ success: false, error: '变量不存在' });
    }
    res.json({ success: true, data: variable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/resolve', async (req, res) => {
  try {
    const { context, variableCodes } = req.body;
    if (!variableCodes || !Array.isArray(variableCodes)) {
      return res.status(400).json({ success: false, error: 'variableCodes 必须是数组' });
    }
    
    const result = await variableFactory.resolveVariables(context || {}, variableCodes);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:variableId/weight', (req, res) => {
  try {
    const { variableId } = req.params;
    const { weight } = req.body;
    
    if (typeof weight !== 'number' || weight < 0) {
      return res.status(400).json({ success: false, error: '权重必须是大于等于0的数字' });
    }
    
    const updated = variableFactory.updateVariableWeight(variableId, weight);
    if (!updated) {
      return res.status(404).json({ success: false, error: '变量不存在' });
    }
    
    res.json({ success: true, message: '权重已更新' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
