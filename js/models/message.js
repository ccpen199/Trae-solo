/**
 * @fileoverview 消息数据模型
 * @description 定义对话翻译中的消息数据结构和操作方法
 * @version 1.0.0
 */

import { generateUniqueId } from '../utils/index.js';

/**
 * 消息角色枚举
 * @readonly
 * @enum {string}
 */
export const MESSAGE_ROLES = {
  /** 用户发送的消息（源语言） */
  USER: 'user',
  /** 翻译后的消息（目标语言） */
  TRANSLATED: 'translated',
  /** 系统消息 */
  SYSTEM: 'system'
};

/**
 * 消息状态枚举
 * @readonly
 * @enum {string}
 */
export const MESSAGE_STATES = {
  /** 消息正在发送中 */
  SENDING: 'sending',
  /** 消息正在翻译中 */
  TRANSLATING: 'translating',
  /** 消息已完成 */
  COMPLETED: 'completed',
  /** 消息处理失败 */
  ERROR: 'error'
};

/**
 * 消息类
 * @class
 * @description 表示对话中的一条消息，包含原始文本、翻译文本、时间戳等信息
 */
export class Message {
  /**
   * 创建一个消息实例
   * @constructor
   * @param {Object} options - 消息配置选项
   * @param {string} [options.id] - 消息唯一标识，自动生成
   * @param {string} options.role - 消息角色（'user' | 'translated' | 'system'）
   * @param {string} options.content - 消息内容
   * @param {string} [options.sourceContent] - 原始内容（用于翻译消息）
   * @param {string} options.language - 消息语言代码
   * @param {string} [options.sourceLanguage] - 源语言（用于翻译消息）
   * @param {string} [options.targetLanguage] - 目标语言（用于翻译消息）
   * @param {string} [options.state='completed'] - 消息状态
   * @param {number} [options.timestamp] - 时间戳，默认为当前时间
   * @param {string} [options.errorMessage] - 错误信息（当状态为 error 时）
   */
  constructor(options) {
    /**
     * 消息唯一标识
     * @type {string}
     */
    this.id = options.id || generateUniqueId();

    /**
     * 消息角色
     * @type {string}
     */
    this.role = options.role;

    /**
     * 消息内容
     * @type {string}
     */
    this.content = options.content;

    /**
     * 原始内容（用于翻译消息）
     * @type {string|undefined}
     */
    this.sourceContent = options.sourceContent;

    /**
     * 消息语言代码
     * @type {string}
     */
    this.language = options.language;

    /**
     * 源语言（用于翻译消息）
     * @type {string|undefined}
     */
    this.sourceLanguage = options.sourceLanguage;

    /**
     * 目标语言（用于翻译消息）
     * @type {string|undefined}
     */
    this.targetLanguage = options.targetLanguage;

    /**
     * 消息状态
     * @type {string}
     */
    this.state = options.state || MESSAGE_STATES.COMPLETED;

    /**
     * 时间戳
     * @type {number}
     */
    this.timestamp = options.timestamp || Date.now();

    /**
     * 错误信息
     * @type {string|undefined}
     */
    this.errorMessage = options.errorMessage;

    // 验证必填字段
    this._validate();
  }

  /**
   * 验证消息数据
   * @private
   * @throws {Error} 当必填字段缺失或无效时抛出错误
   */
  _validate() {
    if (!this.role) {
      throw new Error('Message role is required');
    }

    if (!Object.values(MESSAGE_ROLES).includes(this.role)) {
      throw new Error(`Invalid message role: ${this.role}`);
    }

    if (!this.language) {
      throw new Error('Message language is required');
    }

    if (this.content === undefined || this.content === null) {
      throw new Error('Message content is required');
    }
  }

  /**
   * 检查消息是否为用户消息
   * @returns {boolean}
   */
  isUserMessage() {
    return this.role === MESSAGE_ROLES.USER;
  }

  /**
   * 检查消息是否为翻译消息
   * @returns {boolean}
   */
  isTranslatedMessage() {
    return this.role === MESSAGE_ROLES.TRANSLATED;
  }

  /**
   * 检查消息是否为系统消息
   * @returns {boolean}
   */
  isSystemMessage() {
    return this.role === MESSAGE_ROLES.SYSTEM;
  }

