/**
 * @fileoverview 对话服务模块
 * @description 管理对话翻译的业务逻辑，包括会话管理、消息处理、实时翻译等
 * @version 1.0.0
 */

import { logger, debounce } from '../utils/index.js';
import { APP_CONFIG } from '../config/index.js';
import { Conversation } from '../models/conversation.js';
import { Message, MESSAGE_ROLES, MESSAGE_STATES } from '../models/message.js';
import { storageService } from '../core/storage.js';
import { translationService } from './translationService.js';
import { languageDetectionService } from './languageDetectionService.js';

/**
 * 对话模式枚举
 * @readonly
 * @enum {string}
 */
export const CONVERSATION_MODES = {
  /** 标准翻译模式（单条翻译） */
  STANDARD: 'standard',
  /** 对话翻译模式（来回翻译） */
  CONVERSATION: 'conversation'
};

/**
 * 实时翻译防抖延迟（毫秒）
 * @type {number}
 */
const REAL_TIME_TRANSLATE_DELAY = 500;

/**
 * 对话服务类
 * @class
 * @description 管理对话翻译的完整业务流程
 */
export class ConversationService {
  /**
   * @constructor
   */
  constructor() {
    this.logger = logger;
    this.currentConversation = null;
    this.currentMode = CONVERSATION_MODES.STANDARD;
    this._modeChangeListeners = new Set();
    this._conversationChangeListeners = new Set();
    this._messageListeners = new Set();
    this._realTimeTranslateListeners = new Set();

    // 创建防抖的实时翻译函数
    this._debouncedRealTimeTranslate = debounce(
      this._executeRealTimeTranslate.bind(this),
      REAL_TIME_TRANSLATE_DELAY
    );
  }

  /**
   * 初始化对话服务
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async initialize() {
    try {
      // 1. 恢复上次的模式
      const savedMode = storageService.getPreference('conversationMode', CONVERSATION_MODES.STANDARD);
      this.currentMode = savedMode;

      // 2. 恢复上次活跃的会话
      const activeConversationId = storageService.getActiveConversationId();
      if (activeConversationId) {
        const conversation = storageService.getConversation(activeConversationId);
        if (conversation) {
          this.currentConversation = conversation;
          this.logger.info(`已恢复上次的会话: ${conversation.id}`);
        }
      }

      // 3. 如果没有活跃会话，创建一个新的
      if (!this.currentConversation) {
        await this.createNewConversation();
      }

      this.logger.info(`对话服务初始化完成，当前模式: ${this.currentMode}`);
      return true;
    } catch (error) {
      this.logger.error('对话服务初始化失败', error);
      // 创建默认会话
      await this.createNewConversation();
      return false;
    }
  }

  // ==================== 模式管理 ====================

  /**
   * 获取当前模式
   * @returns {string} 当前模式
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * 设置模式
   * @param {string} mode - 模式 ('standard' | 'conversation')
   * @returns {boolean} 是否设置成功
   */
  setMode(mode) {
    if (!Object.values(CONVERSATION_MODES).includes(mode)) {
      this.logger.warn(`无效的对话模式: ${mode}`);
      return false;
    }

    if (this.currentMode === mode) {
      this.logger.debug('模式未变化，跳过');
      return true;
    }

    const oldMode = this.currentMode;
    this.currentMode = mode;

    // 保存到存储
    storageService.setPreference('conversationMode', mode);

    // 通知监听器
    this._notifyModeChange(oldMode, mode);

    this.logger.info(`对话模式已切换: ${oldMode} -> ${mode}`);
    return true;
  }

  /**
   * 切换模式（在 standard 和 conversation 之间切换）
   * @returns {string} 新的模式
   */
  toggleMode() {
    const newMode = this.currentMode === CONVERSATION_MODES.STANDARD 
      ? CONVERSATION_MODES.CONVERSATION 
      : CONVERSATION_MODES.STANDARD;
    
    this.setMode(newMode);
    return newMode;
  }

  /**
   * 检查是否为对话模式
   * @returns {boolean} 是否为对话模式
   */
  isConversationMode() {
    return this.currentMode === CONVERSATION_MODES.CONVERSATION;
  }

  /**
   * 检查是否为标准模式
   * @returns {boolean} 是否为标准模式
   */
  isStandardMode() {
    return this.currentMode === CONVERSATION_MODES.STANDARD;
  }

  // ==================== 会话管理 ====================

