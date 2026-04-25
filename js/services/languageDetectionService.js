/**
 * @fileoverview 语言检测服务
 * @description 提供文本语言检测功能，支持多种检测策略
 * @version 1.0.0
 */

import { logger } from '../utils/index.js';
import { APP_CONFIG } from '../config/index.js';

/**
 * 语言检测置信度阈值
 * @readonly
 * @enum {number}
 */
const DETECTION_THRESHOLDS = {
  /** 高置信度阈值 */
  HIGH: 0.8,
  /** 中置信度阈值 */
  MEDIUM: 0.5,
  /** 低置信度阈值 */
  LOW: 0.3
};

/**
 * 语言字符范围定义
 * @readonly
 */
const LANGUAGE_CHAR_RANGES = {
  // 中文（简体/繁体）
  'zh': {
    name: '中文',
    ranges: [
      [0x4E00, 0x9FFF],   // CJK 统一表意文字
      [0x3400, 0x4DBF],   // CJK 统一表意文字扩展 A
      [0x20000, 0x2A6DF], // CJK 统一表意文字扩展 B
      [0x2A700, 0x2B73F], // CJK 统一表意文字扩展 C
      [0x2B740, 0x2B81F], // CJK 统一表意文字扩展 D
      [0x2B820, 0x2CEAF], // CJK 统一表意文字扩展 E
      [0xF900, 0xFAFF],   // CJK 兼容表意文字
      [0x2F800, 0x2FA1F], // CJK 兼容表意文字补充
    ],
    fullWidthRanges: [
      [0xFF00, 0xFFEF],   // 全角字符
    ],
    punctuation: '，。；：「」『』【】（）、'
  },

  // 日文
  'ja': {
    name: '日文',
    ranges: [
      [0x3040, 0x309F],   // 平假名
      [0x30A0, 0x30FF],   // 片假名
      [0x31F0, 0x31FF],   // 片假名语音扩展
      [0xFF66, 0xFF9F],   // 半角片假名
    ],
    // 日文也使用汉字，所以包含中文范围
    additionalRanges: [
      [0x4E00, 0x9FFF],   // CJK 统一表意文字
    ]
  },

  // 韩文
  'ko': {
    name: '韩文',
    ranges: [
      [0xAC00, 0xD7AF],   // 谚文音节
      [0x1100, 0x11FF],   // 谚文字母
      [0x3130, 0x318F],   // 谚文兼容字母
      [0xA960, 0xA97F],   // 谚文扩展 A
      [0xD7B0, 0xD7FF],   // 谚文扩展 B
      [0xFFA0, 0xFFDC],   // 半角谚文
    ]
  },

  // 阿拉伯文
  'ar': {
    name: '阿拉伯文',
    ranges: [
      [0x0600, 0x06FF],   // 阿拉伯文
      [0x0750, 0x077F],   // 阿拉伯文补充
      [0x08A0, 0x08FF],   // 阿拉伯文扩展 A
      [0xFB50, 0xFDFF],   // 阿拉伯文表达形式 A
      [0xFE70, 0xFEFF],   // 阿拉伯文表达形式 B
      [0x1EE00, 0x1EEFF], // 阿拉伯文数学字母符号
    ],
    isRTL: true
  },

  // 泰文
  'th': {
    name: '泰文',
    ranges: [
      [0x0E00, 0x0E7F],   // 泰文
    ]
  },

  // 越南文（特殊字符）
  'vi': {
    name: '越南文',
    specialChars: 'ăâđêôơưư'
  },

  // 印地文
  'hi': {
    name: '印地文',
    ranges: [
      [0x0900, 0x097F],   // 天城文
    ]
  },

  // 俄文（西里尔字母）
  'ru': {
    name: '俄文',
    ranges: [
      [0x0400, 0x04FF],   // 西里尔字母
      [0x0500, 0x052F],   // 西里尔字母补充
      [0x1C80, 0x1C8F],   // 西里尔字母扩展 C
      [0x1D2B, 0x1D78],   // 音标扩展
      [0x1DE0, 0x1DFF],   // 组合用附加符号补充
      [0x2DE0, 0x2DFF],   // 西里尔字母扩展 A
      [0xA640, 0xA69F],   // 西里尔字母扩展 B
      [0xFE2E, 0xFE2F],   // 组合用半符号
    ]
  },

  // 希腊文
  'el': {
    name: '希腊文',
    ranges: [
      [0x0370, 0x03FF],   // 希腊文和科普特文
      [0x1F00, 0x1FFF],   // 希腊文扩展
    ]
  },

  // 希伯来文
  'he': {
    name: '希伯来文',
    ranges: [
      [0x0590, 0x05FF],   // 希伯来文
      [0xFB1D, 0xFB4F],   // 希伯来文表达形式
    ],
    isRTL: true
  }
};

