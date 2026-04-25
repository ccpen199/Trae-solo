/**
 * @fileoverview 会话数据模型
 * @description 定义对话翻译中的会话数据结构和操作方法
 * @version 1.0.0
 */

import { generateUniqueId } from '../utils/index.js';
import { Message, MESSAGE_ROLES } from './message.js';

/**
 * 会话类
 * @class
 * @description 表示一个完整的对话翻译会话，包含多条消息、语言配置等信息
 */
export class Conversation {
  /**
   * 创建一个会话实例
   * @constructor
   * @param {Object} options - 会话配置选项
   * @param {string} [options.id] - 会话唯一标识，自动生成
   * @param {string} [options.title] - 会话标题，默认为第一条消息的摘要
   * @param {string} options.sourceLanguage - 源语言代码
   * @param {string} options.targetLanguage - 目标语言代码
   * @param {Message[]} [options.messages=[]] - 消息列表
   * @param {number} [options.createdAt] - 创建时间戳
   * @param {number} [options.updatedAt] - 最后更新时间戳
   * @param {boolean} [options.isFavorite=false] - 是否收藏
   */
  constructor(options) {
    /**
     * 会话唯一标识
     * @type {string}
     */
    this.id = options.id || generateUniqueId();

    /**
     * 会话标题
     * @type {string}
     */
    this.title = options.title || '';

    /**
     * 源语言代码
     * @type {string}
     */
    this.sourceLanguage = options.sourceLanguage;

    /**
     * 目标语言代码
     * @type {string}
     */
    this.targetLanguage = options.targetLanguage;

    /**
     * 消息列表
     * @type {Message[]}
     */
    this.messages = options.messages || [];

    /**
     * 创建时间戳
     * @type {number}
     */
    this.createdAt = options.createdAt || Date.now();

    /**
     * 最后更新时间戳
     * @type {number}
     */
    this.updatedAt = options.updatedAt || Date.now();

    /**
     * 是否收藏
     * @type {boolean}
     */
    this.isFavorite = options.isFavorite || false;

    // 如果没有标题但有消息，生成默认标题
    if (!this.title && this.messages.length > 0) {
      this.title = this._generateDefaultTitle();
    }
  }

  /**
   * 生成默认标题（从第一条消息提取）
   * @private
   * @returns {string} 默认标题
   */
  _generateDefaultTitle() {
    if (this.messages.length === 0) {
      return '';
    }

    // 找到第一条用户消息
    const firstUserMessage = this.messages.find(m => m.isUserMessage());
    
    if (firstUserMessage) {
      // 截取前20个字符
      const content = firstUserMessage.content.trim();
      return content.length > 20 ? content.substring(0, 20) + '...' : content;
    }

    // 如果没有用户消息，使用第一条消息
    const firstMessage = this.messages[0];
    const content = firstMessage.content.trim();
    return content.length > 20 ? content.substring(0, 20) + '...' : content;
  }

  /**
   * 添加消息到会话
   * @param {Message} message - 要添加的消息
   */
  addMessage(message) {
    this.messages.push(message);
    this.updatedAt = Date.now();

    // 更新标题（如果是第一条消息）
    if (this.messages.length === 1) {
      this.title = this._generateDefaultTitle();
    }
  }

  /**
   * 批量添加消息
   * @param {Message[]} messages - 消息列表
   */
  addMessages(messages) {
    this.messages.push(...messages);
    this.updatedAt = Date.now();

    // 更新标题（如果之前没有标题）
    if (!this.title && this.messages.length > 0) {
      this.title = this._generateDefaultTitle();
    }
  }

  /**
   * 根据 ID 获取消息
   * @param {string} messageId - 消息 ID
   * @returns {Message|undefined} 消息实例
   */
  getMessageById(messageId) {
    return this.messages.find(m => m.id === messageId);
  }

  /**
   * 更新消息
   * @param {string} messageId - 消息 ID
   * @param {Object} updates - 更新内容
   * @returns {boolean} 是否更新成功
   */
  updateMessage(messageId, updates) {
    const index = this.messages.findIndex(m => m.id === messageId);
    
    if (index === -1) {
      return false;
    }

    // 创建新的消息实例
    const currentMessage = this.messages[index];
    const updatedMessage = new Message({
      ...currentMessage.toObject(),
      ...updates
    });

    this.messages[index] = updatedMessage;
    this.updatedAt = Date.now();

    return true;
  }

