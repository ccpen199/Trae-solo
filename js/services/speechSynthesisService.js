/**
 * @fileoverview 语音合成服务模块
 * @description 提供语音合成（文字转语音）功能，封装 Web Speech API
 * @version 1.0.0
 */

import { APP_CONFIG } from '../config/index.js';
import { logger, isFeatureSupported } from '../utils/index.js';
import { setSpeakingState, isSpeaking } from '../core/state.js';

/**
 * 语音合成服务类
 * @class
 * @description 封装 Web Speech API 的语音合成功能
 */
class SpeechSynthesisService {
  /**
   * @constructor
   */
  constructor() {
    this.config = APP_CONFIG.speech.synthesis;
    this.logger = logger;
    this.synth = window.speechSynthesis;
    this.isSupported = false;
    this.availableVoices = [];
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;
    this.onBoundaryCallback = null;

    this.initialize();
  }

  /**
   * 初始化语音合成服务
   * @private
   */
  initialize() {
    this.isSupported = isFeatureSupported('speechSynthesis');
    
    if (!this.isSupported) {
      this.logger.warn('当前浏览器不支持语音合成');
      return;
    }

    // 加载可用语音列表
    this.loadVoices();

    // 监听语音列表变化（某些浏览器需要异步加载）
    if (typeof this.synth.onvoiceschanged !== 'undefined') {
      this.synth.onvoiceschanged = () => {
        this.loadVoices();
      };
    }

    this.logger.info('语音合成服务已初始化');
  }

  /**
   * 加载可用语音列表
   * @private
   */
  loadVoices() {
    if (!this.synth) return;

    this.availableVoices = this.synth.getVoices();
    this.logger.debug(`已加载 ${this.availableVoices.length} 个可用语音`);
    
    // 按语言分组
    const voicesByLang = {};
    this.availableVoices.forEach(voice => {
      const lang = voice.lang.toLowerCase();
      if (!voicesByLang[lang]) {
        voicesByLang[lang] = [];
      }
      voicesByLang[lang].push(voice);
    });
    
    this.logger.debug('语音按语言分组:', Object.keys(voicesByLang));
  }

  /**
   * 根据语言代码查找最佳语音
   * @private
   * @param {string} langCode - 语言代码（如 'zh-CN'）
   * @returns {SpeechSynthesisVoice|null} 找到的语音
   */
  findBestVoice(langCode) {
    if (this.availableVoices.length === 0) {
      this.logger.warn('没有可用的语音');
      return null;
    }

    // 精确匹配
    let voice = this.availableVoices.find(v => 
      v.lang.toLowerCase() === langCode.toLowerCase()
    );

    // 如果没有精确匹配，尝试匹配语言前缀
    if (!voice) {
      const langPrefix = langCode.split('-')[0].toLowerCase();
      voice = this.availableVoices.find(v => 
        v.lang.toLowerCase().startsWith(langPrefix)
      );
    }

    // 优先选择默认语音
    if (voice) {
      const defaultVoice = this.availableVoices.find(v => 
        v.default && v.lang.toLowerCase() === langCode.toLowerCase()
      );
      if (defaultVoice) {
        voice = defaultVoice;
      }
    }

    if (voice) {
      this.logger.debug(`为语言 "${langCode}" 选择语音: ${voice.name}`);
    } else {
      this.logger.warn(`未找到语言 "${langCode}" 的语音`);
    }

    return voice;
  }

  /**
   * 语音合成（朗读文本）
   * @param {string} text - 要朗读的文本
   * @param {string} [language] - 语言代码（如 'zh-CN'）
   * @param {Object} [options] - 可选配置
   * @param {number} [options.rate] - 语速 (0.1 - 10)
   * @param {number} [options.pitch] - 音高 (0 - 2)
   * @param {number} [options.volume] - 音量 (0 - 1)
   * @returns {boolean} 是否成功开始朗读
   */
  speak(text, language, options = {}) {
    if (!this.isSupported) {
      this.logger.error('语音合成不被支持');
      return false;
    }

    if (!text || text.trim().length === 0) {
      this.logger.warn('没有要朗读的文本');
      return false;
    }

    if (isSpeaking()) {
      this.logger.warn('已经在朗读中，先停止当前朗读');
      this.cancel();
    }

    const trimmedText = text.trim();
    
    // 创建语音 utterance
    const utterance = new SpeechSynthesisUtterance(trimmedText);

    // 设置语言
    if (language) {
      utterance.lang = language;
      
      // 尝试查找并设置最佳语音
      const voice = this.findBestVoice(language);
      if (voice) {
        utterance.voice = voice;
      }
    }

    // 设置其他参数
    utterance.rate = options.rate || this.config.rate;
    utterance.pitch = options.pitch || this.config.pitch;
    utterance.volume = options.volume || this.config.volume;

    // 绑定事件
    this.bindUtteranceEvents(utterance);

    this.logger.info(`开始朗读: "${trimmedText}" (语言: ${language || '默认'})`);
    this.logger.debug(`朗读参数: rate=${utterance.rate}, pitch=${utterance.pitch}, volume=${utterance.volume}`);

    try {
      this.synth.speak(utterance);
      setSpeakingState(true);
      return true;
    } catch (error) {
      this.logger.error('启动语音合成失败', error);
      return false;
    }
  }

