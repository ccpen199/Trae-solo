/**
 * @fileoverview 状态管理模块
 * @description 管理应用的全局状态，包括录音状态、翻译状态等
 * @version 1.0.0
 */

import { logger } from '../utils/index.js';

/**
 * 应用状态类型定义
 * @typedef {Object} AppState
 * @property {boolean} isRecording - 是否正在录音
 * @property {boolean} isTranslating - 是否正在翻译
 * @property {boolean} isSpeaking - 是否正在朗读
 * @property {string} currentStatus - 当前状态消息
 * @property {string} statusType - 状态类型
 * @property {string} sourceLanguage - 源语言
 * @property {string} targetLanguage - 目标语言
 * @property {string} sourceText - 源文本
 * @property {string} targetText - 目标文本
 */

/**
 * 初始状态
 * @type {AppState}
 */
const INITIAL_STATE = {
  isRecording: false,
  isTranslating: false,
  isSpeaking: false,
  currentStatus: '',
  statusType: '',
  sourceLanguage: '',
  targetLanguage: '',
  sourceText: '',
  targetText: ''
};

/**
 * 当前应用状态
 * @type {AppState}
 */
let currentState = { ...INITIAL_STATE };

/**
 * 状态变更监听器集合
 * @type {Map<string, Set<Function>>}
 */
const listeners = new Map();

/**
 * 获取当前状态
 * @returns {AppState} 当前状态的深拷贝
 */
function getState() {
  return { ...currentState };
}

/**
 * 更新状态
 * @param {Partial<AppState>} newState - 新状态（部分更新）
 */
function setState(newState) {
  const prevState = { ...currentState };
  currentState = { ...currentState, ...newState };
  
  logger.debug('状态更新', { prev: prevState, next: currentState });
  
  // 通知所有监听器
  notifyListeners(prevState, currentState);
}

/**
 * 重置状态到初始值
 */
function resetState() {
  const prevState = { ...currentState };
  currentState = { ...INITIAL_STATE };
  
  logger.debug('状态已重置');
  notifyListeners(prevState, currentState);
}

/**
 * 订阅状态变更
 * @param {string} key - 状态键名，或 '*' 表示监听所有变更
 * @param {Function} callback - 回调函数，参数为 (newValue, oldValue, state)
 * @returns {Function} 取消订阅函数
 */
function subscribe(key, callback) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  
  const listenerSet = listeners.get(key);
  listenerSet.add(callback);
  
  logger.debug(`已订阅状态: ${key}`);
  
  // 返回取消订阅函数
  return () => {
    if (listeners.has(key)) {
      listeners.get(key).delete(callback);
      logger.debug(`已取消订阅状态: ${key}`);
    }
  };
}

/**
 * 通知所有监听器
 * @param {AppState} prevState - 之前的状态
 * @param {AppState} nextState - 新的状态
 */
function notifyListeners(prevState, nextState) {
  // 通知 '*' 监听器（监听所有变更）
  if (listeners.has('*')) {
    listeners.get('*').forEach(callback => {
      try {
        callback(nextState, prevState, nextState);
      } catch (error) {
        logger.error('状态监听器执行失败', error);
      }
    });
  }
  
  // 通知特定键的监听器
  Object.keys(nextState).forEach(key => {
    if (prevState[key] !== nextState[key] && listeners.has(key)) {
      listeners.get(key).forEach(callback => {
        try {
          callback(nextState[key], prevState[key], nextState);
        } catch (error) {
          logger.error(`状态监听器执行失败 (${key})`, error);
        }
      });
    }
  });
}

/**
 * 设置录音状态
 * @param {boolean} isRecording - 是否正在录音
 */
function setRecordingState(isRecording) {
  setState({ isRecording });
}

/**
 * 设置翻译状态
 * @param {boolean} isTranslating - 是否正在翻译
 */
function setTranslatingState(isTranslating) {
  setState({ isTranslating });
}

/**
 * 设置朗读状态
 * @param {boolean} isSpeaking - 是否正在朗读
 */
function setSpeakingState(isSpeaking) {
  setState({ isSpeaking });
}

/**
 * 设置状态消息
 * @param {string} message - 状态消息
 * @param {string} type - 状态类型
 */
function setStatus(message, type) {
  setState({
    currentStatus: message,
    statusType: type
  });
}

/**
 * 清除状态消息
 */
function clearStatus() {
  setState({
    currentStatus: '',
    statusType: ''
  });
}

/**
 * 设置语言
 * @param {string} source - 源语言
 * @param {string} target - 目标语言
 */
function setLanguages(source, target) {
  setState({
    sourceLanguage: source,
    targetLanguage: target
  });
}

/**
 * 设置文本
 * @param {string} source - 源文本
 * @param {string} target - 目标文本
 */
function setTexts(source, target) {
  setState({
    sourceText: source,
    targetText: target
  });
}

/**
 * 获取录音状态
 * @returns {boolean} 是否正在录音
 */
function isRecording() {
  return currentState.isRecording;
}

/**
 * 获取翻译状态
 * @returns {boolean} 是否正在翻译
 */
function isTranslating() {
  return currentState.isTranslating;
}

/**
 * 获取朗读状态
 * @returns {boolean} 是否正在朗读
 */
function isSpeaking() {
  return currentState.isSpeaking;
}

/**
 * 检查应用是否处于忙碌状态
 * @returns {boolean} 是否忙碌
 */
function isBusy() {
  return currentState.isRecording || currentState.isTranslating || currentState.isSpeaking;
}

export {
  // 核心状态管理
  getState,
  setState,
  resetState,
  subscribe,
  
  // 状态设置
  setRecordingState,
  setTranslatingState,
  setSpeakingState,
  setStatus,
  clearStatus,
  setLanguages,
  setTexts,
  
  // 状态查询
  isRecording,
  isTranslating,
  isSpeaking,
  isBusy,
  
  // 常量
  INITIAL_STATE
};
