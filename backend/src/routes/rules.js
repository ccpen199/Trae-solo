const express = require('express');
const router = express.Router();
const RuleEngine = require('../engines/rule-engine');

const ruleEngine = new RuleEngine();

router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const rules = ruleEngine.getAllRules(status);
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:ruleId', (req, res) => {
  try {
    const { ruleId } = req.params;
    const rule = ruleEngine.getRuleById(ruleId);
    if (!rule) {
      return res.status(404).json({ success: false, error: '规则不存在' });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description, topology, weightConfig } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: '规则名称不能为空' });
    }
    
    const rule = ruleEngine.createRule({
      name,
      description,
      topology,
      weightConfig
    }, req.headers['x-operator'] || 'web');
    
    res.json({ success: true, data: rule, message: '规则创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:ruleId/topology', (req, res) => {
  try {
    const { ruleId } = req.params;
    const { topology } = req.body;
    
    if (!topology) {
      return res.status(400).json({ success: false, error: '拓扑结构不能为空' });
    }
    
    const updated = ruleEngine.updateRuleTopology(ruleId, topology, req.headers['x-operator'] || 'web');
    
    if (!updated) {
      return res.status(404).json({ success: false, error: '规则不存在' });
    }
    
    res.json({ success: true, message: '拓扑结构已更新' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:ruleId/push-to-test', (req, res) => {
  try {
    const { ruleId } = req.params;
    const pushed = ruleEngine.pushToTest(ruleId, req.headers['x-operator'] || 'web');
    
    if (!pushed) {
      return res.status(400).json({ 
        success: false, 
        error: '规则状态不允许推送到测试，当前必须是草稿或测试中状态' 
      });
    }
    
    res.json({ success: true, message: '规则已推送到测试环境' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:ruleId/activate', (req, res) => {
  try {
    const { ruleId } = req.params;
    const activated = ruleEngine.activateRule(ruleId, req.headers['x-operator'] || 'web');
    
    if (!activated) {
      return res.status(400).json({ 
        success: false, 
        error: '规则必须在测试环境中才能激活' 
      });
    }
    
    res.json({ success: true, message: '规则已激活上线' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