  /**
   * 创建新会话
   * @param {string} [sourceLang] - 源语言
   * @param {string} [targetLang] - 目标语言
   * @returns {Promise<Conversation>} 新会话
   */
  async createNewConversation(sourceLang, targetLang) {
    // 使用默认语言（如果未提供）
    const defaultSource = sourceLang || storageService.getDefaultSourceLang();
    const defaultTarget = targetLang || storageService.getDefaultTargetLang();

    // 创建新会话
    const conversation = Conversation.create(defaultSource, defaultTarget);
    
    // 保存到存储
    storageService.saveConversation(conversation);
    
    // 设置为当前会话
    this.currentConversation = conversation;
    storageService.setActiveConversationId(conversation.id);

    // 通知监听器
    this._notifyConversationChange(null, conversation);

    this.logger.info(`已创建新会话: ${conversation.id}`);
    return conversation;
  }

  /**
   * 获取当前会话
   * @returns {Conversation|null} 当前会话
   */
  getCurrentConversation() {
    return this.currentConversation;
  }

  /**
   * 设置当前会话
   * @param {string} conversationId - 会话 ID
   * @returns {boolean} 是否设置成功
   */
  setCurrentConversation(conversationId) {
    const conversation = storageService.getConversation(conversationId);
    
    if (!conversation) {
      this.logger.warn(`会话不存在: ${conversationId}`);
      return false;
    }

    const oldConversation = this.currentConversation;
    this.currentConversation = conversation;
    storageService.setActiveConversationId(conversationId);

    // 通知监听器
    this._notifyConversationChange(oldConversation, conversation);

    this.logger.info(`已切换到会话: ${conversationId}`);
    return true;
  }

  /**
   * 获取所有会话
   * @returns {Conversation[]} 会话列表
   */
  getAllConversations() {
    return storageService.getAllConversations();
  }

  /**
   * 删除会话
   * @param {string} conversationId - 会话 ID
   * @returns {boolean} 是否删除成功
   */
  deleteConversation(conversationId) {
    // 如果删除的是当前会话，创建新的
    if (this.currentConversation && this.currentConversation.id === conversationId) {
      this.createNewConversation();
    }

    return storageService.deleteConversation(conversationId);
  }

  /**
   * 清空所有会话
   * @returns {boolean} 是否清空成功
   */
  clearAllConversations() {
    const result = storageService.clearAllConversations();
    
    // 创建新会话
    if (result) {
      this.createNewConversation();
    }

    return result;
  }

  // ==================== 消息管理 ====================

  /**
   * 发送消息（用于对话模式）
   * @param {string} content - 消息内容
   * @param {Object} [options] - 选项
   * @param {string} [options.sourceLang] - 源语言（默认为会话源语言）
   * @param {string} [options.targetLang] - 目标语言（默认为会话目标语言）
   * @param {boolean} [options.autoTranslate=true] - 是否自动翻译
   * @returns {Promise<Message>} 用户消息
   */
  async sendMessage(content, options = {}) {
    if (!this.currentConversation) {
      await this.createNewConversation();
    }

    const {
      sourceLang = this.currentConversation.sourceLanguage,
      targetLang = this.currentConversation.targetLanguage,
      autoTranslate = true
    } = options;

    // 1. 创建用户消息
    const userMessage = Message.createUserMessage(content, sourceLang);
    this.currentConversation.addMessage(userMessage);

    // 通知监听器
    this._notifyMessageChange('add', userMessage);

    this.logger.debug(`已添加用户消息: ${content.substring(0, 50)}...`);

    // 2. 如果需要自动翻译
    if (autoTranslate) {
      // 创建加载中的翻译消息
      const loadingMessage = Message.createLoadingMessage(
        '正在翻译...',
        targetLang,
        MESSAGE_STATES.TRANSLATING
      );
      loadingMessage.sourceContent = content;
      loadingMessage.sourceLanguage = sourceLang;
      loadingMessage.targetLanguage = targetLang;
      
      this.currentConversation.addMessage(loadingMessage);
      this._notifyMessageChange('add', loadingMessage);

      // 保存会话（此时包含加载消息）
      storageService.saveConversation(this.currentConversation);

      try {
        // 执行翻译
        const translatedContent = await translationService.translate(
          content,
          sourceLang,
          targetLang
        );

        // 更新消息
        this.currentConversation.updateMessage(loadingMessage.id, {
          content: translatedContent,
          state: MESSAGE_STATES.COMPLETED
        });

        const updatedMessage = this.currentConversation.getMessageById(loadingMessage.id);
        this._notifyMessageChange('update', updatedMessage);

        this.logger.debug(`翻译完成: ${translatedContent.substring(0, 50)}...`);
      } catch (error) {
        this.logger.error('翻译失败', error);
        
        // 更新为错误状态
        this.currentConversation.updateMessage(loadingMessage.id, {
          content: '翻译失败',
          state: MESSAGE_STATES.ERROR,
          errorMessage: error.message
        });

        const errorMessage = this.currentConversation.getMessageById(loadingMessage.id);
        this._notifyMessageChange('update', errorMessage);
      }
    }

    // 保存会话
    storageService.saveConversation(this.currentConversation);

    return userMessage;
  }

