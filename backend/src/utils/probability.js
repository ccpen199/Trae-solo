// 概率计算工具类
// 支持按权重随机选择奖品

// 按概率权重随机选择
// prizes: Array<{ id, probability, ... }>
// probability 是 0-1 之间的小数
const weightedRandom = (prizes) => {
  if (!prizes || prizes.length === 0) {
    return null;
  }

  // 计算总权重
  const totalWeight = prizes.reduce((sum, prize) => {
    const prob = parseFloat(prize.probability) || 0;
    return sum + prob;
  }, 0);

  // 如果总权重为0，随机选择
  if (totalWeight <= 0) {
    const randomIndex = Math.floor(Math.random() * prizes.length);
    return prizes[randomIndex];
  }

  // 生成随机数
  let random = Math.random() * totalWeight;

  // 按权重选择
  for (const prize of prizes) {
    const prob = parseFloat(prize.probability) || 0;
    random -= prob;
    if (random <= 0) {
      return prize;
    }
  }

  // 默认返回最后一个
  return prizes[prizes.length - 1];
};

// 验证概率配置是否合法
const validateProbability = (prizes) => {
  if (!prizes || prizes.length === 0) {
    return { valid: false, message: '奖品列表不能为空' };
  }

  const totalProbability = prizes.reduce((sum, prize) => {
    const prob = parseFloat(prize.probability) || 0;
    if (prob < 0 || prob > 1) {
      throw new Error(`奖品 ${prize.name} 的概率值 ${prob} 不合法，必须在 0-1 之间`);
    }
    return sum + prob;
  }, 0);

  // 允许小范围误差（浮点数精度问题）
  const diff = Math.abs(totalProbability - 1);
  if (diff > 0.01) {
    return {
      valid: false,
      message: `概率总和 ${totalProbability.toFixed(4)} 不合法，应该接近 1`,
    };
  }

  return { valid: true, total: totalProbability };
};

// 生成参与编号
const generateParticipationNo = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `P${timestamp}${random}`.toUpperCase();
};

module.exports = {
  weightedRandom,
  validateProbability,
  generateParticipationNo,
};
