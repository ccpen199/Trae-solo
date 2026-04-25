/**
 * @fileoverview 应用入口模块
 * @description 应用的主入口文件，负责初始化所有模块和绑定事件
 * @version 2.0.0
 */

import { APP_CONFIG } from './config/index.js';
import { logger } from './utils/index.js';
import { 
  DOM_REFS, 
  validateDOMElements, 
  initializeLanguageSelectors,
  addEventListener
} from './core/dom.js';
import { uiController } from './controllers/uiController.js';
import { conversationController } from './controllers/conversationController.js';
import { themeService, THEME_MODES } from './core/theme.js';
import { storageService } from './core/storage.js';
import { conversationService, CONVERSATION_MODES } from './services/conversationService.js';

/**
 * 应用类
 * @class
 * @description 应用的主控制器，负责初始化和协调所有模块
 */
class TranslateApp {
  /**
   * @constructor
   */
  constructor() {
    this.logger = logger;
    this.isInitialized = false;
    this._currentMode = 'standard'; // 'standard' | 'conversation'
  }

  /**
   * 初始化应用
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async initialize() {
    this.logger.info('=== 多语言语音翻译应用启动 ===');

    try {
      // 1. 验证 DOM 元素
      this.logger.debug('验证 DOM 元素...');
      if (!validateDOMElements()) {
        this.logger.warn('部分 DOM 元素验证失败，继续初始化核心模块');
      }
      this.logger.debug('DOM 元素验证完成');

      // 2. 初始化语言选择器
      this.logger.debug('初始化语言选择器...');
      initializeLanguageSelectors();
      this.logger.debug('语言选择器初始化完成');

      // 3. 初始化主题服务（需要尽早初始化，避免闪烁）
      this.logger.debug('初始化主题服务...');
      await themeService.initialize();
      this.logger.debug('主题服务初始化完成');

      // 4. 初始化存储服务
      this.logger.debug('初始化存储服务...');
      // 存储服务已在其他服务中初始化
      this.logger.debug('存储服务初始化完成');

      // 5. 初始化对话服务
      this.logger.debug('初始化对话服务...');
      await conversationService.initialize();
      this.logger.debug('对话服务初始化完成');

      // 6. 初始化 UI 控制器
      this.logger.debug('初始化 UI 控制器...');
      uiController.initialize();
      this.logger.debug('UI 控制器初始化完成');

      // 7. 初始化对话控制器
      this.logger.debug('初始化对话控制器...');
      await conversationController.initialize();
      this.logger.debug('对话控制器初始化完成');

      // 8. 绑定全局事件处理
      this.logger.debug('绑定全局事件处理...');
      this.bindGlobalEventHandlers();
      this.logger.debug('全局事件处理绑定完成');

      // 9. 初始化模式状态
      this.logger.debug('初始化模式状态...');
      this._initializeMode();
      this.logger.debug('模式状态初始化完成');

      // 10. 初始化历史记录面板
      this.logger.debug('初始化历史记录面板...');
      this._initializeHistoryPanel();
      this.logger.debug('历史记录面板初始化完成');

      // 11. 初始化主题菜单
      this.logger.debug('初始化主题菜单...');
      this._initializeThemeMenu();
      this.logger.debug('主题菜单初始化完成');

      // 12. 订阅实时翻译事件
      this.logger.debug('订阅实时翻译事件...');
      this._subscribeRealTimeTranslate();
      this.logger.debug('实时翻译事件订阅完成');

      this.isInitialized = true;
      this.logger.info('=== 应用初始化成功 ===');

      return true;
    } catch (error) {
      this.logger.error('应用初始化失败:', error);
      
      try {
        uiController.showStatus(
          `应用初始化失败: ${error.message}`,
          APP_CONFIG.status.types.ERROR
        );
      } catch (e) {
        // 忽略显示错误
      }

      return false;
    }
  }

  /**
   * 初始化模式状态
   * @private
   */
  _initializeMode() {
    // 获取保存的模式
    const savedMode = storageService.get('ui_mode') || 'standard';
    this._currentMode = savedMode;

    // 更新 UI
    this._renderMode(savedMode);

    // 更新会话服务模式
    const conversationMode = savedMode === 'conversation' 
      ? CONVERSATION_MODES.CONVERSATION 
      : CONVERSATION_MODES.STANDARD;
    conversationService.setMode(conversationMode);
  }

