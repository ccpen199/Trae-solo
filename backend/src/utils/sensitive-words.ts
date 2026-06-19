const SENSITIVE_WORDS: string[] = [
  '法轮功', '法轮大法', '李洪志', '六四', '天安门事件', '天安门屠杀',
  '台独', '藏独', '疆独', '东突', '恐怖分子', '恐怖袭击',
  '爆炸', '炸弹', '枪支', '毒品', '海洛因', '冰毒',
  '反动', '推翻政府', '颠覆政权', '分裂国家',
  '赌博', '赌场', '博彩', '六合彩', '时时彩',
  '色情', '裸体', '淫秽', '卖淫', '嫖娼',
  '代开发票', '假发票', '洗钱', '非法集资',
  '枪支买卖', '贩卖人口', '人体器官买卖',
  '传销', '庞氏骗局', '金融诈骗',
  '自杀', '自残', '跳楼', '割腕',
  '习近平', '彭丽媛', '温家宝', '胡锦涛', '江泽民',
  '共产党', '中共', '党中央',
  ' VPN', '翻墙', '科学上网',
  '假钞', '伪造货币', '信用卡套现',
];

let sensitiveRegex: RegExp | null = null;

function getSensitiveRegex(): RegExp {
  if (!sensitiveRegex) {
    const escaped = SENSITIVE_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    sensitiveRegex = new RegExp(escaped.join('|'), 'gi');
  }
  return sensitiveRegex;
}

export function containsSensitiveWords(text: string): boolean {
  return getSensitiveRegex().test(text);
}

export function filterSensitiveWords(text: string): { filtered: string; hasFiltered: boolean; matchedWords: string[] } {
  const regex = getSensitiveRegex();
  const matchedWords: string[] = [];
  let match: RegExpExecArray | null;

  const tempRegex = new RegExp(regex.source, 'gi');
  while ((match = tempRegex.exec(text)) !== null) {
    if (!matchedWords.includes(match[0])) {
      matchedWords.push(match[0]);
    }
  }

  const filtered = text.replace(regex, (matched) => '*'.repeat(matched.length));
  return { filtered, hasFiltered: matchedWords.length > 0, matchedWords };
}
