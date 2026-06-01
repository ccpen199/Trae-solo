const stringSimilarity = require('string-similarity');
const { diffLines } = require('diff');

const preprocessText = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
    .trim();
};

const calculateSimilarity = (text1, text2) => {
  const processed1 = preprocessText(text1);
  const processed2 = preprocessText(text2);
  
  if (processed1.length === 0 || processed2.length === 0) {
    return 0;
  }
  
  return stringSimilarity.compareTwoStrings(processed1, processed2) * 100;
};

const findSimilarSegments = (text1, text2, threshold = 0.7) => {
  const segments1 = text1.split(/[\n。！？；.!?;]/).filter(s => s.trim().length > 10);
  const segments2 = text2.split(/[\n。！？；.!?;]/).filter(s => s.trim().length > 10);
  
  const similarSegments = [];
  
  for (let i = 0; i < segments1.length; i++) {
    for (let j = 0; j < segments2.length; j++) {
      const similarity = stringSimilarity.compareTwoStrings(segments1[i], segments2[j]);
      if (similarity >= threshold) {
        similarSegments.push({
          index1: i,
          index2: j,
          text1: segments1[i].trim(),
          text2: segments2[j].trim(),
          similarity: similarity * 100
        });
      }
    }
  }
  
  return similarSegments;
};

const checkCodeSimilarity = (code1, code2) => {
  const cleanCode1 = code1
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const cleanCode2 = code2
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const similarity = stringSimilarity.compareTwoStrings(cleanCode1, cleanCode2) * 100;
  
  const diff = diffLines(code1, code2);
  const diffSegments = diff.filter(part => part.added || part.removed).map(part => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'same',
    value: part.value.substring(0, 500)
  }));
  
  return {
    similarity,
    diffSegments
  };
};

const detectMatchedRules = (text1, text2) => {
  const rules = [];
  
  const tokenPairs = [
    [/\b(def|function)\s+\w+\s*\(/g, '函数定义'],
    [/\b(class)\s+\w+/g, '类定义'],
    [/\b(import|from)\s+[\w.]+/g, '导入语句'],
    [/\b(var|let|const)\s+\w+/g, '变量声明']
  ];
  
  tokenPairs.forEach(([regex, ruleName]) => {
    const matches1 = (text1.match(regex) || []).sort().join('|');
    const matches2 = (text2.match(regex) || []).sort().join('|');
    
    if (matches1 && matches2 && matches1 === matches2) {
      rules.push(ruleName);
    }
  });
  
  return rules;
};

module.exports = {
  calculateSimilarity,
  findSimilarSegments,
  checkCodeSimilarity,
  detectMatchedRules,
  preprocessText
};