  /**
   * 初始化历史记录面板
   * @private
   */
  _initializeHistoryPanel() {
    const historyBtn = document.getElementById('historyBtn');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const historyPanel = document.getElementById('historyPanel');
    const historyOverlay = document.getElementById('historyOverlay');
    const historySearch = document.getElementById('historySearch');
    const tabButtons = document.querySelectorAll('.history-panel__tab');
    const exportBtn = document.getElementById('exportHistoryBtn');
    const clearAllBtn = document.getElementById('clearAllHistoryBtn');

    // 打开历史记录
    if (historyBtn) {
      addEventListener(historyBtn, 'click', () => {
        this._toggleHistoryPanel(true);
        this._refreshHistoryList();
      });
    }

    // 关闭历史记录
    if (closeHistoryBtn) {
      addEventListener(closeHistoryBtn, 'click', () => {
        this._toggleHistoryPanel(false);
      });
    }

    // 点击遮罩层关闭
    if (historyOverlay) {
      addEventListener(historyOverlay, 'click', () => {
        this._toggleHistoryPanel(false);
      });
    }

    // 搜索历史
    if (historySearch) {
      addEventListener(historySearch, 'input', (e) => {
        this._filterHistory(e.target.value);
      });
    }

    // 标签切换
    tabButtons.forEach(tab => {
      addEventListener(tab, 'click', () => {
        const tabName = tab.dataset.tab;
        this._switchHistoryTab(tabName, tabButtons);
      });
    });

    // 导出历史记录
    if (exportBtn) {
      addEventListener(exportBtn, 'click', () => {
        this._exportHistory();
      });
    }

    // 清空历史记录
    if (clearAllBtn) {
      addEventListener(clearAllBtn, 'click', () => {
        this._clearAllHistory();
      });
    }

    // 刷新计数
    this._updateHistoryCounts();
  }

  /**
   * 初始化主题菜单
   * @private
   */
  _initializeThemeMenu() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeMenu = document.getElementById('themeMenu');
    const themeOptions = themeMenu?.querySelectorAll('.theme-toggle__option');

    if (!themeToggleBtn || !themeMenu) return;

