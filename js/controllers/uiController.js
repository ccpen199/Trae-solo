/**
 * @fileoverview UI 控制器模块
 * @description 管理用户界面的状态和交互，协调各个服务模块
 * @version 1.0.0
 */

import { APP_CONFIG } from '../config/index.js';
import { logger, delay } from '../utils/index.js';
import { DOM_REFS, getElementValue, setElementValue, showElement, hideElement, disableElement, enableElement, addClass, removeClass } from '../core/dom.js';
import { getState, isTranslating, isBusy } from '../core/state.js';
import { translationService } from '../services/translationService.js';
import { speechRecognitionService } from '../services/speechRecognitionService.js';
import { speechSynthesisService } from '../services/speechSynthesisService.js';

/**
 * UI 控制器类
 * @class
 * @description 管理 UI 状态和交互逻辑
 */
class UIController {
  /**
   * @constructor
   */
  constructor() {
    this.logger = logger;
    this.statusTimeout = null;
  }

  /**
   * 初始化 UI 控制器
   */
  initialize() {
    this.logger.info('UI 控制器初始化');
    
    // 设置语音识别回调
    this.setupSpeechRecognitionCallbacks();
    
    // 设置语音合成回调
    this.setupSpeechSynthesisCallbacks();
  }

  /**
   * 设置语音识别回调
   * @private
   */
  setupSpeechRecognitionCallbacks() {
    // 结果回调
    speechRecognitionService.onResult((result) => {
      this.logger.debug('语音识别结果:', result);
      
      // 更新源文本框
      const { sourceText } = DOM_REFS.text;
      if (sourceText) {
        sourceText.value = result.fullText;
      }
    });

    // 错误回调
    speechRecognitionService.onError((error) => {
      this.logger.error('语音识别错误:', error);
      this.showStatus(error.message, APP_CONFIG.status.types.ERROR);
      this.updateRecordingUI(false);
    });

    // 开始回调
    speechRecognitionService.onStart(() => {
      this.showStatus(APP_CONFIG.status.messages.listening, APP_CONFIG.status.types.INFO);
      this.updateRecordingUI(true);
    });

    // 结束回调
    speechRecognitionService.onEnd(() => {
      this.showStatus(APP_CONFIG.status.messages.recordingStopped, APP_CONFIG.status.types.INFO);
      this.hideStatusDelayed();
    });
  }

  /**
   * 设置语音合成回调
   * @private
   */
  setupSpeechSynthesisCallbacks() {
    // 开始回调
    speechSynthesisService.onStart(() => {
      this.showStatus(APP_CONFIG.status.messages.speaking, APP_CONFIG.status.types.INFO);
    });

    // 结束回调
    speechSynthesisService.onEnd(() => {
      this.showStatus(APP_CONFIG.status.messages.speakComplete, APP_CONFIG.status.types.SUCCESS);
      this.hideStatusDelayed();
    });

    // 错误回调
    speechSynthesisService.onError((error) => {
      this.logger.error('语音合成错误:', error);
      this.showStatus(error.message, APP_CONFIG.status.types.ERROR);
    });
  }

  /**
   * 显示状态消息
   * @param {string} message - 状态消息
   * @param {string} type - 状态类型
   */
  showStatus(message, type) {
    const { statusElement } = DOM_REFS;
    if (!statusElement) return;

    // 清除之前的超时
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
      this.statusTimeout = null;
    }

    // 设置消息和样式
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';

