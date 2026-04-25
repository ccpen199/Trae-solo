/**
 * @fileoverview 工具函数模块
 * @description 提供通用的工具函数，包括字符串处理、DOM操作、日志记录等
 * @version 1.0.0
 */

import { APP_CONFIG } from '../config/index.js';

/**
 * 日志工具类
 * @class
 * @description 封装 console 日志方法，支持不同级别的日志输出
 */
class Logger {
  /**
   * @constructor
   * @param {string} prefix - 日志前缀，用于标识日志来源
   */
  constructor(prefix = '') {
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  /**
   * 输出信息日志
   * @param {string} message - 日志消息
   * @param {...*} args - 额外参数
   */
  info(message, ...args) {
    console.log(`${this.prefix} ℹ️ ${message}`, ...args);
  }

  /**
   * 输出警告日志
   * @param {string} message - 日志消息
   * @param {...*} args - 额外参数
   */
  warn(message, ...args) {
    console.warn(`${this.prefix} ⚠️ ${message}`, ...args);
  }

  /**
   * 输出错误日志
   * @param {string} message - 日志消息
   * @param {...*} args - 额外参数
   */
  error(message, ...args) {
    console.error(`${this.prefix} ❌ ${message}`, ...args);
  }

  /**
   * 输出调试日志
   * @param {string} message - 日志消息
   * @param {...*} args - 额外参数
   */
  debug(message, ...args) {
    console.debug(`${this.prefix} 🔍 ${message}`, ...args);
  }
}

/**
 * 默认日志实例
 * @type {Logger}
 */
const logger = new Logger('TranslateApp');

/**
 * 创建带前缀的日志实例
 * @param {string} prefix - 日志前缀
 * @returns {Logger} 日志实例
 */
function createLogger(prefix) {
  return new Logger(prefix);
}

/**
 * 延迟执行函数
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise<void>} Promise 对象
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 检查对象是否为空
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} 是否为空
 */
function isEmptyObject(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * 检查值是否为空
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为空
 */
function isEmpty(value) {
  return value === null || value === undefined || value === '' || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && isEmptyObject(value));
}

/**
 * 深拷贝对象
 * @param {Object|Array} obj - 要拷贝的对象
 * @returns {Object|Array} 拷贝后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 安全的 JSON 解析
 * @param {string} str - 要解析的字符串
 * @param {*} defaultValue - 解析失败时的默认值
 * @returns {*} 解析结果或默认值
 */
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    logger.error('JSON 解析失败', error);
    return defaultValue;
  }
}

/**
 * 生成唯一 ID
 * @returns {string} 唯一 ID
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 截取字符串
 * @param {string} str - 原始字符串
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀（默认为 '...'）
 * @returns {string} 截取后的字符串
 */
function truncateString(str, maxLength, suffix = '...') {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 转义 HTML 特殊字符
 * @param {string} str - 原始字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 检查浏览器是否支持某个功能
 * @param {string} feature - 功能名称
 * @returns {boolean} 是否支持
 */
function isFeatureSupported(feature) {
  switch (feature) {
    case 'speechRecognition':
      return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    case 'speechSynthesis':
      return 'speechSynthesis' in window;
    case 'clipboard':
      return 'clipboard' in navigator;
    case 'fetch':
      return 'fetch' in window;
    case 'promise':
      return 'Promise' in window;
    default:
      return false;
  }
}

/**
 * 获取浏览器支持的语音识别构造函数
 * @returns {Function|undefined} 语音识别构造函数
 */
function getSpeechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

/**
 * 带超时的 Fetch 请求
 * @param {string} url - 请求 URL
 * @param {Object} options - Fetch 选项
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<Response>} Fetch 响应
 */
async function fetchWithTimeout(url, options = {}, timeout = APP_CONFIG.api.translation.timeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`请求超时 (${timeout}ms)`);
    }
    throw error;
  }
}

/**
 * 重试函数
 * @param {Function} fn - 要执行的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delayMs - 重试延迟（毫秒）
 * @returns {Promise<*>} 函数执行结果
 */
async function retry(fn, maxRetries = APP_CONFIG.api.translation.maxRetries, delayMs = APP_CONFIG.api.translation.retryDelay) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`重试 ${attempt + 1}/${maxRetries} 失败`, error);
      
      if (attempt < maxRetries - 1) {
        await delay(delayMs * (attempt + 1)); // 指数退避
      }
    }
  }
  
  throw lastError;
}

/**
 * 格式化错误消息
 * @param {Error|string} error - 错误对象或错误消息
 * @returns {string} 格式化后的错误消息
 */
function formatErrorMessage(error) {
  if (error instanceof Error) {
    return error.message || String(error);
  }
  return String(error);
}

export {
  // 日志类
  Logger,
  logger,
  createLogger,
  
  // 异步工具
  delay,
  debounce,
  throttle,
  
  // 类型检查
  isEmptyObject,
  isEmpty,
  
  // 对象操作
  deepClone,
  safeJsonParse,
  
  // 字符串工具
  generateUniqueId,
  truncateString,
  escapeHtml,
  
  // 浏览器功能检测
  isFeatureSupported,
  getSpeechRecognitionConstructor,
  
  // 网络请求
  fetchWithTimeout,
  retry,
  
  // 错误处理
  formatErrorMessage
};
