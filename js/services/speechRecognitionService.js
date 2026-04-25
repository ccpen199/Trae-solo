/**
 * @fileoverview 语音识别服务模块
 * @description 提供语音识别功能，封装 Web Speech API
 * @version 1.0.0
 */

import { APP_CONFIG } from '../config/index.js';
import { 
  logger, 
  isFeatureSupported, 
  getSpeechRecognitionConstructor 
} from '../utils/index.js';
import { setRecordingState, isRecording } from '../core/state.js';

/**
 * 语音识别服务类
 * @class
 * @description 封装 Web Speech API 的语音识别功能
 */
class SpeechRecognitionService {
  /**
   * @constructor
   */
  constructor() {
    this.config = APP_CONFIG.speech.recognition;
    this.logger = logger;
    this.recognition = null;
    this.isSupported = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStartCallback = null;
    this.onEndCallback = null;

    this.initialize();
  }

  /**
   * 初始化语音识别
   * @private
   */
  initialize() {
    this.isSupported = isFeatureSupported('speechRecognition');
    
    if (!this.isSupported) {
      this.logger.warn('当前浏览器不支持语音识别');
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    this.recognition = new SpeechRecognition();
    
    // 配置识别参数
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = APP_CONFIG.language.defaultSource;

    // 绑定事件处理
    this.bindEvents();
    
    this.logger.info('语音识别服务已初始化');
  }

  /**
   * 绑定事件处理函数
   * @private
   */
  bindEvents() {
    if (!this.recognition) return;

    // 开始识别
    this.recognition.onstart = (event) => {
      this.logger.info('语音识别已开始');
      setRecordingState(true);
      
      if (this.onStartCallback) {
        this.onStartCallback(event);
      }
    };

    // 识别结果
    this.recognition.onresult = (event) => {
      this.handleResult(event);
    };

    // 识别错误
    this.recognition.onerror = (event) => {
      this.handleError(event);
    };

    // 识别结束
    this.recognition.onend = () => {
      this.logger.info('语音识别已结束');
      
      // 如果还在录音状态，尝试重新开始
      if (isRecording()) {
        this.logger.debug('尝试重新启动语音识别');
        try {
          this.recognition.start();
        } catch (error) {
          this.logger.error('无法重新启动语音识别', error);
          this.stop();
        }
      } else {
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      }
    };

    // 音频开始
    this.recognition.onaudiostart = () => {
      this.logger.debug('音频捕获已开始');
    };

    // 声音开始
    this.recognition.onsoundstart = () => {
      this.logger.debug('检测到声音');
    };

    // 语音开始
    this.recognition.onspeechstart = () => {
      this.logger.debug('检测到语音');
    };

    // 语音结束
    this.recognition.onspeechend = () => {
      this.logger.debug('语音已结束');
    };
  }

  /**
   * 处理识别结果
   * @private
   * @param {SpeechRecognitionEvent} event - 识别事件
   */
  handleResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';

    // 遍历所有结果
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence;

      this.logger.debug(`识别结果: "${transcript}" (置信度: ${confidence})`);

      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // 调用回调函数
    if (this.onResultCallback) {
      this.onResultCallback({
        final: finalTranscript,
        interim: interimTranscript,
        fullText: finalTranscript + interimTranscript,
        isFinal: finalTranscript.length > 0
      });
    }
  }

  /**
   * 处理识别错误
   * @private
   * @param {SpeechRecognitionErrorEvent} event - 错误事件
   */
  handleError(event) {
    this.logger.error('语音识别错误', event.error);

    // 映射错误消息
    const errorMessages = {
      'not-allowed': APP_CONFIG.status.messages.errorMicNotAllowed,
      'no-speech': APP_CONFIG.status.messages.errorNoSpeech,
      'audio-capture': APP_CONFIG.status.messages.errorAudioCapture,
      'network': APP_CONFIG.status.messages.errorNetwork,
      'aborted': '语音识别已中止',
      'not-allowed': '麦克风权限被拒绝'
    };

    const errorMessage = errorMessages[event.error] || 
                          `${APP_CONFIG.status.messages.errorSpeechRecognition}: ${event.error}`;

    // 停止识别
    this.stop();

    // 调用错误回调
    if (this.onErrorCallback) {
      this.onErrorCallback({
        error: event.error,
        message: errorMessage
      });
    }
  }

  /**
   * 开始语音识别
   * @param {string} [language] - 语言代码（如 'zh-CN'）
   * @returns {boolean} 是否成功启动
   */
  start(language) {
    if (!this.isSupported) {
      this.logger.error('语音识别不被支持');
      return false;
    }

    if (isRecording()) {
      this.logger.warn('语音识别已经在运行中');
      return false;
    }

    // 设置语言
    if (language) {
      this.recognition.lang = language;
      this.logger.debug(`设置语音识别语言: ${language}`);
    }

    try {
      this.recognition.start();
      this.logger.info('语音识别已启动');
      return true;
    } catch (error) {
      this.logger.error('启动语音识别失败', error);
      return false;
    }
  }

  /**
   * 停止语音识别
   */
  stop() {
    if (!this.recognition) return;

    try {
      this.recognition.stop();
      setRecordingState(false);
      this.logger.info('语音识别已停止');
    } catch (error) {
      this.logger.error('停止语音识别失败', error);
    }
  }

  /**
   * 设置结果回调函数
   * @param {Function} callback - 回调函数
   */
  onResult(callback) {
    this.onResultCallback = callback;
  }

  /**
   * 设置错误回调函数
   * @param {Function} callback - 回调函数
   */
  onError(callback) {
    this.onErrorCallback = callback;
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
   * 检查是否支持语音识别
   * @returns {boolean} 是否支持
   */
  isBrowserSupported() {
    return this.isSupported;
  }

  /**
   * 获取支持的语言列表（注意：Web Speech API 不提供此功能，返回配置中的语言）
   * @returns {Array<{code: string, name: string}>} 语言列表
   */
  getSupportedLanguages() {
    return APP_CONFIG.language.supportedLanguages;
  }
}

/**
 * 语音识别服务单例实例
 * @type {SpeechRecognitionService}
 */
const speechRecognitionService = new SpeechRecognitionService();

/**
 * 便捷函数：开始语音识别
 * @param {string} [language] - 语言代码
 * @returns {boolean} 是否成功启动
 */
function startSpeechRecognition(language) {
  return speechRecognitionService.start(language);
}

/**
 * 便捷函数：停止语音识别
 */
function stopSpeechRecognition() {
  speechRecognitionService.stop();
}

export {
  // 服务类
  SpeechRecognitionService,
  
  // 单例实例
  speechRecognitionService,
  
  // 便捷函数
  startSpeechRecognition,
  stopSpeechRecognition
};
