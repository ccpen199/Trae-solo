/**
 * @fileoverview 主题管理服务
 * @description 管理应用的主题切换（明暗主题）、颜色方案和 CSS 变量
 * @version 1.0.0
 */

import { logger } from '../utils/index.js';
import { storageService } from './storage.js';

/**
 * 主题模式枚举
 * @readonly
 * @enum {string}
 */
export const THEME_MODES = {
  /** 浅色主题 */
  LIGHT: 'light',
  /** 深色主题 */
  DARK: 'dark',
  /** 跟随系统 */
  SYSTEM: 'system'
};

/**
 * CSS 类名常量
 * @readonly
 * @enum {string}
 */
const THEME_CLASSES = {
  /** 浅色主题类名 */
  LIGHT: 'theme--light',
  /** 深色主题类名 */
  DARK: 'theme--dark'
};

/**
 * 主题管理服务类
 * @class
 * @description 管理应用主题的切换、持久化和响应系统主题变化
 */
export class ThemeService {
  /**
   * @constructor
   */
  constructor() {
    this.logger = logger;
    this.currentMode = THEME_MODES.LIGHT;
    this.isInitialized = false;
    this._systemDarkModeMediaQuery = null;
    this._changeListeners = new Set();
  }

  /**
   * 初始化主题服务
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async initialize() {
    if (this.isInitialized) {
      this.logger.debug('主题服务已初始化，跳过');
      return true;
    }

    try {
      // 1. 获取保存的主题设置
      const savedMode = storageService.getThemeMode();
      
      // 2. 设置系统主题变化监听
      this._setupSystemThemeListener();
      
      // 3. 应用主题
      await this.setMode(savedMode);
      
      // 4. 标记为已初始化
      this.isInitialized = true;
      
      this.logger.info(`主题服务初始化完成，当前模式: ${this.currentMode}`);
      return true;
    } catch (error) {
      this.logger.error('主题服务初始化失败', error);
      return false;
    }
  }

  /**
   * 设置系统主题变化监听器
   * @private
   */
  _setupSystemThemeListener() {
    // 检查浏览器是否支持 prefers-color-scheme
    if (!window.matchMedia) {
      this.logger.debug('浏览器不支持 matchMedia，无法监听系统主题变化');
      return;
    }

    // 创建媒体查询
    this._systemDarkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // 监听变化
    const handler = (event) => {
      if (this.currentMode === THEME_MODES.SYSTEM) {
        this._applyTheme(event.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT);
      }
    };

    // 兼容旧版浏览器
    if (this._systemDarkModeMediaQuery.addEventListener) {
      this._systemDarkModeMediaQuery.addEventListener('change', handler);
    } else {
      this._systemDarkModeMediaQuery.addListener(handler);
    }
  }

  /**
   * 设置主题模式
   * @param {string} mode - 主题模式 ('light' | 'dark' | 'system')
   * @returns {Promise<boolean>} 是否设置成功
   */
  async setMode(mode) {
    // 验证模式有效性
    if (!Object.values(THEME_MODES).includes(mode)) {
      this.logger.warn(`无效的主题模式: ${mode}，使用默认值: ${THEME_MODES.LIGHT}`);
      mode = THEME_MODES.LIGHT;
    }

    try {
      // 1. 更新当前模式
      this.currentMode = mode;

      // 2. 保存到存储
      storageService.setThemeMode(mode);

      // 3. 应用主题
      let actualMode = mode;
      if (mode === THEME_MODES.SYSTEM) {
        actualMode = this._getSystemThemeMode();
      }
      
      this._applyTheme(actualMode);

      // 4. 通知监听器
      this._notifyChange(mode, actualMode);

      this.logger.info(`主题模式已设置: ${mode} (实际应用: ${actualMode})`);
      return true;
    } catch (error) {
      this.logger.error('设置主题模式失败', error);
      return false;
    }
  }

  /**
   * 获取系统主题模式
   * @private
   * @returns {string} 'light' | 'dark'
   */
  _getSystemThemeMode() {
    if (!window.matchMedia) {
      return THEME_MODES.LIGHT;
    }

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? THEME_MODES.DARK : THEME_MODES.LIGHT;
  }