  /**
   * 实时翻译（用于标准模式）
   * @param {string} content - 源文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @returns {Promise<void>}
   */
  async realTimeTranslate(content, sourceLang, targetLang) {
    if (!content || content.trim().length === 0) {
      return;
    }

    // 使用防抖处理
    this._debouncedRealTimeTranslate(content, sourceLang, targetLang);
  }

  /**
   * 执行实时翻译
   * @private
   * @param {string} content - 源文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   */
  async _executeRealTimeTranslate(content, sourceLang, targetLang) {
    this.logger.debug(`执行实时翻译: ${sourceLang} -> ${targetLang}`);

    try {
      const translatedContent = await translationService.translate(
        content,
        sourceLang,
        targetLang
      );

      // 通知实时翻译结果
      this._notifyRealTimeTranslate({
        sourceText: content,
        translatedText: translatedContent,
        sourceLang: sourceLang,
        targetLang: targetLang,
        success: true
      });
    } catch (error) {
      this.logger.error('实时翻译失败', error);
      
      this._notifyRealTimeTranslate({
        sourceText: content,
        translatedText: '',
        sourceLang: sourceLang,
        targetLang: targetLang,
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 执行标准翻译（一次性翻译）
   * @param {string} sourceText - 源文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @returns {Promise<string>} 翻译结果
   */
  async executeStandardTranslation(sourceText, sourceLang, targetLang) {
    const translatedText = await translationService.translate(
      sourceText,
      sourceLang,
      targetLang
    );

    // 保存到历史记录
    storageService.addTranslationHistory({
      sourceText: sourceText,
      targetText: translatedText,
      sourceLang: sourceLang,
      targetLang: targetLang
    });

    return translatedText;
  }

  /**
   * 交换会话语言
   * @returns {boolean} 是否交换成功
   */
  swapLanguages() {
    if (!this.currentConversation) {
      return false;
    }

    this.currentConversation.swapLanguages();
    storageService.saveConversation(this.currentConversation);

    this.logger.info(`会话语言已交换: ${this.currentConversation.sourceLanguage} <-> ${this.currentConversation.targetLanguage}`);
    return true;
  }

  /**
   * 检测文本语言
   * @param {string} text - 文本
   * @returns {Promise<import('./languageDetectionService').LanguageDetectionResult>} 检测结果
   */
  async detectLanguage(text) {
    return languageDetectionService.detect(text);
  }

  // ==================== 事件监听 ====================

  /**
   * 订阅模式变化事件
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  onModeChange(callback) {
    this._modeChangeListeners.add(callback);
    return () => this._modeChangeListeners.delete(callback);
  }

  /**
   * 订阅会话变化事件
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  onConversationChange(callback) {
    this._conversationChangeListeners.add(callback);
    return () => this._conversationChangeListeners.delete(callback);
  }

  /**
   * 订阅消息变化事件
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  onMessageChange(callback) {
    this._messageListeners.add(callback);
    return () => this._messageListeners.delete(callback);
  }

  /**
   * 订阅实时翻译事件
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  onRealTimeTranslate(callback) {
    this._realTimeTranslateListeners.add(callback);
    return () => this._realTimeTranslateListeners.delete(callback);
  }

  /**
   * 通知模式变化
   * @private
   * @param {string} oldMode - 旧模式
   * @param {string} newMode - 新模式
   */
  _notifyModeChange(oldMode, newMode) {
    this._modeChangeListeners.forEach(callback => {
      try {
        callback(oldMode, newMode);
      } catch (error) {
        this.logger.error('模式变化回调执行失败', error);
      }
    });
  }

  /**
   * 通知会话变化
   * @private
   * @param {Conversation|null} oldConversation - 旧会话
   * @param {Conversation} newConversation - 新会话
   */
  _notifyConversationChange(oldConversation, newConversation) {
    this._conversationChangeListeners.forEach(callback => {
      try {
        callback(oldConversation, newConversation);
      } catch (error) {
        this.logger.error('会话变化回调执行失败', error);
      }
    });
  }

  /**
   * 通知消息变化
   * @private
   * @param {string} action - 操作类型 ('add' | 'update' | 'remove')
   * @param {Message} message - 消息
   */
  _notifyMessageChange(action, message) {
    this._messageListeners.forEach(callback => {
      try {
        callback(action, message);
      } catch (error) {
        this.logger.error('消息变化回调执行失败', error);
      }
    });
  }

  /**
   * 通知实时翻译结果
   * @private
   * @param {Object} result - 翻译结果
   */
  _notifyRealTimeTranslate(result) {
    this._realTimeTranslateListeners.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        this.logger.error('实时翻译回调执行失败', error);
      }
    });
  }
}

/**
 * 对话服务单例实例
 * @type {ConversationService}
 */
export const conversationService = new ConversationService();

export default ConversationService;