    this.logger.debug(`显示状态: [${type}] ${message}`);
  }

  /**
   * 隐藏状态消息
   */
  hideStatus() {
    const { statusElement } = DOM_REFS;
    if (!statusElement) return;

    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
      this.statusTimeout = null;
    }

    statusElement.style.display = 'none';
    statusElement.className = 'status';
  }

  /**
   * 延迟隐藏状态消息
   * @param {number} [delayMs] - 延迟时间（毫秒）
   */
  hideStatusDelayed(delayMs = APP_CONFIG.ui.statusDisplayDuration) {
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }

    this.statusTimeout = setTimeout(() => {
      this.hideStatus();
    }, delayMs);
  }

  /**
   * 更新录音 UI 状态
   * @param {boolean} isRecording - 是否正在录音
   */
  updateRecordingUI(isRecording) {
    const { startMicBtn, stopMicBtn } = DOM_REFS.buttons;

    if (isRecording) {
      hideElement(startMicBtn);
      showElement(stopMicBtn, 'flex');
      addClass(startMicBtn, APP_CONFIG.cssClasses.recording);
    } else {
      showElement(startMicBtn, 'flex');
      hideElement(stopMicBtn);
      removeClass(startMicBtn, APP_CONFIG.cssClasses.recording);
    }
  }

  /**
   * 更新翻译按钮状态
   * @param {boolean} isTranslating - 是否正在翻译
   */
  updateTranslateButton(isTranslating) {
    const { translateBtn } = DOM_REFS.buttons;
    if (!translateBtn) return;

    if (isTranslating) {
      disableElement(translateBtn);
      translateBtn.textContent = '🔄 翻译中...';
    } else {
      enableElement(translateBtn);
      translateBtn.textContent = '🔄 翻译';
    }
  }

  /**
   * 执行翻译
   * @returns {Promise<boolean>} 是否成功
   */
  async executeTranslation() {
    const { sourceLang, targetLang } = DOM_REFS.language;
    const { sourceText, targetText } = DOM_REFS.text;
    const { translateBtn } = DOM_REFS.buttons;

    // 获取源文本
    const text = getElementValue(sourceText).trim();
    
    // 验证输入
    if (!text) {
      this.showStatus(APP_CONFIG.status.messages.errorNoText, APP_CONFIG.status.types.ERROR);
      return false;
    }

    // 检查是否忙碌
    if (isBusy()) {
      this.logger.warn('应用正忙，无法执行翻译');
      return false;
    }

    // 更新 UI 状态
    this.updateTranslateButton(true);
    this.showStatus(APP_CONFIG.status.messages.translating, APP_CONFIG.status.types.INFO);

    try {
      // 执行翻译
      const sourceLangCode = getElementValue(sourceLang);
      const targetLangCode = getElementValue(targetLang);

      this.logger.info(`开始翻译: ${sourceLangCode} -> ${targetLangCode}`);

      const translatedText = await translationService.translate(
        text,
        sourceLangCode,
        targetLangCode
      );

      // 更新目标文本
      setElementValue(targetText, translatedText);

      // 显示成功状态
      this.showStatus(APP_CONFIG.status.messages.translationComplete, APP_CONFIG.status.types.SUCCESS);
      this.hideStatusDelayed();

      return true;
    } catch (error) {
      this.logger.error('翻译失败:', error);
      this.showStatus(error.message, APP_CONFIG.status.types.ERROR);
      return false;
    } finally {
      this.updateTranslateButton(false);
    }
  }

  /**
   * 开始语音识别
   * @returns {boolean} 是否成功启动
   */
  startSpeechRecognition() {
    const { sourceLang } = DOM_REFS.language;
    const langCode = getElementValue(sourceLang);

    // 检查浏览器支持
    if (!speechRecognitionService.isBrowserSupported()) {
      this.showStatus(
        APP_CONFIG.status.messages.errorSpeechRecognitionNotSupported,
        APP_CONFIG.status.types.ERROR
      );
      return false;
    }

    // 检查是否忙碌
    if (isBusy()) {
      this.logger.warn('应用正忙，无法开始语音识别');
      return false;
    }

    return speechRecognitionService.start(langCode);
  }

  /**
   * 停止语音识别
   */
  stopSpeechRecognition() {
    speechRecognitionService.stop();
    this.updateRecordingUI(false);
  }

  /**
   * 执行语音合成（朗读）
   * @returns {boolean} 是否成功启动
   */
  executeSpeechSynthesis() {
    const { targetLang } = DOM_REFS.language;
    const { targetText } = DOM_REFS.text;

    const text = getElementValue(targetText).trim();
    const langCode = getElementValue(targetLang);

    // 验证输入
    if (!text) {
      this.showStatus(APP_CONFIG.status.messages.errorNoSpeechText, APP_CONFIG.status.types.ERROR);
      return false;
    }

    // 检查浏览器支持
    if (!speechSynthesisService.isBrowserSupported()) {
      this.showStatus(
        APP_CONFIG.status.messages.errorSpeechSynthesisNotSupported,
        APP_CONFIG.status.types.ERROR
      );
      return false;
    }

    // 检查是否忙碌
    if (isBusy()) {
      // 如果正在朗读，先停止
      if (speechSynthesisService.isSpeaking()) {
        speechSynthesisService.cancel();
        return false;
      }
      this.logger.warn('应用正忙，无法执行语音合成');
      return false;
    }

    return speechSynthesisService.speak(text, langCode);
  }

  /**
   * 复制文本到剪贴板
   * @returns {Promise<boolean>} 是否成功
   */
  async copyToClipboard() {
    const { targetText } = DOM_REFS.text;
    const text = getElementValue(targetText).trim();

    // 验证输入
    if (!text) {
      this.showStatus(APP_CONFIG.status.messages.errorNoCopyText, APP_CONFIG.status.types.ERROR);
      return false;
    }

    // 检查剪贴板支持
    if (!('clipboard' in navigator)) {
      this.showStatus(
        APP_CONFIG.status.messages.errorBrowserNotSupported,
        APP_CONFIG.status.types.ERROR
      );
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.showStatus(APP_CONFIG.status.messages.copied, APP_CONFIG.status.types.SUCCESS);
      this.hideStatusDelayed();
      return true;
    } catch (error) {
      this.logger.error('复制到剪贴板失败:', error);
      this.showStatus(APP_CONFIG.status.messages.errorCopy, APP_CONFIG.status.types.ERROR);
      return false;
    }
  }

  /**
   * 交换语言
   */
  swapLanguages() {
    const { sourceLang, targetLang } = DOM_REFS.language;
    const { sourceText, targetText } = DOM_REFS.text;

    // 保存当前值
    const tempLang = getElementValue(sourceLang);
    const tempText = getElementValue(sourceText);

    // 交换语言
    setElementValue(sourceLang, getElementValue(targetLang));
    setElementValue(targetLang, tempLang);

    // 交换文本
    setElementValue(sourceText, getElementValue(targetText));
    setElementValue(targetText, tempText);

    // 如果正在录音，更新识别语言
    if (speechRecognitionService && speechRecognitionService.recognition) {
      speechRecognitionService.recognition.lang = getElementValue(sourceLang);
    }

    this.showStatus('语言已交换', APP_CONFIG.status.types.SUCCESS);
    this.hideStatusDelayed();

    this.logger.debug('语言已交换');
  }

  /**
   * 清空源文本
   */
  clearSourceText() {
    const { sourceText } = DOM_REFS.text;
    setElementValue(sourceText, '');
    this.logger.debug('源文本已清空');
  }

  /**
   * 清空目标文本
   */
  clearTargetText() {
    const { targetText } = DOM_REFS.text;
    setElementValue(targetText, '');
    this.logger.debug('目标文本已清空');
  }

  /**
   * 检查源文本是否有内容
   * @returns {boolean} 是否有内容
   */
  hasSourceText() {
    const { sourceText } = DOM_REFS.text;
    return getElementValue(sourceText).trim().length > 0;
  }
}

/**
 * UI 控制器单例实例
 * @type {UIController}
 */
const uiController = new UIController();

export {
  // 控制器类
  UIController,
  
  // 单例实例
  uiController
};