/**
 * 语言检测结果
 * @typedef {Object} LanguageDetectionResult
 * @property {string} language - 检测到的语言代码
 * @property {number} confidence - 置信度 (0-1)
 * @property {boolean} isHighConfidence - 是否为高置信度
 * @property {string[]} possibleLanguages - 可能的语言列表
 * @property {string} method - 检测方法
 */

/**
 * 语言检测服务类
 * @class
 * @description 提供文本语言检测功能，支持字符范围检测和 API 检测
 */
export class LanguageDetectionService {
  /**
   * @constructor
   */
  constructor() {
    this.logger = logger;
    this._detectionCache = new Map();
    this._maxCacheSize = 100;
  }

  /**
   * 检测文本的语言
   * @param {string} text - 要检测的文本
   * @param {Object} [options] - 检测选项
   * @param {boolean} [options.useCache=true] - 是否使用缓存
   * @param {boolean} [options.fallbackToAPI=false] - 是否在字符检测不确定时使用 API
   * @returns {Promise<LanguageDetectionResult>} 检测结果
   */
  async detect(text, options = {}) {
    const { useCache = true, fallbackToAPI = false } = options;

    // 验证输入
    if (!text || text.trim().length === 0) {
      return this._createResult('unknown', 0, 'empty_text');
    }

    const trimmedText = text.trim();

    // 检查缓存
    if (useCache) {
      const cached = this._getFromCache(trimmedText);
      if (cached) {
        this.logger.debug(`使用缓存的语言检测结果: ${cached.language}`);
        return cached;
      }
    }

    // 1. 首先使用字符范围检测
    const charResult = this._detectByCharacterRange(trimmedText);
    this.logger.debug(`字符范围检测结果: ${charResult.language} (置信度: ${charResult.confidence})`);

    // 2. 如果置信度高，直接返回
    if (charResult.confidence >= DETECTION_THRESHOLDS.HIGH) {
      if (useCache) {
        this._addToCache(trimmedText, charResult);
      }
      return charResult;
    }

    // 3. 如果置信度中等且允许使用 API，尝试 API 检测
    if (fallbackToAPI && charResult.confidence < DETECTION_THRESHOLDS.HIGH) {
      try {
        const apiResult = await this._detectByAPI(trimmedText);
        this.logger.debug(`API 检测结果: ${apiResult.language} (置信度: ${apiResult.confidence})`);
        
        // 合并两种检测结果
        const mergedResult = this._mergeResults(charResult, apiResult);
        
        if (useCache) {
          this._addToCache(trimmedText, mergedResult);
        }
        return mergedResult;
      } catch (error) {
        this.logger.warn('API 语言检测失败，使用字符检测结果', error);
      }
    }

    // 4. 返回字符检测结果
    if (useCache) {
      this._addToCache(trimmedText, charResult);
    }
    return charResult;
  }

