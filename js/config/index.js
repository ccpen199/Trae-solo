/**
 * @fileoverview 应用配置模块
 * @description 集中管理应用的所有配置项，包括API配置、UI配置、语言配置等
 * @version 1.0.0
 */

/**
 * 应用配置对象
 * @typedef {Object} AppConfig
 * @property {Object} api - API 相关配置
 * @property {Object} ui - UI 相关配置
 * @property {Object} language - 语言相关配置
 * @property {Object} speech - 语音相关配置
 * @property {Object} status - 状态提示配置
 */

/**
 * 应用配置
 * @type {AppConfig}
 */
const APP_CONFIG = {
  /**
   * API 相关配置
   */
  api: {
    /**
     * 翻译服务配置
     */
    translation: {
      /**
       * MyMemory Translation API 基础 URL
       * @type {string}
       */
      baseUrl: 'https://api.mymemory.translated.net/get',
      
      /**
       * 请求超时时间（毫秒）
       * @type {number}
       */
      timeout: 10000,
      
      /**
       * 最大重试次数
       * @type {number}
       */
      maxRetries: 3,
      
      /**
       * 重试延迟（毫秒）
       * @type {number}
       */
      retryDelay: 1000
    }
  },

  /**
   * UI 相关配置
   */
  ui: {
    /**
     * 状态提示显示时长（毫秒）
     * @type {number}
     */
    statusDisplayDuration: 2000,
    
    /**
     * 动画过渡时长（毫秒）
     * @type {number}
     */
    animationDuration: 300,
    
    /**
     * 响应式断点（像素）
     * @type {Object}
     */
    breakpoints: {
      mobile: 480,
      tablet: 768,
      desktop: 1024,
      wide: 1200
    }
  },

  /**
   * 语言相关配置
   */
  language: {
    /**
     * 默认源语言
     * @type {string}
     */
    defaultSource: 'zh-CN',
    
    /**
     * 默认目标语言
     * @type {string}
     */
    defaultTarget: 'en-US',
    
    /**
     * 支持的语言列表
     * @type {Array<{code: string, name: string, nativeName: string}>}
     */
    supportedLanguages: [
      { code: 'zh-CN', name: '中文 (简体)', nativeName: '简体中文' },
      { code: 'zh-TW', name: '中文 (繁体)', nativeName: '繁體中文' },
      { code: 'en-US', name: '英语 (美国)', nativeName: 'English (US)' },
      { code: 'en-GB', name: '英语 (英国)', nativeName: 'English (UK)' },
      { code: 'ja-JP', name: '日语', nativeName: '日本語' },
      { code: 'ko-KR', name: '韩语', nativeName: '한국어' },
      { code: 'fr-FR', name: '法语', nativeName: 'Français' },
      { code: 'de-DE', name: '德语', nativeName: 'Deutsch' },
      { code: 'es-ES', name: '西班牙语', nativeName: 'Español' },
      { code: 'pt-BR', name: '葡萄牙语 (巴西)', nativeName: 'Português (Brasil)' },
      { code: 'pt-PT', name: '葡萄牙语 (葡萄牙)', nativeName: 'Português (Portugal)' },
      { code: 'ru-RU', name: '俄语', nativeName: 'Русский' },
      { code: 'it-IT', name: '意大利语', nativeName: 'Italiano' },
      { code: 'nl-NL', name: '荷兰语', nativeName: 'Nederlands' },
      { code: 'pl-PL', name: '波兰语', nativeName: 'Polski' },
      { code: 'tr-TR', name: '土耳其语', nativeName: 'Türkçe' },
      { code: 'ar-SA', name: '阿拉伯语', nativeName: 'العربية' },
      { code: 'hi-IN', name: '印地语', nativeName: 'हिन्दी' },
      { code: 'th-TH', name: '泰语', nativeName: 'ไทย' },
      { code: 'vi-VN', name: '越南语', nativeName: 'Tiếng Việt' }
    ]
  },

  /**
   * 语音相关配置
   */
  speech: {
    /**
     * 语音识别配置
     */
    recognition: {
      /**
       * 是否连续识别
       * @type {boolean}
       */
      continuous: true,
      
      /**
       * 是否返回中间结果
       * @type {boolean}
       */
      interimResults: true,
      
      /**
       * 最大录音时长（毫秒）
       * @type {number}
       */
      maxDuration: 60000
    },
    
    /**
     * 语音合成配置
     */
    synthesis: {
      /**
       * 语速 (0.1 - 10)
       * @type {number}
       */
      rate: 0.9,
      
      /**
       * 音高 (0 - 2)
       * @type {number}
       */
      pitch: 1,
      
      /**
       * 音量 (0 - 1)
       * @type {number}
       */
      volume: 1
    }
  },

  /**
   * 状态提示配置
   */
  status: {
    /**
     * 状态类型
     * @type {Object}
     */
    types: {
      SUCCESS: 'success',
      ERROR: 'error',
      INFO: 'info',
      WARNING: 'warning'
    },
    
    /**
     * 状态消息
     * @type {Object}
     */
    messages: {
      listening: '正在听...请说话',
      recordingStopped: '录音已停止',
      translationComplete: '翻译完成！',
      translating: '正在翻译...',
      speaking: '正在朗读...',
      speakComplete: '朗读完成',
      copied: '已复制到剪贴板！',
      
      // 错误消息
      errorGeneric: '操作失败',
      errorNoText: '请输入要翻译的文本',
      errorNoSpeechText: '没有可朗读的文本',
      errorNoCopyText: '没有可复制的文本',
      errorSpeechRecognition: '语音识别出错',
      errorMicNotAllowed: '请允许麦克风权限',
      errorNoSpeech: '没有检测到语音',
      errorAudioCapture: '无法访问麦克风',
      errorNetwork: '网络连接失败',
      errorTranslation: '翻译失败',
      errorSpeechSynthesis: '朗读失败',
      errorCopy: '复制失败',
      errorBrowserNotSupported: '您的浏览器不支持此功能',
      errorSpeechRecognitionNotSupported: '您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器',
      errorSpeechSynthesisNotSupported: '您的浏览器不支持语音合成'
    }
  },

  /**
   * DOM 元素选择器配置
   */
  selectors: {
    /**
     * 语言选择器
     */
    language: {
      source: '#sourceLang',
      target: '#targetLang',
      swap: '#swapBtn'
    },
    
    /**
     * 文本区域
     */
    text: {
      source: '#sourceText',
      target: '#targetText'
    },
    
    /**
     * 按钮
     */
    buttons: {
      translate: '#translateBtn',
      startMic: '#startMicBtn',
      stopMic: '#stopMicBtn',
      clearSource: '#clearSourceBtn',
      clearTarget: '#clearTargetBtn',
      speakTarget: '#speakTargetBtn',
      copyTarget: '#copyTargetBtn'
    },
    
    /**
     * 状态提示
     */
    status: '#status'
  },

  /**
   * CSS 类名配置
   */
  cssClasses: {
    /**
     * 录音状态类
     */
    recording: 'recording',
    
    /**
     * 状态类型类
     */
    status: {
      success: 'success',
      error: 'error',
      info: 'info',
      warning: 'warning'
    }
  }
};

/**
 * 获取语言配置
 * @param {string} langCode - 语言代码
 * @returns {Object|undefined} 语言配置对象
 */
function getLanguageConfig(langCode) {
  return APP_CONFIG.language.supportedLanguages.find(lang => lang.code === langCode);
}

/**
 * 从完整语言代码中提取基础语言代码
 * @param {string} langCode - 完整语言代码（如 'zh-CN'）
 * @returns {string} 基础语言代码（如 'zh'）
 */
function getBaseLanguageCode(langCode) {
  return langCode.split('-')[0];
}

/**
 * 验证语言代码是否受支持
 * @param {string} langCode - 语言代码
 * @returns {boolean} 是否受支持
 */
function isLanguageSupported(langCode) {
  return APP_CONFIG.language.supportedLanguages.some(lang => lang.code === langCode);
}

// 导出配置对象和工具函数
export { 
  APP_CONFIG, 
  getLanguageConfig, 
  getBaseLanguageCode, 
  isLanguageSupported 
};