  /**
   * 应用主题到 DOM
   * @private
   * @param {string} mode - 'light' | 'dark'
   */
  _applyTheme(mode) {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    // 移除旧的主题类
    htmlElement.classList.remove(THEME_CLASSES.LIGHT, THEME_CLASSES.DARK);
    bodyElement.classList.remove(THEME_CLASSES.LIGHT, THEME_CLASSES.DARK);

    // 添加新的主题类
    const themeClass = mode === THEME_MODES.DARK ? THEME_CLASSES.DARK : THEME_CLASSES.LIGHT;
    htmlElement.classList.add(themeClass);
    bodyElement.classList.add(themeClass);

    // 设置 data-theme 属性（用于 CSS 选择器）
    htmlElement.setAttribute('data-theme', mode);

    // 设置 meta theme-color（用于移动浏览器地址栏）
    this._updateMetaThemeColor(mode);
  }

  /**
   * 更新 meta theme-color
   * @private
   * @param {string} mode - 'light' | 'dark'
   */
  _updateMetaThemeColor(mode) {
    // 查找或创建 meta 标签
    let metaTag = document.querySelector('meta[name="theme-color"]');
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'theme-color';
      document.head.appendChild(metaTag);
    }

    // 设置颜色（根据主题）
    const themeColor = mode === THEME_MODES.DARK 
      ? '#1f2937'  // 深色主题颜色
      : '#667eea';  // 浅色主题颜色（主色调）

    metaTag.content = themeColor;
  }

  /**
   * 切换主题（在 light 和 dark 之间切换）
   * @returns {Promise<string>} 新的主题模式
   */
  async toggleTheme() {
    let newMode;
    
    if (this.currentMode === THEME_MODES.SYSTEM) {
      // 当前是跟随系统，切换到相反的实际模式
      const actualMode = this._getSystemThemeMode();
      newMode = actualMode === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    } else {
      // 当前是固定模式，切换到另一个
      newMode = this.currentMode === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    }

    await this.setMode(newMode);
    return newMode;
  }

  /**
   * 获取当前主题模式
   * @returns {string} 当前模式 ('light' | 'dark' | 'system')
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * 获取实际应用的主题模式
   * @returns {string} 'light' | 'dark'
   */
  getActualMode() {
    if (this.currentMode === THEME_MODES.SYSTEM) {
      return this._getSystemThemeMode();
    }
    return this.currentMode;
  }

  /**
   * 检查是否是深色主题
   * @returns {boolean} 是否为深色主题
   */
  isDarkMode() {
    return this.getActualMode() === THEME_MODES.DARK;
  }

  /**
   * 检查是否是浅色主题
   * @returns {boolean} 是否为浅色主题
   */
  isLightMode() {
    return this.getActualMode() === THEME_MODES.LIGHT;
  }

  /**
   * 检查是否跟随系统主题
   * @returns {boolean} 是否跟随系统
   */
  isSystemMode() {
    return this.currentMode === THEME_MODES.SYSTEM;
  }

  // ==================== 主题切换事件 ====================

  /**
   * 订阅主题变化事件
   * @param {Function} callback - 回调函数，参数为 (mode, actualMode)
   * @returns {Function} 取消订阅函数
   */
  onThemeChange(callback) {
    this._changeListeners.add(callback);
    
    // 返回取消订阅函数
    return () => {
      this._changeListeners.delete(callback);
    };
  }

  /**
   * 通知所有监听器主题已变化
   * @private
   * @param {string} mode - 设置的模式
   * @param {string} actualMode - 实际应用的模式
   */
  _notifyChange(mode, actualMode) {
    this._changeListeners.forEach(callback => {
      try {
        callback(mode, actualMode);
      } catch (error) {
        this.logger.error('主题变化回调执行失败', error);
      }
    });
  }

  // ==================== 主题配置 ====================

  /**
   * 获取主题配置（用于 UI 展示）
   * @returns {Object} 主题配置数组
   */
  getThemeOptions() {
    return [
      {
        mode: THEME_MODES.LIGHT,
        label: '浅色',
        icon: '☀️',
        description: '明亮的界面主题'
      },
      {
        mode: THEME_MODES.DARK,
        label: '深色',
        icon: '🌙',
        description: '护眼的深色主题'
      },
      {
        mode: THEME_MODES.SYSTEM,
        label: '跟随系统',
        icon: '💻',
        description: '自动跟随系统设置'
      }
    ];
  }
}

/**
 * 主题服务单例实例
 * @type {ThemeService}
 */
export const themeService = new ThemeService();

export default ThemeService;