  /**
   * 检查消息是否处于加载状态
   * @returns {boolean}
   */
  isLoading() {
    return this.state === MESSAGE_STATES.SENDING || 
           this.state === MESSAGE_STATES.TRANSLATING;
  }

  /**
   * 检查消息是否处理失败
   * @returns {boolean}
   */
  hasError() {
    return this.state === MESSAGE_STATES.ERROR;
  }

  /**
   * 获取格式化的时间字符串
   * @param {string} [locale='zh-CN'] - 地区设置
   * @returns {string} 格式化的时间字符串
   */
  getFormattedTime(locale = 'zh-CN') {
    const date = new Date(this.timestamp);
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * 获取格式化的日期时间字符串
   * @param {string} [locale='zh-CN'] - 地区设置
   * @returns {string} 格式化的日期时间字符串
   */
  getFormattedDateTime(locale = 'zh-CN') {
    const date = new Date(this.timestamp);
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * 创建用户消息的静态工厂方法
   * @static
   * @param {string} content - 消息内容
   * @param {string} language - 语言代码
   * @returns {Message} 消息实例
   */
  static createUserMessage(content, language) {
    return new Message({
      role: MESSAGE_ROLES.USER,
      content: content,
      language: language,
      state: MESSAGE_STATES.COMPLETED
    });
  }

  /**
   * 创建翻译消息的静态工厂方法
   * @static
   * @param {string} content - 翻译内容
   * @param {string} sourceContent - 原始内容
   * @param {string} sourceLanguage - 源语言
   * @param {string} targetLanguage - 目标语言
   * @returns {Message} 消息实例
   */
  static createTranslatedMessage(content, sourceContent, sourceLanguage, targetLanguage) {
    return new Message({
      role: MESSAGE_ROLES.TRANSLATED,
      content: content,
      sourceContent: sourceContent,
      language: targetLanguage,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      state: MESSAGE_STATES.COMPLETED
    });
  }

  /**
   * 创建系统消息的静态工厂方法
   * @static
   * @param {string} content - 消息内容
   * @param {string} [language='zh-CN'] - 语言代码
   * @returns {Message} 消息实例
   */
  static createSystemMessage(content, language = 'zh-CN') {
    return new Message({
      role: MESSAGE_ROLES.SYSTEM,
      content: content,
      language: language,
      state: MESSAGE_STATES.COMPLETED
    });
  }

  /**
   * 创建加载中消息的静态工厂方法
   * @static
   * @param {string} content - 内容
   * @param {string} language - 语言代码
   * @param {string} state - 加载状态
   * @returns {Message} 消息实例
   */
  static createLoadingMessage(content, language, state = MESSAGE_STATES.TRANSLATING) {
    return new Message({
      role: MESSAGE_ROLES.TRANSLATED,
      content: content,
      language: language,
      state: state
    });
  }

  /**
   * 创建错误消息的静态工厂方法
   * @static
   * @param {string} errorMessage - 错误信息
   * @param {string} language - 语言代码
   * @returns {Message} 消息实例
   */
  static createErrorMessage(errorMessage, language) {
    return new Message({
      role: MESSAGE_ROLES.SYSTEM,
      content: '翻译失败',
      language: language,
      state: MESSAGE_STATES.ERROR,
      errorMessage: errorMessage
    });
  }

  /**
   * 从普通对象创建消息实例
   * @static
   * @param {Object} obj - 普通对象
   * @returns {Message} 消息实例
   */
  static fromObject(obj) {
    return new Message({
      id: obj.id,
      role: obj.role,
      content: obj.content,
      sourceContent: obj.sourceContent,
      language: obj.language,
      sourceLanguage: obj.sourceLanguage,
      targetLanguage: obj.targetLanguage,
      state: obj.state,
      timestamp: obj.timestamp,
      errorMessage: obj.errorMessage
    });
  }

  /**
   * 将消息转换为普通对象（用于存储）
   * @returns {Object} 普通对象
   */
  toObject() {
    return {
      id: this.id,
      role: this.role,
      content: this.content,
      sourceContent: this.sourceContent,
      language: this.language,
      sourceLanguage: this.sourceLanguage,
      targetLanguage: this.targetLanguage,
      state: this.state,
      timestamp: this.timestamp,
      errorMessage: this.errorMessage
    };
  }
}

export default Message;
