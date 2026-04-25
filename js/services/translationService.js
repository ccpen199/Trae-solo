/**
 * @fileoverview 翻译服务模块
 * @description 提供文本翻译功能，封装与翻译 API 的交互
 * @version 1.0.0
 */

import { APP_CONFIG, getBaseLanguageCode } from '../config/index.js';
import { logger, fetchWithTimeout, retry, formatErrorMessage } from '../utils/index.js';

/**
 * 翻译服务类
 * @class
 * @description 封装翻译 API 的调用逻辑
 */
class TranslationService {
  /**
   * @constructor
   */
  constructor() {
    this.config = APP_CONFIG.api.translation;
    this.logger = logger;
  }

  /**
   * 构建翻译 API URL
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言代码
   * @param {string} targetLang - 目标语言代码
   * @returns {string} API 请求 URL
   */
  buildUrl(text, sourceLang, targetLang) {
    const sourceCode = getBaseLanguageCode(sourceLang);
    const targetCode = getBaseLanguageCode(targetLang);
    const langPair = `${sourceCode}|${targetCode}`;
    
    const url = new URL(this.config.baseUrl);
    url.searchParams.append('q', text);
    url.searchParams.append('langpair', langPair);
    
    return url.toString();
  }

  /**
   * 执行翻译请求
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言代码
   * @param {string} targetLang - 目标语言代码
   * @returns {Promise<string>} 翻译后的文本
   * @throws {Error} 翻译失败时抛出错误
   */
  async translate(text, sourceLang, targetLang) {
    this.logger.info(`开始翻译: "${text}" (${sourceLang} -> ${targetLang})`);

    // 验证输入
    if (!text || text.trim().length === 0) {
      throw new Error(APP_CONFIG.status.messages.errorNoText);
    }

    const trimmedText = text.trim();
    const url = this.buildUrl(trimmedText, sourceLang, targetLang);

    try {
      // 使用重试机制
      const response = await retry(
        () => this.executeRequest(url),
        this.config.maxRetries,
        this.config.retryDelay
      );

      this.logger.info('翻译成功', {
        original: trimmedText,
        translated: response
      });

      return response;
    } catch (error) {
      this.logger.error('翻译失败', error);
      throw new Error(`${APP_CONFIG.status.messages.errorTranslation}: ${formatErrorMessage(error)}`);
    }
  }

  /**
   * 执行 HTTP 请求
   * @private
   * @param {string} url - 请求 URL
   * @returns {Promise<string>} 翻译结果
   * @throws {Error} 请求失败时抛出错误
   */
  async executeRequest(url) {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      },
      this.config.timeout
    );

    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  /**
   * 解析 API 响应
   * @private
   * @param {Object} data - API 响应数据
   * @returns {string} 翻译后的文本
   * @throws {Error} 响应格式错误时抛出错误
   */
  parseResponse(data) {
    // 检查响应状态
    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || `API 错误: ${data.responseStatus}`);
    }

    // 检查翻译数据
    if (!data.responseData || !data.responseData.translatedText) {
      throw new Error('API 响应格式错误');
    }

    return data.responseData.translatedText;
  }

  /**
   * 批量翻译
   * @param {string[]} texts - 要翻译的文本数组
   * @param {string} sourceLang - 源语言代码
   * @param {string} targetLang - 目标语言代码
   * @returns {Promise<string[]>} 翻译结果数组
   */
  async translateBatch(texts, sourceLang, targetLang) {
    const results = [];
    
    for (const text of texts) {
      try {
        const translated = await this.translate(text, sourceLang, targetLang);
        results.push(translated);
      } catch (error) {
        this.logger.error(`批量翻译失败: "${text}"`, error);
        results.push(''); // 失败时返回空字符串
      }
    }
    
    return results;
  }
}

/**
 * 翻译服务单例实例
 * @type {TranslationService}
 */
const translationService = new TranslationService();

/**
 * 便捷函数：翻译文本
 * @param {string} text - 要翻译的文本
 * @param {string} sourceLang - 源语言代码
 * @param {string} targetLang - 目标语言代码
 * @returns {Promise<string>} 翻译后的文本
 */
async function translateText(text, sourceLang, targetLang) {
  return translationService.translate(text, sourceLang, targetLang);
}

export {
  // 服务类
  TranslationService,
  
  // 单例实例
  translationService,
  
  // 便捷函数
  translateText
};
