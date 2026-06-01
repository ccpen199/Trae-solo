const db = require('../models/database');

const maskPatterns = {
  phone: /1[3-9]\d{9}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  idCard: /\d{17}[\dXx]/g,
  bankCard: /\d{16,19}/g,
  name: /([\u4e00-\u9fa5]{2,4})/g
};

const getActiveRulesByAppId = async (appId) => {
  return await db.all(
    'SELECT * FROM mask_rules WHERE app_id = ? AND is_active = 1 ORDER BY version DESC',
    [appId]
  );
};

const maskContent = async (appId, content) => {
  const rules = await getActiveRulesByAppId(appId);
  let maskedContent = content;
  let processedCount = 0;
  const placeholders = [];
  let placeholderIndex = 0;

  for (const rule of rules) {
    let regex;
    if (maskPatterns[rule.rule_type]) {
      regex = maskPatterns[rule.rule_type];
    } else {
      try {
        regex = new RegExp(rule.pattern, 'g');
      } catch (e) {
        continue;
      }
    }
    
    const matches = [];
    let match;
    const tempRegex = new RegExp(regex.source, regex.flags);
    while ((match = tempRegex.exec(maskedContent)) !== null) {
      if (match[0].includes('__MASK_')) continue;
      matches.push(match[0]);
    }
    
    processedCount += matches.length;
    
    matches.forEach(m => {
      const placeholder = `__MASK_${placeholderIndex}__`;
      placeholders.push({ placeholder, replacement: rule.replacement });
      maskedContent = maskedContent.replace(m, placeholder);
      placeholderIndex++;
    });
  }

  placeholders.forEach(({ placeholder, replacement }) => {
    maskedContent = maskedContent.replace(placeholder, replacement);
  });

  return { maskedContent, processedCount, rulesApplied: rules.length };
};

const validateRuleVersion = async (appId, expectedVersion) => {
  const maxVersion = await db.get(
    'SELECT MAX(version) as max_version FROM mask_rules WHERE app_id = ?',
    [appId]
  );
  const currentMax = maxVersion.max_version || 0;
  return parseInt(expectedVersion) <= currentMax;
};

module.exports = {
  maskContent,
  getActiveRulesByAppId,
  validateRuleVersion
};
