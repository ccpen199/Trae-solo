/**
 * @fileoverview DOM 操作模块
 * @description 提供 DOM 元素获取、操作、事件绑定等功能
 * @version 1.0.0
 */

import { APP_CONFIG } from '../config/index.js';
import { logger } from '../utils/index.js';

/**
 * DOM 元素缓存对象
 * @type {Object<string, HTMLElement>}
 */
const elementCache = {};

/**
 * 获取 DOM 元素（带缓存）
 * @param {string} selector - CSS 选择器
 * @param {HTMLElement} [parent=document] - 父元素
 * @returns {HTMLElement|null} DOM 元素
 */
function getElement(selector, parent = document) {
  const cacheKey = `${parent === document ? 'document' : parent.getAttribute('id') || parent}:${selector}`;
  
  if (elementCache[cacheKey]) {
    return elementCache[cacheKey];
  }
  
  const element = parent.querySelector(selector);
  
  if (element) {
    elementCache[cacheKey] = element;
  }
  
  return element;
}

/**
 * 获取多个 DOM 元素
 * @param {string} selector - CSS 选择器
 * @param {HTMLElement} [parent=document] - 父元素
 * @returns {NodeListOf<HTMLElement>} DOM 元素列表
 */
function getElements(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * 清空元素缓存
 */
function clearElementCache() {
  Object.keys(elementCache).forEach(key => {
    delete elementCache[key];
  });
  logger.debug('元素缓存已清空');
}

/**
 * DOM 元素引用对象
 * @type {Object}
 */
const DOM_REFS = {
  /**
   * 语言选择器相关元素
   */
  language: {
    /**
     * 源语言选择器
     * @returns {HTMLSelectElement|null}
     */
    get sourceLang() {
      return getElement(APP_CONFIG.selectors.language.source);
    },
    
    /**
     * 目标语言选择器
     * @returns {HTMLSelectElement|null}
     */
    get targetLang() {
      return getElement(APP_CONFIG.selectors.language.target);
    },
    
    /**
     * 交换语言按钮
     * @returns {HTMLButtonElement|null}
     */
    get swapBtn() {
      return getElement(APP_CONFIG.selectors.language.swap);
    }
  },

  /**
   * 文本区域相关元素
   */
  text: {
    /**
     * 源文本输入框
     * @returns {HTMLTextAreaElement|null}
     */
    get sourceText() {
      return getElement(APP_CONFIG.selectors.text.source);
    },
    
    /**
     * 目标文本显示框
     * @returns {HTMLTextAreaElement|null}
     */
    get targetText() {
      return getElement(APP_CONFIG.selectors.text.target);
    }
  },

  /**
   * 按钮相关元素
   */
  buttons: {
    /**
     * 翻译按钮
     * @returns {HTMLButtonElement|null}
     */
    get translateBtn() {
      return getElement(APP_CONFIG.selectors.buttons.translate);
    },
    
    /**
     * 开始录音按钮
     * @returns {HTMLButtonElement|null}
     */
    get startMicBtn() {
      return getElement(APP_CONFIG.selectors.buttons.startMic);
    },
    
    /**
     * 停止录音按钮
     * @returns {HTMLButtonElement|null}
     */
    get stopMicBtn() {
      return getElement(APP_CONFIG.selectors.buttons.stopMic);
    },
    
    /**
     * 清空源文本按钮
     * @returns {HTMLButtonElement|null}
     */
    get clearSourceBtn() {
      return getElement(APP_CONFIG.selectors.buttons.clearSource);
    },
    
    /**
     * 清空目标文本按钮
     * @returns {HTMLButtonElement|null}
     */
    get clearTargetBtn() {
      return getElement(APP_CONFIG.selectors.buttons.clearTarget);
    },
    
    /**
     * 朗读目标文本按钮
     * @returns {HTMLButtonElement|null}
     */
    get speakTargetBtn() {
      return getElement(APP_CONFIG.selectors.buttons.speakTarget);
    },
    
    /**
     * 复制目标文本按钮
     * @returns {HTMLButtonElement|null}
     */
    get copyTargetBtn() {
      return getElement(APP_CONFIG.selectors.buttons.copyTarget);
    }
  },

  /**
   * 状态提示元素
   */
  get statusElement() {
    return getElement(APP_CONFIG.selectors.status);
  }
};

/**
 * 检查所有必要的 DOM 元素是否存在
 * @returns {boolean} 所有元素是否都存在
 */
function validateDOMElements() {
  const requiredElements = [
    { element: DOM_REFS.language.sourceLang, name: '源语言选择器' },
    { element: DOM_REFS.language.targetLang, name: '目标语言选择器' },
    { element: DOM_REFS.language.swapBtn, name: '交换语言按钮' },
    { element: DOM_REFS.text.sourceText, name: '源文本输入框' },
    { element: DOM_REFS.text.targetText, name: '目标文本显示框' },
    { element: DOM_REFS.buttons.translateBtn, name: '翻译按钮' },
    { element: DOM_REFS.buttons.startMicBtn, name: '开始录音按钮' },
    { element: DOM_REFS.buttons.stopMicBtn, name: '停止录音按钮' },
    { element: DOM_REFS.buttons.clearSourceBtn, name: '清空源文本按钮' },
    { element: DOM_REFS.buttons.clearTargetBtn, name: '清空目标文本按钮' },
    { element: DOM_REFS.buttons.speakTargetBtn, name: '朗读按钮' },
    { element: DOM_REFS.buttons.copyTargetBtn, name: '复制按钮' },
    { element: DOM_REFS.statusElement, name: '状态提示元素' }
  ];

  let allValid = true;
  
  requiredElements.forEach(({ element, name }) => {
    if (!element) {
      logger.error(`DOM 元素缺失: ${name}`);
      allValid = false;
    }
  });

  return allValid;
}

/**
 * 设置元素文本内容
 * @param {HTMLElement} element - DOM 元素
 * @param {string} text - 文本内容
 */
function setElementText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

/**
 * 设置元素值
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} element - 表单元素
 * @param {string} value - 值
 */
function setElementValue(element, value) {
  if (element) {
    element.value = value;
  }
}

/**
 * 获取元素值
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} element - 表单元素
 * @returns {string} 值
 */
function getElementValue(element) {
  return element ? element.value : '';
}

/**
 * 显示元素
 * @param {HTMLElement} element - DOM 元素
 * @param {string} [display='flex'] - 显示方式
 */
function showElement(element, display = 'flex') {
  if (element) {
    element.style.display = display;
  }
}

/**
 * 隐藏元素
 * @param {HTMLElement} element - DOM 元素
 */
function hideElement(element) {
  if (element) {
    element.style.display = 'none';
  }
}

/**
 * 禁用元素
 * @param {HTMLElement} element - DOM 元素
 */
function disableElement(element) {
  if (element) {
    element.disabled = true;
  }
}

/**
 * 启用元素
 * @param {HTMLElement} element - DOM 元素
 */
function enableElement(element) {
  if (element) {
    element.disabled = false;
  }
}

/**
 * 添加 CSS 类
 * @param {HTMLElement} element - DOM 元素
 * @param {string} className - 类名
 */
function addClass(element, className) {
  if (element && className) {
    element.classList.add(className);
  }
}

/**
 * 移除 CSS 类
 * @param {HTMLElement} element - DOM 元素
 * @param {string} className - 类名
 */
function removeClass(element, className) {
  if (element && className) {
    element.classList.remove(className);
  }
}

/**
 * 切换 CSS 类
 * @param {HTMLElement} element - DOM 元素
 * @param {string} className - 类名
 * @param {boolean} [force] - 强制添加或移除
 * @returns {boolean} 操作后类是否存在
 */
function toggleClass(element, className, force) {
  if (element && className) {
    return element.classList.toggle(className, force);
  }
  return false;
}

/**
 * 绑定事件监听器
 * @param {HTMLElement} element - DOM 元素
 * @param {string} eventType - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object} [options] - 事件选项
 */
function addEventListener(element, eventType, handler, options) {
  if (element && eventType && handler) {
    element.addEventListener(eventType, handler, options);
  }
}

/**
 * 移除事件监听器
 * @param {HTMLElement} element - DOM 元素
 * @param {string} eventType - 事件类型
 * @param {Function} handler - 事件处理函数
 */
function removeEventListener(element, eventType, handler) {
  if (element && eventType && handler) {
    element.removeEventListener(eventType, handler);
  }
}

/**
 * 创建 DOM 元素
 * @param {string} tagName - 标签名
 * @param {Object} [attributes] - 属性对象
 * @param {string} [innerHTML] - 内部 HTML
 * @returns {HTMLElement} 创建的元素
 */
function createElement(tagName, attributes = {}, innerHTML = '') {
  const element = document.createElement(tagName);
  
  Object.keys(attributes).forEach(key => {
    if (key === 'className') {
      element.className = attributes[key];
    } else if (key === 'style' && typeof attributes[key] === 'object') {
      Object.assign(element.style, attributes[key]);
    } else {
      element.setAttribute(key, attributes[key]);
    }
  });
  
  if (innerHTML) {
    element.innerHTML = innerHTML;
  }
  
  return element;
}

/**
 * 生成语言选项 HTML
 * @param {Array<{code: string, name: string}>} languages - 语言列表
 * @param {string} [selectedCode] - 选中的语言代码
 * @returns {string} HTML 字符串
 */
function generateLanguageOptions(languages, selectedCode) {
  return languages.map(lang => 
    `<option value="${lang.code}" ${lang.code === selectedCode ? 'selected' : ''}>
      ${lang.name}
    </option>`
  ).join('');
}

/**
 * 初始化语言选择器
 * @description 使用配置中的语言列表填充语言选择器
 */
function initializeLanguageSelectors() {
  const { sourceLang, targetLang } = DOM_REFS.language;
  const { supportedLanguages, defaultSource, defaultTarget } = APP_CONFIG.language;

  if (sourceLang) {
    sourceLang.innerHTML = generateLanguageOptions(supportedLanguages, defaultSource);
    logger.debug('源语言选择器已初始化');
  }

  if (targetLang) {
    targetLang.innerHTML = generateLanguageOptions(supportedLanguages, defaultTarget);
    logger.debug('目标语言选择器已初始化');
  }
}

export {
  // 元素获取
  getElement,
  getElements,
  clearElementCache,
  
  // 元素引用
  DOM_REFS,
  
  // 验证
  validateDOMElements,
  
  // 元素操作
  setElementText,
  setElementValue,
  getElementValue,
  showElement,
  hideElement,
  disableElement,
  enableElement,
  addClass,
  removeClass,
  toggleClass,
  
  // 事件操作
  addEventListener,
  removeEventListener,
  
  // 元素创建
  createElement,
  
  // 语言选择器
  generateLanguageOptions,
  initializeLanguageSelectors
};
