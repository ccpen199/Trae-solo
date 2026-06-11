const sensitiveWords = [
  '傻瓜', '笨蛋', '白痴', '神经病', '疯子',
  '混蛋', '王八蛋', '畜生', '禽兽', '废物',
  '垃圾', '人渣', '败类', '无耻', '下流',
  '卑鄙', '龌龊', '肮脏', '恶心', '变态',
  '色情', '淫秽', '嫖娼', '卖淫', '赌博',
  '毒品', '毒药', '自杀', '杀人', '死亡',
  '邪恶', '恶魔', '魔鬼', '地狱', '阎王',
  '倒霉', '晦气', '灾祸', '灾难', '凶兆',
  '病', '痛', '伤', '残', '夭',
  '死', '亡', '丧', '葬', '墓'
];

const homophoneMap = {
  '杨伟': '阳痿',
  '史珍香': '屎真香',
  '杜子腾': '肚子疼',
  '刘产': '流产',
  '范剑': '犯贱',
  '姬从良': '妓从良',
  '范统': '饭桶',
  '夏建仁': '下贱人',
  '朱逸群': '猪一群',
  '秦寿生': '禽兽生',
  '庞光大': '膀胱大',
  '段明': '短命',
  '王柏淡': '王八蛋',
  '胡丽丽': '狐狸精',
  '马统盖': '马桶盖',
  '费彦': '肺炎',
  '沈景兵': '神经病',
  '毕云涛': '避孕套',
  '吴安全': '不安全',
  '矫厚根': '脚后根'
};

const badWordComponents = {
  '病': ['病', '疒', '疾', '痛', '疼', '疮', '疤', '症', '疲', '痒'],
  '死': ['死', '亡', '丧', '葬', '墓', '坟', '碑', '柩', '殓', '悼'],
  '凶': ['凶', '恶', '邪', '魔', '鬼', '妖', '怪', '孽', '祟', '煞'],
  '穷': ['穷', '贫', '困', '厄', '苦', '难', '灾', '祸', '殃', '害']
};

const tongyongGuiFan = new Set([
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '百', '千', '万', '亿', '兆',
  '人', '口', '手', '足', '目', '耳', '鼻', '舌', '身', '心',
  '头', '发', '面', '眼', '嘴', '牙', '齿', '颈', '胸', '背',
  '天', '地', '日', '月', '星', '风', '云', '雨', '雪', '雷',
  '山', '水', '火', '木', '土', '金',
  '大', '小', '多', '少', '高', '低', '长', '短', '远', '近',
  '上', '下', '左', '右', '前', '后', '里', '外', '中', '内',
  '东', '西', '南', '北',
  '春', '夏', '秋', '冬',
  '红', '黄', '蓝', '绿', '白', '黑', '灰', '紫', '橙', '青',
  '伟', '芳', '娜', '俊', '婷', '鹏', '华', '明', '静', '磊',
  '洋', '勇', '艳', '杰', '娟', '涛', '敏', '军', '丽', '强',
  '平', '刚', '桂', '英', '慧', '亮', '红', '宇', '欣', '晨',
  '睿', '思', '涵', '博', '嘉', '子', '轩', '雨', '萱', '辰',
  '安', '若', '彤', '承', '谦', '恒', '悦', '瑞', '航', '瑶',
  '瑾', '婉', '诗', '雅', '逸', '铭', '泽', '浩', '昊', '然',
  '汐', '玥', '怡', '沐', '可', '昕', '暄', '翊', '言', '诺',
  '钰', '锦', '雯', '霖', '柏', '柯', '柠', '梵', '森', '焱',
  '煊', '煜', '熙', '烨', '垚', '垠', '城', '培', '钦', '钧',
  '锋', '鑫', '淼', '渊', '淳', '瀚', '杉', '棋', '媛', '嫣',
  '娴'
]);

function filterSensitiveWord(text) {
  for (const word of sensitiveWords) {
    if (text.includes(word)) {
      return {
        sensitive: true,
        word: word,
        reason: '包含敏感词汇'
      };
    }
  }
  
  return {
    sensitive: false,
    word: null,
    reason: '通过敏感词检测'
  };
}

function checkHomophone(name) {
  if (homophoneMap[name]) {
    return {
      hasBadHomophone: true,
      homophone: homophoneMap[name],
      reason: `谐音不雅：${homophoneMap[name]}`
    };
  }
  
  return {
    hasBadHomophone: false,
    homophone: null,
    reason: '谐音检测通过'
  };
}

function checkTongyongGuifan(char) {
  return tongyongGuiFan.has(char);
}

function validateName(name) {
  const chars = name.split('');
  const issues = [];
  
  const sensitiveResult = filterSensitiveWord(name);
  if (sensitiveResult.sensitive) {
    issues.push({
      type: 'sensitive',
      level: 'error',
      message: `包含敏感词汇：${sensitiveResult.word}`
    });
  }
  
  const homophoneResult = checkHomophone(name);
  if (homophoneResult.hasBadHomophone) {
    issues.push({
      type: 'homophone',
      level: 'warning',
      message: homophoneResult.reason
    });
  }
  
  chars.forEach((char, index) => {
    if (!checkTongyongGuifan(char)) {
      issues.push({
        type: 'guifan',
        level: 'warning',
        message: `"${char}" 不在《通用规范汉字表》常用字范围内`,
        char: char,
        position: index
      });
    }
  });
  
  return {
    valid: issues.filter(i => i.level === 'error').length === 0,
    issues,
    warnings: issues.filter(i => i.level === 'warning'),
    errors: issues.filter(i => i.level === 'error')
  };
}

function checkBadComponents(name) {
  const issues = [];
  
  for (const [category, components] of Object.entries(badWordComponents)) {
    for (const comp of components) {
      if (name.includes(comp)) {
        issues.push({
          type: 'component',
          category,
          component: comp,
          level: 'warning',
          message: `名字包含"${comp}"，属于${category}类字，建议斟酌`
        });
      }
    }
  }
  
  return {
    hasIssue: issues.length > 0,
    issues
  };
}

module.exports = {
  sensitiveWords,
  homophoneMap,
  badWordComponents,
  tongyongGuiFan,
  filterSensitiveWord,
  checkHomophone,
  checkTongyongGuifan,
  validateName,
  checkBadComponents
};
