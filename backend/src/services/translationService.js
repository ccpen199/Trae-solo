const dictionary = {
  'hello': { translation: '你好', phonetic: '/həˈləʊ/', type: 'interj.' },
  'world': { translation: '世界', phonetic: '/wɜːrld/', type: 'n.' },
  'love': { translation: '爱', phonetic: '/lʌv/', type: 'n./v.' },
  'book': { translation: '书', phonetic: '/bʊk/', type: 'n.' },
  'computer': { translation: '电脑', phonetic: '/kəmˈpjuːtər/', type: 'n.' },
  'beautiful': { translation: '美丽的', phonetic: '/ˈbjuːtɪfl/', type: 'adj.' },
  'important': { translation: '重要的', phonetic: '/ɪmˈpɔːrtnt/', type: 'adj.' },
  'learn': { translation: '学习', phonetic: '/lɜːrn/', type: 'v.' },
  'english': { translation: '英语', phonetic: '/ˈɪŋɡlɪʃ/', type: 'n.' },
  'china': { translation: '中国', phonetic: '/ˈtʃaɪnə/', type: 'n.' },
  '今天': { translation: 'today', phonetic: '/təˈdeɪ/', type: 'n./adv.' },
  '你好': { translation: 'hello', phonetic: '/həˈləʊ/', type: 'interj.' },
  '世界': { translation: 'world', phonetic: '/wɜːrld/', type: 'n.' },
  '学习': { translation: 'learn/study', phonetic: '/lɜːrn//ˈstʌdi/', type: 'v.' },
  '英语': { translation: 'English', phonetic: '/ˈɪŋɡlɪʃ/', type: 'n.' }
};

function detectLanguage(text) {
  const chinesePattern = /[\u4e00-\u9fa5]/;
  return chinesePattern.test(text) ? 'zh' : 'en';
}

function translateWord(word) {
  const lowerWord = word.toLowerCase().trim();
  if (dictionary[lowerWord]) {
    return dictionary[lowerWord];
  }
  return null;
}

function translateText(text) {
  const sourceLang = detectLanguage(text);
  const words = text.split(/\s+/);
  
  if (sourceLang === 'en') {
    const translatedWords = words.map(word => {
      const result = translateWord(word);
      return result ? result.translation : word;
    });
    return {
      source_text: text,
      target_text: translatedWords.join(''),
      source_lang: 'en',
      target_lang: 'zh'
    };
  } else {
    return {
      source_text: text,
      target_text: '(中文长句翻译功能模拟) ' + text,
      source_lang: 'zh',
      target_lang: 'en'
    };
  }
}

module.exports = { detectLanguage, translateWord, translateText, dictionary };
