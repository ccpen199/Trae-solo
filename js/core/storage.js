/**
 * @fileoverview 本地存储服务
 * @description 封装 localStorage 操作，提供翻译历史、用户偏好、会话记录的持久化存储
 * @version 1.0.0
 */

import { logger, safeJsonParse } from '../utils/index.js';
import { Conversation } from '../models/conversation.js';

/**
 * 存储键名常量
 * @readonly
 * @enum {string}
 */
const STORAGE_KEYS = {
  /** 翻译历史记录 */
  TRANSLATION_HISTORY: 'translate_history',
  /** 会话记录列表 */
  CONVERSATIONS: 'translate_conversations',
  /** 当前活跃的会话 ID */
  ACTIVE_CONVERSATION_ID: 'translate_active_conversation_id',
  /** 用户偏好设置 */
  USER_PREFERENCES: 'translate_preferences',
  /** 默认源语言 */
  DEFAULT_SOURCE_LANG: 'translate_default_source_lang',
  /** 默认目标语言 */
  DEFAULT_TARGET_LANG: 'translate_default_target_lang',
  /** 主题模式（light/dark） */
  THEME_MODE: 'translate_theme_mode',
  /** 音效开关 */
  SOUND_ENABLED: 'translate_sound_enabled',
  /** 自动翻译开关 */
  AUTO_TRANSLATE_ENABLED: 'translate_auto_translate'
};

/**
 * 存储配额常量（字节）
 * @readonly
 * @enum {number}
 */
const STORAGE_QUOTAS = {
  /** 单条历史记录最大大小 */
  MAX_HISTORY_ITEM_SIZE: 10 * 1024, // 10KB
  /** 历史记录最大数量 */
  MAX_HISTORY_COUNT: 100,
  /** 会话记录最大数量 */
  MAX_CONVERSATION_COUNT: 50,
  /** 单条会话最大大小 */
  MAX_CONVERSATION_SIZE: 50 * 1024 // 50KB
};

/**
 * 本地存储服务类
 * @class
 * @description 封装 localStorage 的所有操作，提供类型安全的存储和读取
 */
export class StorageService {
  /**
   * @constructor
   */
  constructor() {
    this.logger = logger;
    this.isAvailable = this._checkAvailability();
    
    if (!this.isAvailable) {
      this.logger.warn('LocalStorage 不可用，将使用内存存储作为备选');
      this._memoryStore = new Map();
    }
  }