  /**
   * 删除消息
   * @param {string} messageId - 消息 ID
   * @returns {boolean} 是否删除成功
   */
  removeMessage(messageId) {
    const index = this.messages.findIndex(m => m.id === messageId);
    
    if (index === -1) {
      return false;
    }

    this.messages.splice(index, 1);
    this.updatedAt = Date.now();

    return true;
  }

  /**
   * 清空所有消息
   */
  clearMessages() {
    this.messages = [];
    this.updatedAt = Date.now();
    this.title = '';
  }

  /**
   * 交换源语言和目标语言
   */
  swapLanguages() {
    const temp = this.sourceLanguage;
    this.sourceLanguage = this.targetLanguage;
    this.targetLanguage = temp;
    this.updatedAt = Date.now();
  }

  /**
   * 切换收藏状态
   * @returns {boolean} 新的收藏状态
   */
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    this.updatedAt = Date.now();
    return this.isFavorite;
  }

  /**
   * 获取所有用户消息
   * @returns {Message[]} 用户消息列表
   */
  getUserMessages() {
    return this.messages.filter(m => m.isUserMessage());
  }

  /**
   * 获取所有翻译消息
   * @returns {Message[]} 翻译消息列表
   */
  getTranslatedMessages() {
    return this.messages.filter(m => m.isTranslatedMessage());
  }

  /**
   * 获取最后一条消息
   * @returns {Message|undefined} 最后一条消息
   */
  getLastMessage() {
    return this.messages[this.messages.length - 1];
  }

  /**
   * 获取消息数量
   * @returns {number} 消息数量
   */
  getMessageCount() {
    return this.messages.length;
  }

  /**
   * 检查会话是否为空
   * @returns {boolean} 是否为空
   */
  isEmpty() {
    return this.messages.length === 0;
  }

  /**
   * 获取格式化的创建时间
   * @param {string} [locale='zh-CN'] - 地区设置
   * @returns {string} 格式化的时间字符串
   */
  getFormattedCreatedAt(locale = 'zh-CN') {
    return this._formatDateTime(this.createdAt, locale);
  }

  /**
   * 获取格式化的更新时间
   * @param {string} [locale='zh-CN'] - 地区设置
   * @returns {string} 格式化的时间字符串
   */
  getFormattedUpdatedAt(locale = 'zh-CN') {
    return this._formatDateTime(this.updatedAt, locale);
  }

  /**
   * 格式化日期时间
   * @private
   * @param {number} timestamp - 时间戳
   * @param {string} locale - 地区设置
   * @returns {string} 格式化的字符串
   */
  _formatDateTime(timestamp, locale) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // 今天
      return date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays === 1) {
      // 昨天
      return '昨天 ' + date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays < 7) {
      // 本周内
      return date.toLocaleDateString(locale, {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // 更早
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  }

  /**
   * 创建新会话的静态工厂方法
   * @static
   * @param {string} sourceLanguage - 源语言
   * @param {string} targetLanguage - 目标语言
   * @returns {Conversation} 会话实例
   */
  static create(sourceLanguage, targetLanguage) {
    return new Conversation({
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      messages: []
    });
  }

  /**
   * 从普通对象创建会话实例
   * @static
   * @param {Object} obj - 普通对象
   * @returns {Conversation} 会话实例
   */
  static fromObject(obj) {
    // 反序列化消息
    const messages = (obj.messages || []).map(msgObj => 
      Message.fromObject(msgObj)
    );

    return new Conversation({
      id: obj.id,
      title: obj.title,
      sourceLanguage: obj.sourceLanguage,
      targetLanguage: obj.targetLanguage,
      messages: messages,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      isFavorite: obj.isFavorite
    });
  }

  /**
   * 将会话转换为普通对象（用于存储）
   * @returns {Object} 普通对象
   */
  toObject() {
    return {
      id: this.id,
      title: this.title,
      sourceLanguage: this.sourceLanguage,
      targetLanguage: this.targetLanguage,
      messages: this.messages.map(m => m.toObject()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isFavorite: this.isFavorite
    };
  }
}

export default Conversation;