  /**
   * 绑定语音 utterance 事件
   * @private
   * @param {SpeechSynthesisUtterance} utterance - 语音对象
   */
  bindUtteranceEvents(utterance) {
    // 开始朗读
    utterance.onstart = (event) => {
      this.logger.debug('朗读开始');
      setSpeakingState(true);
      
      if (this.onStartCallback) {
        this.onStartCallback(event);
      }
    };

    // 朗读结束
    utterance.onend = (event) => {
      this.logger.debug('朗读结束');
      setSpeakingState(false);
      
      if (this.onEndCallback) {
        this.onEndCallback(event);
      }
    };

    // 朗读错误
    utterance.onerror = (event) => {
      this.logger.error('语音合成错误', event.error);
      setSpeakingState(false);
      
      if (this.onErrorCallback) {
        this.onErrorCallback({
          error: event.error,
          message: APP_CONFIG.status.messages.errorSpeechSynthesis
        });
      }
    };

    // 词语边界（用于高亮等）
    utterance.onboundary = (event) => {
      this.logger.debug(`朗读边界: charIndex=${event.charIndex}, charLength=${event.charLength}`);
      
      if (this.onBoundaryCallback) {
        this.onBoundaryCallback(event);
      }
    };

    // 暂停
    utterance.onpause = () => {
      this.logger.debug('朗读已暂停');
    };

    // 恢复
    utterance.onresume = () => {
      this.logger.debug('朗读已恢复');
    };

    // 标记（用于 SSML）
    utterance.onmark = (event) => {
      this.logger.debug(`朗读标记: ${event.name}`);
    };
  }

  /**
   * 暂停朗读
   */
  pause() {
    if (this.synth && isSpeaking()) {
      this.synth.pause();
      this.logger.info('朗读已暂停');
    }
  }

  /**
   * 恢复朗读
   */
  resume() {
    if (this.synth) {
      this.synth.resume();
      this.logger.info('朗读已恢复');
    }
  }

  /**
   * 取消朗读
   */
  cancel() {
    if (this.synth) {
      this.synth.cancel();
      setSpeakingState(false);
      this.logger.info('朗读已取消');
    }
  }

  /**
   * 设置开始回调函数
   * @param {Function} callback - 回调函数
   */
  onStart(callback) {
    this.onStartCallback = callback;
  }

  /**
   * 设置结束回调函数
   * @param {Function} callback - 回调函数
   */
  onEnd(callback) {
    this.onEndCallback = callback;
  }

  /**
   * 设置错误回调函数
   * @param {Function} callback - 回调函数
   */
  onError(callback) {
    this.onErrorCallback = callback;
  }

  /**
   * 设置边界回调函数
   * @param {Function} callback - 回调函数
   */
  onBoundary(callback) {
    this.onBoundaryCallback = callback;
  }

  /**
   * 检查是否支持语音合成
   * @returns {boolean} 是否支持
   */
  isBrowserSupported() {
    return this.isSupported;
  }

  /**
   * 获取所有可用语音
   * @returns {SpeechSynthesisVoice[]} 语音列表
   */
  getAvailableVoices() {
    return [...this.availableVoices];
  }

  /**
   * 根据语言获取可用语音
   * @param {string} langCode - 语言代码
   * @returns {SpeechSynthesisVoice[]} 匹配的语音列表
   */
  getVoicesByLanguage(langCode) {
    return this.availableVoices.filter(voice => 
      voice.lang.toLowerCase().startsWith(langCode.toLowerCase().split('-')[0])
    );
  }

  /**
   * 检查是否正在朗读
   * @returns {boolean} 是否正在朗读
   */
  isSpeaking() {
    return isSpeaking();
  }
}

/**
 * 语音合成服务单例实例
 * @type {SpeechSynthesisService}
 */
const speechSynthesisService = new SpeechSynthesisService();

/**
 * 便捷函数：朗读文本
 * @param {string} text - 要朗读的文本
 * @param {string} [language] - 语言代码
 * @param {Object} [options] - 可选配置
 * @returns {boolean} 是否成功开始朗读
 */
function speakText(text, language, options) {
  return speechSynthesisService.speak(text, language, options);
}

/**
 * 便捷函数：停止朗读
 */
function stopSpeaking() {
  speechSynthesisService.cancel();
}

export {
  // 服务类
  SpeechSynthesisService,
  
  // 单例实例
  speechSynthesisService,
  
  // 便捷函数
  speakText,
  stopSpeaking
};