  /**
   * 检查 localStorage 是否可用
   * @private
   * @returns {boolean} 是否可用
   */
  _checkAvailability() {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      this.logger.error('LocalStorage 检查失败', error);
      return false;
    }
  }

  /**
   * 存储数据
   * @private
   * @param {string} key - 存储键名
   * @param {*} value - 要存储的值（将被序列化）
   * @returns {boolean} 是否存储成功
   */
  _setItem(key, value) {
    try {
      const serialized = JSON.stringify(value);
      
      if (this.isAvailable) {
        window.localStorage.setItem(key, serialized);
      } else {
        this._memoryStore.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`存储数据失败 (key: ${key})`, error);
      
      // 检查是否是配额不足
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || 
           error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        this.logger.warn('存储配额不足，尝试清理旧数据');
        this._cleanupOldData();
        
        // 重试一次
        try {
          const serialized = JSON.stringify(value);
          if (this.isAvailable) {
            window.localStorage.setItem(key, serialized);
          } else {
            this._memoryStore.set(key, serialized);
          }
          return true;
        } catch (retryError) {
          this.logger.error('重试存储失败', retryError);
        }
      }
      
      return false;
    }
  }

  /**
   * 读取数据
   * @private
   * @param {string} key - 存储键名
   * @param {*} [defaultValue=null] - 默认值
   * @returns {*} 解析后的值或默认值
   */
  _getItem(key, defaultValue = null) {
    try {
      let serialized;
      
      if (this.isAvailable) {
        serialized = window.localStorage.getItem(key);
      } else {
        serialized = this._memoryStore.get(key);
      }
      
      if (serialized === null || serialized === undefined) {
        return defaultValue;
      }
      
      return safeJsonParse(serialized, defaultValue);
    } catch (error) {
      this.logger.error(`读取数据失败 (key: ${key})`, error);
      return defaultValue;
    }
  }

  /**
   * 删除数据
   * @private
   * @param {string} key - 存储键名
   * @returns {boolean} 是否删除成功
   */
  _removeItem(key) {
    try {
      if (this.isAvailable) {
        window.localStorage.removeItem(key);
      } else {
        this._memoryStore.delete(key);
      }
      return true;
    } catch (error) {
      this.logger.error(`删除数据失败 (key: ${key})`, error);
      return false;
    }
  }

  /**
   * 清理旧数据（当配额不足时）
   * @private
   */
  _cleanupOldData() {
    // 清理历史记录，保留最新的 50 条
    const history = this.getTranslationHistory();
    if (history.length > 50) {
      const trimmedHistory = history.slice(-50);
      this._setItem(STORAGE_KEYS.TRANSLATION_HISTORY, trimmedHistory);
      this.logger.info(`已清理历史记录: ${history.length} -> 50`);
    }

    // 清理会话记录，保留最新的 20 条
    const conversations = this.getAllConversations();
    if (conversations.length > 20) {
      // 按更新时间排序，保留最新的 20 条
      const sorted = conversations.sort((a, b) => b.updatedAt - a.updatedAt);
      const trimmed = sorted.slice(0, 20);
      this._setItem(STORAGE_KEYS.CONVERSATIONS, trimmed.map(c => c.toObject()));
      this.logger.info(`已清理会话记录: ${conversations.length} -> 20`);
    }
  }

  // ==================== 翻译历史记录 ====================

  /**
   * 翻译历史记录项
   * @typedef {Object} TranslationHistoryItem
   * @property {string} id - 唯一标识
   * @property {string} sourceText - 源文本
   * @property {string} targetText - 目标文本
   * @property {string} sourceLang - 源语言
   * @property {string} targetLang - 目标语言
   * @property {number} timestamp - 时间戳
   * @property {boolean} [isFavorite] - 是否收藏
   */

  /**
   * 获取所有翻译历史
   * @returns {TranslationHistoryItem[]} 历史记录数组
   */
  getTranslationHistory() {
    return this._getItem(STORAGE_KEYS.TRANSLATION_HISTORY, []);
  }

  /**
   * 添加翻译历史记录
   * @param {TranslationHistoryItem} item - 历史记录项
   * @returns {boolean} 是否添加成功
   */
  addTranslationHistory(item) {
    const history = this.getTranslationHistory();
    
    // 检查是否存在相同的记录（可选）
    // const exists = history.some(h => 
    //   h.sourceText === item.sourceText && 
    //   h.sourceLang === item.sourceLang && 
    //   h.targetLang === item.targetLang
    // );
    // 
    // if (exists) {
    //   this.logger.debug('相同的翻译记录已存在，跳过');
    //   return true;
    // }
    
    // 添加到历史
    history.push({
      id: item.id || Date.now().toString(36),
      sourceText: item.sourceText,
      targetText: item.targetText,
      sourceLang: item.sourceLang,
      targetLang: item.targetLang,
      timestamp: item.timestamp || Date.now(),
      isFavorite: item.isFavorite || false
    });

    // 限制数量
    if (history.length > STORAGE_QUOTAS.MAX_HISTORY_COUNT) {
      history.shift();
    }

    return this._setItem(STORAGE_KEYS.TRANSLATION_HISTORY, history);
  }

  /**
   * 删除单条历史记录
   * @param {string} id - 记录 ID
   * @returns {boolean} 是否删除成功
   */
  removeTranslationHistory(id) {
    const history = this.getTranslationHistory();
    const index = history.findIndex(item => item.id === id);
    
    if (index === -1) {
      return false;
    }

    history.splice(index, 1);
    return this._setItem(STORAGE_KEYS.TRANSLATION_HISTORY, history);
  }

  /**
   * 清空所有历史记录
   * @returns {boolean} 是否清空成功
   */
  clearTranslationHistory() {
    return this._removeItem(STORAGE_KEYS.TRANSLATION_HISTORY);
  }

  /**
   * 搜索历史记录
   * @param {string} query - 搜索关键词
   * @returns {TranslationHistoryItem[]} 匹配的记录
   */
  searchTranslationHistory(query) {
    if (!query || query.trim() === '') {
      return this.getTranslationHistory();
    }

    const keyword = query.toLowerCase().trim();
    const history = this.getTranslationHistory();
    
    return history.filter(item => 
      item.sourceText.toLowerCase().includes(keyword) ||
      item.targetText.toLowerCase().includes(keyword)
    );
  }

  // ==================== 会话记录 ====================

  /**
   * 获取所有会话记录
   * @returns {Conversation[]} 会话数组
   */
  getAllConversations() {
    const rawConversations = this._getItem(STORAGE_KEYS.CONVERSATIONS, []);
    return rawConversations.map(obj => Conversation.fromObject(obj));
  }

  /**
   * 保存会话记录
   * @param {Conversation} conversation - 会话实例
   * @returns {boolean} 是否保存成功
   */
  saveConversation(conversation) {
    const conversations = this.getAllConversations();
    const index = conversations.findIndex(c => c.id === conversation.id);

    if (index === -1) {
      // 新增会话
      conversations.unshift(conversation);
      
      // 限制数量
      if (conversations.length > STORAGE_QUOTAS.MAX_CONVERSATION_COUNT) {
        conversations.pop();
      }
    } else {
      // 更新已有会话
      conversations[index] = conversation;
    }

    // 序列化并保存
    const serialized = conversations.map(c => c.toObject());
    return this._setItem(STORAGE_KEYS.CONVERSATIONS, serialized);
  }

  /**
   * 获取单个会话
   * @param {string} id - 会话 ID
   * @returns {Conversation|undefined} 会话实例
   */
  getConversation(id) {
    const conversations = this.getAllConversations();
    return conversations.find(c => c.id === id);
  }

  /**
   * 删除会话
   * @param {string} id - 会话 ID
   * @returns {boolean} 是否删除成功
   */
  deleteConversation(id) {
    const conversations = this.getAllConversations();
    const index = conversations.findIndex(c => c.id === id);

    if (index === -1) {
      return false;
    }

    conversations.splice(index, 1);
    
    const serialized = conversations.map(c => c.toObject());
    return this._setItem(STORAGE_KEYS.CONVERSATIONS, serialized);
  }

  /**
   * 获取当前活跃的会话 ID
   * @returns {string|null} 会话 ID
   */
  getActiveConversationId() {
    return this._getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, null);
  }

  /**
   * 设置当前活跃的会话 ID
   * @param {string} id - 会话 ID
   * @returns {boolean} 是否设置成功
   */
  setActiveConversationId(id) {
    return this._setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, id);
  }

  /**
   * 清空所有会话
   * @returns {boolean} 是否清空成功
   */
  clearAllConversations() {
    this._removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    return this._removeItem(STORAGE_KEYS.CONVERSATIONS);
  }

  // ==================== 用户偏好设置 ====================

  /**
   * 用户偏好设置
   * @typedef {Object} UserPreferences
   * @property {string} [defaultSourceLang] - 默认源语言
   * @property {string} [defaultTargetLang] - 默认目标语言
   * @property {string} [themeMode] - 主题模式
   * @property {boolean} [soundEnabled] - 音效开关
   * @property {boolean} [autoTranslate] - 自动翻译开关
   */

  /**
   * 获取用户偏好设置
   * @returns {UserPreferences} 偏好设置对象
   */
  getUserPreferences() {
    return this._getItem(STORAGE_KEYS.USER_PREFERENCES, {});
  }

  /**
   * 设置用户偏好设置
   * @param {UserPreferences} preferences - 偏好设置
   * @returns {boolean} 是否设置成功
   */
  setUserPreferences(preferences) {
    const current = this.getUserPreferences();
    const updated = { ...current, ...preferences };
    return this._setItem(STORAGE_KEYS.USER_PREFERENCES, updated);
  }

  /**
   * 获取单个偏好设置
   * @param {string} key - 设置键名
   * @param {*} [defaultValue] - 默认值
   * @returns {*} 设置值
   */
  getPreference(key, defaultValue) {
    const preferences = this.getUserPreferences();
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
  }

  /**
   * 设置单个偏好设置
   * @param {string} key - 设置键名
   * @param {*} value - 设置值
   * @returns {boolean} 是否设置成功
   */
  setPreference(key, value) {
    const preferences = this.getUserPreferences();
    preferences[key] = value;
    return this._setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
  }

  // ==================== 快捷方法 ====================

  /**
   * 获取主题模式
   * @returns {string} 'light' | 'dark'
   */
  getThemeMode() {
    return this.getPreference('themeMode', 'light');
  }

  /**
   * 设置主题模式
   * @param {string} mode - 'light' | 'dark'
   * @returns {boolean} 是否设置成功
   */
  setThemeMode(mode) {
    return this.setPreference('themeMode', mode);
  }

  /**
   * 获取默认源语言
   * @returns {string} 语言代码
   */
  getDefaultSourceLang() {
    return this.getPreference('defaultSourceLang', 'zh-CN');
  }

  /**
   * 设置默认源语言
   * @param {string} lang - 语言代码
   * @returns {boolean} 是否设置成功
   */
  setDefaultSourceLang(lang) {
    return this.setPreference('defaultSourceLang', lang);
  }

  /**
   * 获取默认目标语言
   * @returns {string} 语言代码
   */
  getDefaultTargetLang() {
    return this.getPreference('defaultTargetLang', 'en-US');
  }

  /**
   * 设置默认目标语言
   * @param {string} lang - 语言代码
   * @returns {boolean} 是否设置成功
   */
  setDefaultTargetLang(lang) {
    return this.setPreference('defaultTargetLang', lang);
  }

  /**
   * 检查自动翻译是否启用
   * @returns {boolean} 是否启用
   */
  isAutoTranslateEnabled() {
    return this.getPreference('autoTranslate', true);
  }

  /**
   * 设置自动翻译
   * @param {boolean} enabled - 是否启用
   * @returns {boolean} 是否设置成功
   */
  setAutoTranslateEnabled(enabled) {
    return this.setPreference('autoTranslate', enabled);
  }

  // ==================== 通用存储方法 ====================

  /**
   * 获取存储值（通用方法）
   * @param {string} key - 存储键名
   * @param {*} [defaultValue=null] - 默认值
   * @returns {*} 存储值或默认值
   */
  get(key, defaultValue = null) {
    return this._getItem(key, defaultValue);
  }

  /**
   * 设置存储值（通用方法）
   * @param {string} key - 存储键名
   * @param {*} value - 要存储的值
   * @returns {boolean} 是否设置成功
   */
  set(key, value) {
    return this._setItem(key, value);
  }

  /**
   * 删除存储值（通用方法）
   * @param {string} key - 存储键名
   * @returns {boolean} 是否删除成功
   */
  remove(key) {
    return this._removeItem(key);
  }

  // ==================== 存储统计 ====================

  /**
   * 获取存储使用情况
   * @returns {Object} 使用情况统计
   */
  getStorageUsage() {
    if (!this.isAvailable) {
      return {
        available: false,
        totalItems: this._memoryStore.size
      };
    }

    const history = this.getTranslationHistory();
    const conversations = this.getAllConversations();

    return {
      available: true,
      historyCount: history.length,
      conversationCount: conversations.length,
      maxHistoryCount: STORAGE_QUOTAS.MAX_HISTORY_COUNT,
      maxConversationCount: STORAGE_QUOTAS.MAX_CONVERSATION_COUNT
    };
  }

  /**
   * 清空所有数据（谨慎使用）
   * @returns {boolean} 是否清空成功
   */
  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        this._removeItem(key);
      });
      this.logger.info('已清空所有存储数据');
      return true;
    } catch (error) {
      this.logger.error('清空存储数据失败', error);
      return false;
    }
  }
}

/**
 * 本地存储服务单例实例
 * @type {StorageService}
 */
export const storageService = new StorageService();

export default StorageService;
