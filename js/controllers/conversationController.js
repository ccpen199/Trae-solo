/**
 * @fileoverview 对话控制器模块
 * @description 管理对话翻译界面的 UI 状态和交互，协调对话服务和视图
 * @version 1.0.0
 */

import { logger } from '../utils/index.js';
import { APP_CONFIG } from '../config/index.js';
import { conversationService, CONVERSATION_MODES } from '../services/conversationService.js';
import { themeService, THEME_MODES } from '../core/theme.js';
import { storageService } from '../core/storage.js';
import { Message, MESSAGE_ROLES, MESSAGE_STATES } from '../models/message.js';

/**
 * 对话控制器类
 * @class
 * @description 管理对话翻译界面的 UI 交互
 */
export class ConversationController {
  /**
   * @constructor
   */
  constructor() {
    this.logger = logger;
    this.isInitialized = false;
    this._messageContainer = null;
    this._messageInput = null;
    this._sendButton = null;
    this._modeToggle = null;
    this._themeToggle = null;
    this._autoTranslateToggle = null;
  }

  /**
   * 初始化对话控制器
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async initialize() {
    if (this.isInitialized) {
      this.logger.debug('对话控制器已初始化，跳过');
      return true;
    }

    try {
      // 1. 初始化对话服务
      await conversationService.initialize();

      // 2. 初始化主题服务
      await themeService.initialize();

      // 3. 获取 DOM 元素
      this._getDOMElements();

      // 4. 绑定事件监听器
      this._bindEventListeners();

      // 5. 订阅服务事件
      this._subscribeServiceEvents();

      // 6. 渲染初始状态
      this._renderInitialState();

      this.isInitialized = true;
      this.logger.info('对话控制器初始化完成');
      return true;
    } catch (error) {
      this.logger.error('对话控制器初始化失败', error);
      return false;
    }
  }

  /**
   * 获取 DOM 元素
   * @private
   */
  _getDOMElements() {
    // 模式切换
    this._modeToggle = document.getElementById('modeToggle');
    this._standardModeContainer = document.getElementById('standardModeContainer');
    this._conversationModeContainer = document.getElementById('conversationModeContainer');

    // 对话模式元素
    if (this._conversationModeContainer) {
      this._messageContainer = this._conversationModeContainer.querySelector('.conversation__messages');
      this._messageInput = this._conversationModeContainer.querySelector('.conversation__input');
      this._sendButton = this._conversationModeContainer.querySelector('.conversation__send-btn');
      this._conversationSourceLang = this._conversationModeContainer.querySelector('.conversation__lang--source');
      this._conversationTargetLang = this._conversationModeContainer.querySelector('.conversation__lang--target');
      this._conversationSwapBtn = this._conversationModeContainer.querySelector('.conversation__swap-btn');
      this._newConversationBtn = this._conversationModeContainer.querySelector('.conversation__new-btn');
      this._historyPanel = this._conversationModeContainer.querySelector('.history-panel');
      this._historyToggle = this._conversationModeContainer.querySelector('.conversation__history-btn');
    }

    // 标准模式元素（从现有代码获取）
    if (this._standardModeContainer) {
      this._standardSourceLang = this._standardModeContainer.querySelector('#sourceLang');
      this._standardTargetLang = this._standardModeContainer.querySelector('#targetLang');
      this._standardSwapBtn = this._standardModeContainer.querySelector('#swapBtn');
      this._standardSourceText = this._standardModeContainer.querySelector('#sourceText');
      this._standardTargetText = this._standardModeContainer.querySelector('#targetText');
      this._standardTranslateBtn = this._standardModeContainer.querySelector('#translateBtn');
      this._standardMicBtn = this._standardModeContainer.querySelector('#startMicBtn');
      this._standardStopMicBtn = this._standardModeContainer.querySelector('#stopMicBtn');
      this._standardSpeakBtn = this._standardModeContainer.querySelector('#speakTargetBtn');
      this._standardCopyBtn = this._standardModeContainer.querySelector('#copyTargetBtn');
    }

    // 主题切换
    this._themeToggle = document.getElementById('themeToggle');

    // 自动翻译切换
    this._autoTranslateToggle = document.getElementById('autoTranslateToggle');
  }