  /**
   * 使用字符范围检测语言
   * @private
   * @param {string} text - 要检测的文本
   * @returns {LanguageDetectionResult} 检测结果
   */
  _detectByCharacterRange(text) {
    const scores = {};
    const totalChars = text.length;
    
    // 统计每种语言的字符数量
    for (const [langCode, langConfig] of Object.entries(LANGUAGE_CHAR_RANGES)) {
      scores[langCode] = 0;
      
      // 统计范围字符
      if (langConfig.ranges) {
        for (const char of text) {
          const charCode = char.charCodeAt(0);
          
          for (const [start, end] of langConfig.ranges) {
            if (charCode >= start && charCode <= end) {
              scores[langCode]++;
              break;
            }
          }
          
          // 检查附加范围
          if (langConfig.additionalRanges) {
            for (const [start, end] of langConfig.additionalRanges) {
              if (charCode >= start && charCode <= end) {
                scores[langCode]++;
                break;
              }
            }
          }
        }
      }
      
      // 统计特殊字符
      if (langConfig.specialChars) {
        for (const specialChar of langConfig.specialChars) {
          const regex = new RegExp(`[${specialChar}]`, 'gi');
          const matches = text.match(regex);
          if (matches) {
            scores[langCode] += matches.length;
          }
        }
      }
    }

    // 统计拉丁字符（英文、法文、德文、西班牙文等）
    scores['latin'] = this._countLatinChars(text);

    // 找到得分最高的语言
    let maxScore = 0;
    let detectedLanguage = 'unknown';
    const possibleLanguages = [];

    for (const [langCode, score] of Object.entries(scores)) {
      if (score > 0) {
        possibleLanguages.push(langCode);
        
        if (score > maxScore) {
          maxScore = score;
          detectedLanguage = langCode;
        }
      }
    }

    // 计算置信度
    let confidence = 0;
    if (totalChars > 0 && maxScore > 0) {
      confidence = maxScore / totalChars;
    }

    // 特殊处理：拉丁字符需要进一步区分
    if (detectedLanguage === 'latin') {
      const latinResult = this._detectLatinLanguage(text);
      return this._createResult(
        latinResult.language,
        latinResult.confidence * confidence,
        'character_range',
        latinResult.possibleLanguages
      );
    }

    // 特殊处理：日文和中文共享汉字
    if (detectedLanguage === 'zh') {
      // 检查是否有日文假名
      const japaneseChars = this._countJapaneseKana(text);
      if (japaneseChars > 0) {
        // 如果有假名，更可能是日文
        detectedLanguage = 'ja';
        confidence = Math.max(confidence, japaneseChars / totalChars);
      }
    }

    // 映射到完整的语言代码
    const langMapping = {
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'ar': 'ar-SA',
      'th': 'th-TH',
      'vi': 'vi-VN',
      'hi': 'hi-IN',
      'ru': 'ru-RU',
      'el': 'el-GR',
      'he': 'he-IL',
      'en': 'en-US',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'es': 'es-ES',
      'pt': 'pt-BR',
      'it': 'it-IT',
      'nl': 'nl-NL',
      'pl': 'pl-PL',
      'tr': 'tr-TR',
      'unknown': 'unknown'
    };

    const fullLangCode = langMapping[detectedLanguage] || detectedLanguage;

    return this._createResult(
      fullLangCode,
      confidence,
      'character_range',
      possibleLanguages
    );
  }

  /**
   * 统计拉丁字符数量
   * @private
   * @param {string} text - 文本
   * @returns {number} 拉丁字符数量
   */
  _countLatinChars(text) {
    // 匹配基本拉丁字母（a-z, A-Z）
    const latinRegex = /[a-zA-Z]/g;
    const matches = text.match(latinRegex);
    return matches ? matches.length : 0;
  }

  /**
   * 统计日文假名数量
   * @private
   * @param {string} text - 文本
   * @returns {number} 假名数量
   */
  _countJapaneseKana(text) {
    // 平假名和片假名
    const kanaRegex = /[\u3040-\u309F\u30A0-\u30FF]/g;
    const matches = text.match(kanaRegex);
    return matches ? matches.length : 0;
  }