    // 切换菜单显示
    addEventListener(themeToggleBtn, 'click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('theme-toggle__menu--open');
    });

    // 点击外部关闭菜单
    addEventListener(document, 'click', (e) => {
      if (!themeMenu.contains(e.target) && e.target !== themeToggleBtn) {
        themeMenu.classList.remove('theme-toggle__menu--open');
      }
    });

    // 选择主题
    themeOptions?.forEach(option => {
      addEventListener(option, 'click', async () => {
        const theme = option.dataset.theme;
        await themeService.setMode(theme);
        this._updateThemeUI(theme);
        themeMenu.classList.remove('theme-toggle__menu--open');
      });
    });

    // 初始更新 UI
    this._updateThemeUI(themeService.getCurrentMode());

    // 订阅主题变化
    themeService.onThemeChange((mode, actualMode) => {
      this._updateThemeUI(mode, actualMode);
    });
  }

  /**
   * 更新主题 UI
   * @private
   * @param {string} mode - 模式
   * @param {string} actualMode - 实际模式
   */
  _updateThemeUI(mode, actualMode) {
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const themeOptions = document.querySelectorAll('.theme-toggle__option');

    // 更新按钮显示
    if (themeIcon && themeText) {
      switch (mode) {
        case THEME_MODES.LIGHT:
          themeIcon.textContent = '☀️';
          themeText.textContent = '浅色';
          break;
        case THEME_MODES.DARK:
          themeIcon.textContent = '🌙';
          themeText.textContent = '深色';
          break;
        case THEME_MODES.SYSTEM:
          themeIcon.textContent = '💻';
          themeText.textContent = '系统';
          break;
      }
    }

    // 更新选项选中状态
    themeOptions.forEach(option => {
      const isSelected = option.dataset.theme === mode;
      option.classList.toggle('theme-toggle__option--active', isSelected);
    });
  }

  /**
   * 订阅实时翻译事件
   * @private
   */
  _subscribeRealTimeTranslate() {
    conversationService.onRealTimeTranslate((result) => {
      this._handleRealTimeTranslateResult(result);
    });
  }

  /**
   * 处理实时翻译结果
   * @private
   * @param {Object} result - 翻译结果
   */
  _handleRealTimeTranslateResult(result) {
    this.logger.info('实时翻译结果:', result);
    this.logger.info('当前模式:', this._currentMode);

    // 标准模式：更新目标文本框
    const targetText = document.getElementById('targetText');
    if (targetText && result.success) {
      targetText.value = result.translatedText;
      this.logger.info('标准模式：已更新目标文本框');
    }

    // 对话模式：更新预览区域
    const convPreview = document.getElementById('convPreview');
    const convPreviewContent = document.getElementById('convPreviewContent');
    
    this.logger.info('convPreview 元素是否存在:', !!convPreview);
    this.logger.info('convPreviewContent 元素是否存在:', !!convPreviewContent);
    
    if (convPreview && convPreviewContent) {
      if (result.success && result.translatedText) {
        convPreviewContent.textContent = result.translatedText;
        convPreview.style.display = 'block';
        this.logger.info('对话模式：已显示预览区域');
      } else {
        convPreview.style.display = 'none';
      }
    }
  }

  /**
   * 绑定全局事件处理函数
   * @private
   */
  bindGlobalEventHandlers() {
    // 模式切换按钮
    const modeOptions = document.querySelectorAll('.mode-toggle__option');
    modeOptions.forEach(option => {
      addEventListener(option, 'click', () => {
        const mode = option.dataset.mode;
        this._handleModeChange(mode, modeOptions);
      });
    });

    // 对话模式语言选择器
    const convSourceLang = document.getElementById('convSourceLang');
    const convTargetLang = document.getElementById('convTargetLang');
    const convSwapBtn = document.getElementById('convSwapBtn');

    if (convSourceLang) {
      this._populateLanguageSelector(convSourceLang, 'zh-CN');
      addEventListener(convSourceLang, 'change', () => {
        this._handleConvLanguageChange();
      });
    }

    if (convTargetLang) {
      this._populateLanguageSelector(convTargetLang, 'en-US');
      addEventListener(convTargetLang, 'change', () => {
        this._handleConvLanguageChange();
      });
    }

    if (convSwapBtn) {
      addEventListener(convSwapBtn, 'click', () => {
        this._handleConvSwapLanguages();
      });
    }

    // 对话模式输入
    const convInput = document.getElementById('convInput');
    const convSendBtn = document.getElementById('convSendBtn');
    const autoTranslateToggle = document.getElementById('autoTranslateToggle');

    if (convInput && convSendBtn) {
      addEventListener(convInput, 'input', () => {
        const hasText = convInput.value.trim().length > 0;
        convSendBtn.disabled = !hasText;
        
        // 实时翻译
        if (autoTranslateToggle?.checked && hasText) {
          this._handleRealTimeTranslate(convInput.value);
        }
      });

      addEventListener(convInput, 'keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._handleConvSendMessage();
        }
      });

      addEventListener(convSendBtn, 'click', () => {
        this._handleConvSendMessage();
      });
    }

    // 对话模式操作按钮
    const convNewBtn = document.getElementById('convNewBtn');
    const convSaveBtn = document.getElementById('convSaveBtn');
    const convMicBtn = document.getElementById('convMicBtn');
    const convClearBtn = document.getElementById('convClearBtn');

    if (convNewBtn) {
      addEventListener(convNewBtn, 'click', () => {
        this._handleConvNewConversation();
      });
    }

    if (convSaveBtn) {
      addEventListener(convSaveBtn, 'click', () => {
        this._handleConvSaveConversation();
      });
    }

    if (convMicBtn) {
      addEventListener(convMicBtn, 'click', () => {
        uiController.startSpeechRecognition();
      });
    }

    if (convClearBtn) {
      addEventListener(convClearBtn, 'click', () => {
        this._handleConvClearMessages();
      });
    }

    // 标准模式实时翻译
    const sourceText = document.getElementById('sourceText');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');

    if (sourceText) {
      addEventListener(sourceText, 'input', () => {
        const content = sourceText.value.trim();
        if (content) {
          // 使用当前选择的语言进行实时翻译
          const sLang = sourceLang?.value || 'zh-CN';
          const tLang = targetLang?.value || 'en-US';
          
          // 调用实时翻译服务
          conversationService.realTimeTranslate(content, sLang, tLang);
        } else {
          // 清空时也清空目标文本
          const targetText = document.getElementById('targetText');
          if (targetText) {
            targetText.value = '';
          }
        }
      });
    }
  }

  /**
   * 填充语言选择器
   * @private
   * @param {HTMLSelectElement} select - 选择器元素
   * @param {string} selectedValue - 选中值
   */
  _populateLanguageSelector(select, selectedValue) {
    select.innerHTML = '';
    APP_CONFIG.language.supportedLanguages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.nativeName;
      if (lang.code === selectedValue) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  // ==================== 模式切换处理 ====================

  /**
   * 处理模式切换
   * @private
   * @param {string} mode - 模式
   * @param {NodeList} options - 选项列表
   */
  _handleModeChange(mode, options) {
    // 更新按钮状态
    options.forEach(opt => {
      const isActive = opt.dataset.mode === mode;
      opt.classList.toggle('mode-toggle__option--active', isActive);
      opt.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // 渲染模式
    this._renderMode(mode);

    // 保存模式
    this._currentMode = mode;
    storageService.set('ui_mode', mode);

    // 更新会话服务
    const conversationMode = mode === 'conversation' 
      ? CONVERSATION_MODES.CONVERSATION 
      : CONVERSATION_MODES.STANDARD;
    conversationService.setMode(conversationMode);

    this.logger.info(`模式已切换: ${mode}`);
  }

  /**
   * 渲染模式
   * @private
   * @param {string} mode - 模式
   */
  _renderMode(mode) {
    const standardMode = document.getElementById('standardMode');
    const conversationMode = document.getElementById('conversationMode');

    if (standardMode && conversationMode) {
      if (mode === 'conversation') {
        standardMode.style.display = 'none';
        conversationMode.style.display = 'block';
      } else {
        standardMode.style.display = 'block';
        conversationMode.style.display = 'none';
      }
    }
  }

  // ==================== 对话模式处理 ====================

  /**
   * 处理对话语言变化
   * @private
   */
  _handleConvLanguageChange() {
    const convSourceLang = document.getElementById('convSourceLang');
    const convTargetLang = document.getElementById('convTargetLang');

    const conversation = conversationService.getCurrentConversation();
    if (conversation) {
      if (convSourceLang) {
        conversation.sourceLanguage = convSourceLang.value;
      }
      if (convTargetLang) {
        conversation.targetLanguage = convTargetLang.value;
      }
      storageService.saveConversation(conversation);
    }
  }

  /**
   * 处理交换对话语言
   * @private
   */
  _handleConvSwapLanguages() {
    const convSourceLang = document.getElementById('convSourceLang');
    const convTargetLang = document.getElementById('convTargetLang');

    if (convSourceLang && convTargetLang) {
      const temp = convSourceLang.value;
      convSourceLang.value = convTargetLang.value;
      convTargetLang.value = temp;

      conversationService.swapLanguages();
    }
  }

  /**
   * 处理发送消息
   * @private
   */
  async _handleConvSendMessage() {
    const convInput = document.getElementById('convInput');
    if (!convInput) return;

    const content = convInput.value.trim();
    if (!content) return;

    convInput.value = '';
    const convSendBtn = document.getElementById('convSendBtn');
    if (convSendBtn) convSendBtn.disabled = true;

    const conversation = conversationService.getCurrentConversation();
    if (!conversation) return;

    await conversationService.sendMessage(content, {
      sourceLang: conversation.sourceLanguage,
      targetLang: conversation.targetLanguage
    });

    this._scrollMessagesToBottom();
    this._updateHistoryCounts();
  }

  /**
   * 处理实时翻译
   * @private
   * @param {string} text - 文本
   */
  async _handleRealTimeTranslate(text) {
    const conversation = conversationService.getCurrentConversation();
    if (!conversation) return;

    await conversationService.realTimeTranslate(
      text,
      conversation.sourceLanguage,
      conversation.targetLanguage
    );
  }

  /**
   * 处理新建会话
   * @private
   */
  async _handleConvNewConversation() {
    await conversationService.createNewConversation();
    
    // 清空消息区域
    const messagesContainer = document.getElementById('conversationMessages');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="message message--system">
          <div class="message__content">
            欢迎使用对话翻译模式！输入文本进行翻译，翻译结果会自动显示在对话中。
          </div>
        </div>
      `;
    }

    // 更新语言选择
    const conversation = conversationService.getCurrentConversation();
    const convSourceLang = document.getElementById('convSourceLang');
    const convTargetLang = document.getElementById('convTargetLang');
    
    if (conversation && convSourceLang && convTargetLang) {
      convSourceLang.value = conversation.sourceLanguage;
      convTargetLang.value = conversation.targetLanguage;
    }

    this._updateHistoryCounts();
    uiController.showStatus('已创建新会话', APP_CONFIG.status.types.SUCCESS);
  }

  /**
   * 处理保存会话
   * @private
   */
  _handleConvSaveConversation() {
    const conversation = conversationService.getCurrentConversation();
    if (conversation) {
      storageService.saveConversation(conversation);
      this._updateHistoryCounts();
      uiController.showStatus('会话已保存', APP_CONFIG.status.types.SUCCESS);
    }
  }

  /**
   * 处理清空消息
   * @private
   */
  _handleConvClearMessages() {
    const messagesContainer = document.getElementById('conversationMessages');
    const conversation = conversationService.getCurrentConversation();

    if (conversation && messagesContainer) {
      conversation.messages = [];
      storageService.saveConversation(conversation);
      
      messagesContainer.innerHTML = `
        <div class="message message--system">
          <div class="message__content">
            欢迎使用对话翻译模式！输入文本进行翻译，翻译结果会自动显示在对话中。
          </div>
        </div>
      `;

      this._updateHistoryCounts();
      uiController.showStatus('消息已清空', APP_CONFIG.status.types.INFO);
    }
  }

  /**
   * 滚动消息到底部
   * @private
   */
  _scrollMessagesToBottom() {
    const messagesContainer = document.getElementById('conversationMessages');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  // ==================== 历史记录面板 ====================

  /**
   * 切换历史记录面板
   * @private
   * @param {boolean} show - 是否显示
   */
  _toggleHistoryPanel(show) {
    const historyPanel = document.getElementById('historyPanel');
    const historyOverlay = document.getElementById('historyOverlay');

    if (historyPanel && historyOverlay) {
      if (show) {
        historyPanel.classList.add('history-panel--open');
        historyOverlay.style.display = 'block';
        this._refreshHistoryList();
      } else {
        historyPanel.classList.remove('history-panel--open');
        historyOverlay.style.display = 'none';
      }
    }
  }

  /**
   * 刷新历史记录列表
   * @private
   */
  _refreshHistoryList() {
    const conversations = storageService.getAllConversations();
    const currentConversation = conversationService.getCurrentConversation();
    const historyList = document.getElementById('historyList');
    const convCount = document.getElementById('convCount');
    const transCount = document.getElementById('transCount');

    if (!historyList) return;

    // 更新计数
    if (convCount) convCount.textContent = conversations.length;
    
    // 翻译历史计数（从存储获取）
    const translationHistory = storageService.getTranslationHistory();
    if (transCount) transCount.textContent = translationHistory.length;

    // 渲染列表
    if (conversations.length === 0) {
      historyList.innerHTML = `
        <div class="history-panel__empty">
          <div class="history-panel__empty-icon">📭</div>
          <div class="history-panel__empty-text">暂无历史记录</div>
        </div>
      `;
      return;
    }

    let html = '';
    for (const conv of conversations) {
      const isActive = currentConversation && conv.id === currentConversation.id;
      const messageCount = conv.messages.length;
      const lastUpdate = conv.getFormattedUpdatedAt ? conv.getFormattedUpdatedAt() : new Date(conv.updatedAt).toLocaleString('zh-CN');
      
      html += `
        <div class="history-item ${isActive ? 'history-item--active' : ''}" data-conversation-id="${conv.id}">
          <div class="history-item__title">${conv.title || '新会话'}</div>
          <div class="history-item__info">
            ${conv.sourceLanguage} → ${conv.targetLanguage} · ${messageCount} 条消息 · ${lastUpdate}
          </div>
        </div>
      `;
    }

    historyList.innerHTML = html;

    // 绑定点击事件
    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const convId = item.dataset.conversationId;
        this._loadConversation(convId);
      });
    });
  }

  /**
   * 加载会话
   * @private
   * @param {string} convId - 会话 ID
   */
  _loadConversation(convId) {
    const conversation = storageService.getConversation(convId);
    if (!conversation) return;

    // 设置当前会话
    conversationService.setCurrentConversation(convId);

    // 渲染消息
    const messagesContainer = document.getElementById('conversationMessages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
      
      for (const msg of conversation.messages) {
        const messageHtml = this._createMessageHTML(msg);
        messagesContainer.innerHTML += messageHtml;
      }
    }

    // 更新语言选择
    const convSourceLang = document.getElementById('convSourceLang');
    const convTargetLang = document.getElementById('convTargetLang');
    if (convSourceLang) convSourceLang.value = conversation.sourceLanguage;
    if (convTargetLang) convTargetLang.value = conversation.targetLanguage;

    // 切换到对话模式
    this._handleModeChange('conversation', document.querySelectorAll('.mode-toggle__option'));

    // 关闭历史面板
    this._toggleHistoryPanel(false);
    this._scrollMessagesToBottom();
  }

  /**
   * 创建消息 HTML
   * @private
   * @param {Object} msg - 消息对象
   * @returns {string} HTML 字符串
   */
  _createMessageHTML(msg) {
    let roleClass = 'message--system';
    if (msg.role === 'user') roleClass = 'message--user';
    else if (msg.role === 'translated') roleClass = 'message--translated';

    let content = msg.content;
    if (msg.state === 'sending' || msg.state === 'translating') {
      content = `
        <div class="message__loading">
          <div class="message__loading-dot"></div>
          <div class="message__loading-dot"></div>
          <div class="message__loading-dot"></div>
        </div>
      `;
    } else if (msg.state === 'error') {
      content = `
        <div class="message__error">
          <span class="message__error-icon">⚠️</span>
          <span class="message__error-text">${msg.content}</span>
        </div>
      `;
    }

    const time = msg.getFormattedTime ? msg.getFormattedTime() : new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="message ${roleClass}">
        <div class="message__content">${content}</div>
        <div class="message__meta">${time}</div>
      </div>
    `;
  }

  /**
   * 切换历史标签
   * @private
   * @param {string} tabName - 标签名
   * @param {NodeList} tabs - 标签列表
   */
  _switchHistoryTab(tabName, tabs) {
    // 更新标签状态
    tabs.forEach(tab => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('history-panel__tab--active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // 刷新列表
    this._refreshHistoryList();
  }

  /**
   * 过滤历史记录
   * @private
   * @param {string} query - 搜索关键词
   */
  _filterHistory(query) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    const items = historyList.querySelectorAll('.history-item');
    items.forEach(item => {
      const title = item.querySelector('.history-item__title')?.textContent?.toLowerCase() || '';
      const info = item.querySelector('.history-item__info')?.textContent?.toLowerCase() || '';
      
      if (query === '' || title.includes(query.toLowerCase()) || info.includes(query.toLowerCase())) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  /**
   * 导出历史记录
   * @private
   */
  _exportHistory() {
    const conversations = storageService.getAllConversations();
    const translations = storageService.getTranslationHistory();
    
    const data = {
      exportDate: new Date().toISOString(),
      conversations,
      translations
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    uiController.showStatus('历史记录已导出', APP_CONFIG.status.types.SUCCESS);
  }

  /**
   * 清空所有历史记录
   * @private
   */
  _clearAllHistory() {
    if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      storageService.clearAllConversations();
      storageService.clearTranslationHistory();
      this._updateHistoryCounts();
      this._refreshHistoryList();
      uiController.showStatus('历史记录已清空', APP_CONFIG.status.types.SUCCESS);
    }
  }

  /**
   * 更新历史记录计数
   * @private
   */
  _updateHistoryCounts() {
    const conversations = storageService.getAllConversations();
    const translations = storageService.getTranslationHistory();
    
    const convCount = document.getElementById('convCount');
    const transCount = document.getElementById('transCount');
    
    if (convCount) convCount.textContent = conversations.length;
    if (transCount) transCount.textContent = translations.length;
  }

  /**
   * 获取应用版本
   * @returns {string} 版本号
   */
  getVersion() {
    return '2.0.0';
  }

  /**
   * 获取应用配置
   * @returns {Object} 应用配置
   */
  getConfig() {
    return {
      version: this.getVersion(),
      supportedLanguages: APP_CONFIG.language.supportedLanguages.length,
      features: {
        speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
        speechSynthesis: 'speechSynthesis' in window,
        clipboard: 'clipboard' in navigator,
        fetch: 'fetch' in window,
        conversationMode: true,
        darkMode: true,
        historyManagement: true
      }
    };
  }
}

/**
 * 应用单例实例
 * @type {TranslateApp}
 */
const translateApp = new TranslateApp();

/**
 * 页面加载完成后初始化应用
 */
document.addEventListener('DOMContentLoaded', async () => {
  const success = await translateApp.initialize();
  
  if (!success) {
    console.error('应用初始化失败，请检查控制台获取更多信息');
  }
});

// 导出应用实例供外部使用
export {
  TranslateApp,
  translateApp
};