  /**
   * 绑定事件监听器
   * @private
   */
  _bindEventListeners() {
    // 模式切换
    if (this._modeToggle) {
      this._modeToggle.addEventListener('click', () => this._handleModeToggle());
    }

    // 对话模式事件
    if (this._sendButton) {
      this._sendButton.addEventListener('click', () => this._handleSendMessage());
    }

    if (this._messageInput) {
      this._messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._handleSendMessage();
        }
      });

      // 实时翻译
      this._messageInput.addEventListener('input', () => {
        if (storageService.isAutoTranslateEnabled()) {
          this._handleRealTimeTranslate();
        }
      });
    }

    // 语言选择
    if (this._conversationSwapBtn) {
      this._conversationSwapBtn.addEventListener('click', () => this._handleSwapLanguages());
    }

    if (this._conversationSourceLang) {
      this._conversationSourceLang.addEventListener('change', () => this._handleLanguageChange());
    }

    if (this._conversationTargetLang) {
      this._conversationTargetLang.addEventListener('change', () => this._handleLanguageChange());
    }

    // 新会话按钮
    if (this._newConversationBtn) {
      this._newConversationBtn.addEventListener('click', () => this._handleNewConversation());
    }

    // 历史记录切换
    if (this._historyToggle) {
      this._historyToggle.addEventListener('click', () => this._toggleHistoryPanel());
    }

    // 主题切换
    if (this._themeToggle) {
      this._themeToggle.addEventListener('click', () => this._handleThemeToggle());
    }

    // 自动翻译切换
    if (this._autoTranslateToggle) {
      this._autoTranslateToggle.addEventListener('change', () => this._handleAutoTranslateToggle());
    }
  }

  /**
   * 订阅服务事件
   * @private
   */
  _subscribeServiceEvents() {
    // 模式变化
    conversationService.onModeChange((oldMode, newMode) => {
      this._renderMode(oldMode, newMode);
    });

    // 会话变化
    conversationService.onConversationChange((oldConversation, newConversation) => {
      this._renderConversation(newConversation);
    });

    // 消息变化
    conversationService.onMessageChange((action, message) => {
      if (action === 'add') {
        this._renderMessage(message);
      } else if (action === 'update') {
        this._updateMessage(message);
      }
    });

    // 主题变化
    themeService.onThemeChange((mode, actualMode) => {
      this._renderTheme(mode, actualMode);
    });

    // 实时翻译（标准模式）
    conversationService.onRealTimeTranslate((result) => {
      this._renderRealTimeTranslate(result);
    });
  }

  /**
   * 渲染初始状态
   * @private
   */
  _renderInitialState() {
    // 1. 渲染当前模式
    const currentMode = conversationService.getCurrentMode();
    this._renderMode(null, currentMode);

    // 2. 渲染当前会话
    const currentConversation = conversationService.getCurrentConversation();
    if (currentConversation) {
      this._renderConversation(currentConversation);
    }

    // 3. 渲染主题
    const themeMode = themeService.getCurrentMode();
    this._renderTheme(themeMode, themeService.getActualMode());

    // 4. 渲染自动翻译状态
    if (this._autoTranslateToggle) {
      this._autoTranslateToggle.checked = storageService.isAutoTranslateEnabled();
    }

    // 5. 渲染历史记录列表
    this._renderHistoryList();
  }

  // ==================== 事件处理 ====================

  /**
   * 处理模式切换
   * @private
   */
  _handleModeToggle() {
    const newMode = conversationService.toggleMode();
    this.logger.debug(`模式已切换: ${newMode}`);
  }

  /**
   * 处理发送消息
   * @private
   */
  async _handleSendMessage() {
    if (!this._messageInput) return;

    const content = this._messageInput.value.trim();
    if (!content) return;

    // 清空输入框
    this._messageInput.value = '';

    // 获取语言设置
    const conversation = conversationService.getCurrentConversation();
    if (!conversation) return;

    // 发送消息
    await conversationService.sendMessage(content, {
      sourceLang: conversation.sourceLanguage,
      targetLang: conversation.targetLanguage
    });

    // 滚动到底部
    this._scrollToBottom();
  }

  /**
   * 处理实时翻译
   * @private
   */
  async _handleRealTimeTranslate() {
    if (!this._messageInput) return;

    const content = this._messageInput.value.trim();
    if (!content) return;

    const conversation = conversationService.getCurrentConversation();
    if (!conversation) return;

    // 调用实时翻译
    await conversationService.realTimeTranslate(
      content,
      conversation.sourceLanguage,
      conversation.targetLanguage
    );
  }

  /**
   * 处理交换语言
   * @private
   */
  _handleSwapLanguages() {
    // 交换下拉选择
    if (this._conversationSourceLang && this._conversationTargetLang) {
      const temp = this._conversationSourceLang.value;
      this._conversationSourceLang.value = this._conversationTargetLang.value;
      this._conversationTargetLang.value = temp;
    }

    // 交换会话语言
    conversationService.swapLanguages();

    // 清除输入框
    if (this._messageInput) {
      this._messageInput.value = '';
    }
  }

  /**
   * 处理语言变化
   * @private
   */
  _handleLanguageChange() {
    const conversation = conversationService.getCurrentConversation();
    if (!conversation) return;

    // 更新会话语言
    if (this._conversationSourceLang) {
      conversation.sourceLanguage = this._conversationSourceLang.value;
    }
    if (this._conversationTargetLang) {
      conversation.targetLanguage = this._conversationTargetLang.value;
    }

    // 保存会话
    storageService.saveConversation(conversation);
  }

  /**
   * 处理新会话
   * @private
   */
  async _handleNewConversation() {
    await conversationService.createNewConversation();

    // 清空消息容器
    if (this._messageContainer) {
      this._messageContainer.innerHTML = '';
    }

    // 清空输入框
    if (this._messageInput) {
      this._messageInput.value = '';
    }

    // 更新语言选择
    const conversation = conversationService.getCurrentConversation();
    if (conversation && this._conversationSourceLang && this._conversationTargetLang) {
      this._conversationSourceLang.value = conversation.sourceLanguage;
      this._conversationTargetLang.value = conversation.targetLanguage;
    }

    // 重新渲染历史列表
    this._renderHistoryList();
  }

  /**
   * 切换历史记录面板
   * @private
   */
  _toggleHistoryPanel() {
    if (this._historyPanel) {
      this._historyPanel.classList.toggle('history-panel--open');
    }
  }

  /**
   * 处理主题切换
   * @private
   */
  async _handleThemeToggle() {
    await themeService.toggleTheme();
  }

  /**
   * 处理自动翻译切换
   * @private
   */
  _handleAutoTranslateToggle() {
    if (!this._autoTranslateToggle) return;

    const enabled = this._autoTranslateToggle.checked;
    storageService.setAutoTranslateEnabled(enabled);

    this.logger.debug(`自动翻译已${enabled ? '启用' : '禁用'}`);
  }

  // ==================== 渲染方法 ====================

  /**
   * 渲染模式
   * @private
   * @param {string|null} oldMode - 旧模式
   * @param {string} newMode - 新模式
   */
  _renderMode(oldMode, newMode) {
    // 更新模式切换按钮状态
    if (this._modeToggle) {
      const icon = this._modeToggle.querySelector('.mode-toggle__icon');
      const text = this._modeToggle.querySelector('.mode-toggle__text');

      if (newMode === CONVERSATION_MODES.CONVERSATION) {
        if (icon) icon.textContent = '📝';
        if (text) text.textContent = '标准模式';
      } else {
        if (icon) icon.textContent = '💬';
        if (text) text.textContent = '对话模式';
      }
    }

    // 显示/隐藏容器
    if (this._standardModeContainer && this._conversationModeContainer) {
      if (newMode === CONVERSATION_MODES.CONVERSATION) {
        this._standardModeContainer.style.display = 'none';
        this._conversationModeContainer.style.display = 'flex';
      } else {
        this._standardModeContainer.style.display = 'block';
        this._conversationModeContainer.style.display = 'none';
      }
    }
  }

  /**
   * 渲染会话
   * @private
   * @param {import('../models/conversation').Conversation} conversation - 会话
   */
  _renderConversation(conversation) {
    if (!this._messageContainer) return;

    // 清空容器
    this._messageContainer.innerHTML = '';

    // 渲染所有消息
    for (const message of conversation.messages) {
      this._renderMessage(message, false);
    }

    // 滚动到底部
    this._scrollToBottom();

    // 更新语言选择
    if (this._conversationSourceLang) {
      this._conversationSourceLang.value = conversation.sourceLanguage;
    }
    if (this._conversationTargetLang) {
      this._conversationTargetLang.value = conversation.targetLanguage;
    }
  }

  /**
   * 渲染单条消息
   * @private
   * @param {import('../models/message').Message} message - 消息
   * @param {boolean} [animate=true] - 是否使用动画
   */
  _renderMessage(message, animate = true) {
    if (!this._messageContainer) return;

    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = this._getMessageClass(message);
    messageElement.dataset.messageId = message.id;

    // 消息内容
    const contentElement = document.createElement('div');
    contentElement.className = 'message__content';

    // 加载状态
    if (message.isLoading()) {
      contentElement.innerHTML = `
        <div class="message__loading">
          <div class="message__loading-dot"></div>
          <div class="message__loading-dot"></div>
          <div class="message__loading-dot"></div>
        </div>
      `;
    } else if (message.hasError()) {
      contentElement.innerHTML = `
        <div class="message__error">
          <span class="message__error-icon">⚠️</span>
          <span class="message__error-text">${message.content}</span>
          ${message.errorMessage ? `<span class="message__error-detail">${message.errorMessage}</span>` : ''}
        </div>
      `;
    } else {
      contentElement.textContent = message.content;
    }

    // 消息元信息（时间）
    const metaElement = document.createElement('div');
    metaElement.className = 'message__meta';
    metaElement.textContent = message.getFormattedTime();

    // 组装
    messageElement.appendChild(contentElement);
    messageElement.appendChild(metaElement);

    // 添加到容器
    if (animate) {
      messageElement.style.animation = 'messageSlideIn 0.3s ease';
    }

    this._messageContainer.appendChild(messageElement);

    // 滚动到底部
    if (animate) {
      this._scrollToBottom();
    }
  }

  /**
   * 更新消息
   * @private
   * @param {import('../models/message').Message} message - 消息
   */
  _updateMessage(message) {
    if (!this._messageContainer) return;

    const messageElement = this._messageContainer.querySelector(`[data-message-id="${message.id}"]`);
    if (!messageElement) return;

    // 更新类名
    messageElement.className = this._getMessageClass(message);

    // 更新内容
    const contentElement = messageElement.querySelector('.message__content');
    if (contentElement) {
      if (message.isLoading()) {
        contentElement.innerHTML = `
          <div class="message__loading">
            <div class="message__loading-dot"></div>
            <div class="message__loading-dot"></div>
            <div class="message__loading-dot"></div>
          </div>
        `;
      } else if (message.hasError()) {
        contentElement.innerHTML = `
          <div class="message__error">
            <span class="message__error-icon">⚠️</span>
            <span class="message__error-text">${message.content}</span>
            ${message.errorMessage ? `<span class="message__error-detail">${message.errorMessage}</span>` : ''}
          </div>
        `;
      } else {
        contentElement.textContent = message.content;
      }
    }
  }

  /**
   * 获取消息 CSS 类名
   * @private
   * @param {import('../models/message').Message} message - 消息
   * @returns {string} CSS 类名
   */
  _getMessageClass(message) {
    let className = 'message';

    // 消息类型
    if (message.isUserMessage()) {
      className += ' message--user';
    } else if (message.isTranslatedMessage()) {
      className += ' message--translated';
    } else {
      className += ' message--system';
    }

    // 消息状态
    if (message.isLoading()) {
      className += ' message--loading';
    } else if (message.hasError()) {
      className += ' message--error';
    }

    return className;
  }

  /**
   * 渲染主题
   * @private
   * @param {string} mode - 主题模式
   * @param {string} actualMode - 实际应用的模式
   */
  _renderTheme(mode, actualMode) {
    if (this._themeToggle) {
      const icon = this._themeToggle.querySelector('.theme-toggle__icon');
      const text = this._themeToggle.querySelector('.theme-toggle__text');

      if (actualMode === THEME_MODES.DARK) {
        if (icon) icon.textContent = '☀️';
        if (text) text.textContent = '浅色';
      } else {
        if (icon) icon.textContent = '🌙';
        if (text) text.textContent = '深色';
      }
    }
  }

  /**
   * 渲染实时翻译结果
   * @private
   * @param {Object} result - 翻译结果
   */
  _renderRealTimeTranslate(result) {
    // 标准模式下实时更新目标文本
    if (this._standardTargetText && result.success) {
      this._standardTargetText.value = result.translatedText;
    }
  }

  /**
   * 渲染历史记录列表
   * @private
   */
  _renderHistoryList() {
    if (!this._historyPanel) return;

    const conversations = storageService.getAllConversations();
    const currentConversation = conversationService.getCurrentConversation();

    // 找到或创建列表容器
    let listContainer = this._historyPanel.querySelector('.history-panel__list');
    if (!listContainer) {
      listContainer = document.createElement('div');
      listContainer.className = 'history-panel__list';
      this._historyPanel.appendChild(listContainer);
    }

    // 清空列表
    listContainer.innerHTML = '';

    // 如果没有历史记录
    if (conversations.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'history-panel__empty';
      emptyState.innerHTML = `
        <span class="history-panel__empty-icon">📝</span>
        <span class="history-panel__empty-text">暂无翻译历史</span>
      `;
      listContainer.appendChild(emptyState);
      return;
    }

    // 渲染每个会话
    for (const conversation of conversations) {
      const item = document.createElement('div');
      item.className = 'history-item';
      
      // 标记当前会话
      if (currentConversation && conversation.id === currentConversation.id) {
        item.classList.add('history-item--active');
      }

      // 会话标题
      const title = document.createElement('div');
      title.className = 'history-item__title';
      title.textContent = conversation.title || '新会话';

      // 会话信息
      const info = document.createElement('div');
      info.className = 'history-item__info';
      info.textContent = `${conversation.sourceLanguage} → ${conversation.targetLanguage} · ${conversation.getMessageCount()} 条消息 · ${conversation.getFormattedUpdatedAt()}`;

      // 点击切换会话
      item.addEventListener('click', () => {
        conversationService.setCurrentConversation(conversation.id);
        this._toggleHistoryPanel();
      });

      item.appendChild(title);
      item.appendChild(info);
      listContainer.appendChild(item);
    }
  }

  /**
   * 滚动到消息容器底部
   * @private
   */
  _scrollToBottom() {
    if (this._messageContainer) {
      setTimeout(() => {
        this._messageContainer.scrollTop = this._messageContainer.scrollHeight;
      }, 100);
    }
  }
}

/**
 * 对话控制器单例实例
 * @type {ConversationController}
 */
export const conversationController = new ConversationController();

export default ConversationController;