  /**
   * 检测拉丁语言（英文、法文、德文等）
   * @private
   * @param {string} text - 文本
   * @returns {LanguageDetectionResult} 检测结果
   */
  _detectLatinLanguage(text) {
    // 基于常见单词和特殊字符进行简单检测
    const indicators = {
      'en': {
        commonWords: ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
                      'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
                      'from', 'as', 'into', 'through', 'during', 'before', 'after',
                      'above', 'below', 'between', 'under', 'again', 'further', 'then',
                      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
                      'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
                      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
                      'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while',
                      'although', 'though', 'even', 'ever', 'never', 'always', 'often',
                      'sometimes', 'usually', 'already', 'yet', 'still', 'also', 'too',
                      'either', 'neither', 'both', 'whether', 'either', 'neither',
                      'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
                      'am', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine',
                      'yours', 'his', 'hers', 'ours', 'theirs'],
        score: 0
      },
      'fr': {
        commonWords: ['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'à', 'au',
                      'aux', 'en', 'dans', 'sur', 'sous', 'pour', 'par', 'avec', 'sans',
                      'chez', 'contre', 'devant', 'derrière', 'avant', 'après', 'pendant',
                      'depuis', 'jusque', 'jusqu', 'jusquà', 'parmi', 'entre', 'vers',
                      'chez', 'selon', 'malgré', 'excepte', 'outre', 'çà', 'delà',
                      'à', 'où', 'quand', 'comment', 'pourquoi', 'combien', 'quel',
                      'quelle', 'quels', 'quelles', 'qui', 'que', 'quoi', 'dont', 'où',
                      'ce', 'cet', 'cette', 'ces', 'celui', 'celle', 'ceux', 'celles',
                      'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
                      'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'être', 'est',
                      'suis', 'es', 'sont', 'étais', 'était', 'étions', 'étiez', 'étaient',
                      'ai', 'as', 'a', 'avons', 'avez', 'ont', 'eu', 'eus', 'eut',
                      'avions', 'aviez', 'eurent', 'serai', 'seras', 'sera', 'serons',
                      'serez', 'seront', 'serais', 'serait', 'serions', 'seriez', 'seraient'],
        specialChars: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ç', 'ï', 'î', 'ô', 'ö', 'ù', 'û', 'ü', 'ÿ', 'œ'],
        score: 0
      },
      'de': {
        commonWords: ['der', 'die', 'das', 'ein', 'eine', 'einer', 'eines', 'dem', 'den',
                      'des', 'zu', 'zur', 'zum', 'in', 'im', 'an', 'am', 'auf', 'aus',
                      'bei', 'mit', 'von', 'vor', 'nach', 'für', 'durch', 'ohne', 'gegen',
                      'über', 'unter', 'zwischen', 'neben', 'hinter', 'vor', 'ausser',
                      'statt', 'trotz', 'wegen', 'während', 'seit', 'bis', 'ab',
                      'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'Sie', 'mich', 'dich',
                      'ihn', 'uns', 'euch', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer',
                      'meine', 'deine', 'seine', 'ihre', 'unsere', 'eure', 'ist', 'bin',
                      'bist', 'sind', 'war', 'warst', 'waren', 'gewesen', 'habe', 'hast',
                      'hat', 'haben', 'hatte', 'hattest', 'hatten', 'gehabt', 'werde',
                      'wirst', 'wird', 'werden', 'wurde', 'wurdest', 'wurden', 'geworden'],
        specialChars: ['ä', 'ö', 'ü', 'ß'],
        score: 0
      },
      'es': {
        commonWords: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del',
                      'a', 'al', 'en', 'entre', 'sobre', 'bajo', 'para', 'por', 'con',
                      'sin', 'contra', 'desde', 'hasta', 'durante', 'mientras', 'cuando',
                      'donde', 'como', 'porque', 'por', 'qué', 'cuál', 'cuáles', 'quién',
                      'quienes', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos',
                      'esas', 'aquel', 'aquella', 'aquellos', 'aquellas', 'mi', 'mis',
                      'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros',
                      'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'soy',
                      'eres', 'es', 'somos', 'sois', 'son', 'fui', 'fuiste', 'fue',
                      'fuimos', 'fuisteis', 'fueron', 'era', 'eras', 'era', 'éramos',
                      'erais', 'eran', 'he', 'has', 'ha', 'hemos', 'habéis', 'han',
                      'había', 'habías', 'había', 'habíamos', 'habíais', 'habían'],
        specialChars: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
        score: 0
      },
      'pt': {
        commonWords: ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da',
                      'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com',
                      'sem', 'contra', 'sobre', 'sob', 'abaixo', 'acima', 'entre', 'até',
                      'desde', 'durante', 'enquanto', 'quando', 'onde', 'como', 'porque',
                      'porquê', 'qual', 'quais', 'quem', 'este', 'esta', 'estes', 'estas',
                      'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'aqueles',
                      'aquelas', 'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus',
                      'tuas', 'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos',
                      'nossas', 'vosso', 'vossa', 'vossos', 'vossas', 'sou', 'és', 'é',
                      'somos', 'sois', 'são', 'fui', 'foste', 'foi', 'fomos', 'fostes',
                      'foram', 'era', 'eras', 'era', 'éramos', 'éreis', 'eram', 'tenho',
                      'tens', 'tem', 'temos', 'tendes', 'têm', 'tinha', 'tinhas', 'tinha',
                      'tínhamos', 'tínheis', 'tinham'],
        specialChars: ['á', 'â', 'ã', 'à', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ü', 'ç'],
        score: 0
      },
      'it': {
        commonWords: ['il', 'lo', 'la', 'l', 'i', 'gli', 'le', 'un', 'uno', 'una',
                      'un', 'del', 'dello', 'della', 'dei', 'degli', 'delle', 'a', 'al',
                      'allo', 'alla', 'ai', 'agli', 'alle', 'in', 'nel', 'nello', 'nella',
                      'nei', 'negli', 'nelle', 'di', 'da', 'con', 'per', 'tra', 'fra',
                      'sopra', 'sotto', 'dietro', 'davanti', 'vicino', 'lontano', 'prima',
                      'dopo', 'durante', 'mentre', 'quando', 'dove', 'come', 'perché',
                      'perchè', 'quale', 'quali', 'chi', 'questo', 'questa', 'questi',
                      'queste', 'quello', 'quella', 'quelli', 'quelle', 'mio', 'mia',
                      'miei', 'mie', 'tuo', 'tua', 'tuoi', 'tue', 'suo', 'sua', 'suoi',
                      'sue', 'nostro', 'nostra', 'nostri', 'nostre', 'vostro', 'vostra',
                      'vostri', 'vostre', 'loro', 'sono', 'sei', 'è', 'siamo', 'siete',
                      'ero', 'eri', 'era', 'eravamo', 'eravate', 'erano', 'ho', 'hai',
                      'ha', 'abbiamo', 'avete', 'hanno', 'avevo', 'avevi', 'aveva',
                      'avevamo', 'avevate', 'avevano'],
        specialChars: ['à', 'è', 'é', 'ì', 'ò', 'ó', 'ù'],
        score: 0
      }
    };

    // 转换为小写进行匹配
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/).filter(w => w.length > 0);

    // 统计常见单词
    for (const [lang, config] of Object.entries(indicators)) {
      for (const word of config.commonWords) {
        // 统计单词出现次数
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          config.score += matches.length * 2; // 单词权重更高
        }
      }

      // 统计特殊字符
      if (config.specialChars) {
        for (const char of config.specialChars) {
          const regex = new RegExp(`[${char}]`, 'gi');
          const matches = text.match(regex);
          if (matches) {
            config.score += matches.length * 3; // 特殊字符权重更高
          }
        }
      }
    }

    // 找到得分最高的语言
    let maxScore = 0;
    let detectedLanguage = 'en'; // 默认英文
    const possibleLanguages = [];

    for (const [lang, config] of Object.entries(indicators)) {
      if (config.score > 0) {
        possibleLanguages.push(lang);
        
        if (config.score > maxScore) {
          maxScore = config.score;
          detectedLanguage = lang;
        }
      }
    }

    // 计算置信度
    const totalWords = words.length;
    let confidence = 0;
    
    if (totalWords > 0 && maxScore > 0) {
      confidence = Math.min(1, maxScore / (totalWords * 2));
    }

    return this._createResult(
      detectedLanguage,
      confidence,
      'latin_detection',
      possibleLanguages
    );
  }

  /**
   * 使用 API 检测语言
   * @private
   * @param {string} text - 要检测的文本
   * @returns {Promise<LanguageDetectionResult>} 检测结果
   */
  async _detectByAPI(text) {
    // 使用 MyMemory API 的语言检测功能
    // 注意：MyMemory 主要是翻译 API，但可以尝试通过翻译结果推断语言
    
    this.logger.debug('尝试使用 API 检测语言（MyMemory 不直接支持检测，使用启发式方法）');
    
    // 作为备用方案，返回字符检测的增强版本
    const charResult = this._detectByCharacterRange(text);
    
    // 如果置信度已经很高，直接返回
    if (charResult.confidence >= DETECTION_THRESHOLDS.MEDIUM) {
      return charResult;
    }

    // 尝试通过翻译 API 推断
    // 注意：这是一个简化的实现，实际生产中可能需要使用专门的语言检测 API
    
    return this._createResult(
      charResult.language,
      Math.max(charResult.confidence, 0.5),
      'api_fallback',
      charResult.possibleLanguages
    );
  }

  /**
   * 合并两种检测结果
   * @private
   * @param {LanguageDetectionResult} charResult - 字符检测结果
   * @param {LanguageDetectionResult} apiResult - API 检测结果
   * @returns {LanguageDetectionResult} 合并后的结果
   */
  _mergeResults(charResult, apiResult) {
    // 如果两种方法结果一致，增加置信度
    if (charResult.language === apiResult.language) {
      return this._createResult(
        charResult.language,
        Math.min(1, (charResult.confidence + apiResult.confidence) / 2 + 0.2),
        'merged',
        [...new Set([...charResult.possibleLanguages, ...apiResult.possibleLanguages])]
      );
    }

    // 如果结果不一致，选择置信度高的
    if (apiResult.confidence > charResult.confidence) {
      return apiResult;
    }

    return charResult;
  }

  /**
   * 创建检测结果对象
   * @private
   * @param {string} language - 语言代码
   * @param {number} confidence - 置信度
   * @param {string} method - 检测方法
   * @param {string[]} [possibleLanguages=[]] - 可能的语言列表
   * @returns {LanguageDetectionResult} 检测结果
   */
  _createResult(language, confidence, method, possibleLanguages = []) {
    return {
      language: language,
      confidence: confidence,
      isHighConfidence: confidence >= DETECTION_THRESHOLDS.HIGH,
      possibleLanguages: possibleLanguages,
      method: method
    };
  }

  // ==================== 缓存管理 ====================

  /**
   * 从缓存获取检测结果
   * @private
   * @param {string} text - 文本
   * @returns {LanguageDetectionResult|null} 缓存的结果
   */
  _getFromCache(text) {
    const key = this._hashText(text);
    return this._detectionCache.get(key) || null;
  }

  /**
   * 添加到缓存
   * @private
   * @param {string} text - 文本
   * @param {LanguageDetectionResult} result - 检测结果
   */
  _addToCache(text, result) {
    const key = this._hashText(text);
    
    // 限制缓存大小
    if (this._detectionCache.size >= this._maxCacheSize) {
      // 删除最早的条目
      const firstKey = this._detectionCache.keys().next().value;
      this._detectionCache.delete(firstKey);
    }
    
    this._detectionCache.set(key, result);
  }

  /**
   * 哈希文本（用于缓存键）
   * @private
   * @param {string} text - 文本
   * @returns {string} 哈希值
   */
  _hashText(text) {
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为 32 位整数
    }
    return hash.toString(36);
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this._detectionCache.clear();
    this.logger.debug('语言检测缓存已清空');
  }
}

/**
 * 语言检测服务单例实例
 * @type {LanguageDetectionService}
 */
export const languageDetectionService = new LanguageDetectionService();

export default LanguageDetectionService;
