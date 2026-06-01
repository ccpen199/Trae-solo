import { plantingAPI } from '../services/api.js';
import { authStore } from './authStore.js';

export function createPlantingStore() {
  let state = {
    isPlanting: false,
    plantingId: null,
    duration: 0,
    remainingTime: 0,
    startTime: null,
    treeType: 'oak',
    isBush: false,
    isWithered: false
  };

  const listeners = new Set();
  let timerInterval = null;
  let visibilityCheckInterval = null;

  function setState(newState) {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function loadSavedPlanting() {
    const saved = localStorage.getItem('currentPlanting');
    if (saved) {
      try {
        const planting = JSON.parse(saved);
        const elapsed = Math.floor((Date.now() - new Date(planting.startTime).getTime()) / 1000);
        const remaining = planting.duration * 60 - elapsed;

        if (remaining > 0) {
          setState({
            isPlanting: true,
            plantingId: planting.plantingId,
            duration: planting.duration,
            remainingTime: remaining,
            startTime: planting.startTime,
            treeType: planting.treeType,
            isBush: planting.isBush,
            isWithered: false
          });
          startTimer();
          startVisibilityCheck();
        } else {
          localStorage.removeItem('currentPlanting');
        }
      } catch (e) {
        console.error('加载种植状态失败', e);
      }
    }
  }

  async function startPlanting(duration, treeType = 'oak') {
    localStorage.removeItem('currentPlanting');
    
    const result = await plantingAPI.start(duration, treeType);
    
    const actualDuration = duration || result.duration;
    
    setState({
      isPlanting: true,
      plantingId: result.id,
      duration: actualDuration,
      remainingTime: actualDuration * 60,
      startTime: new Date().toISOString(),
      treeType: result.treeType,
      isBush: actualDuration < 25,
      isWithered: false
    });

    localStorage.setItem('currentPlanting', JSON.stringify({
      plantingId: result.id,
      duration: actualDuration,
      startTime: new Date().toISOString(),
      treeType: result.treeType,
      isBush: actualDuration < 25
    }));

    startTimer();
    startVisibilityCheck();
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      const newRemaining = state.remainingTime - 1;
      if (newRemaining <= 0) {
        completePlanting();
        setState({ remainingTime: 0 });
      } else {
        setState({ remainingTime: newRemaining });
      }
    }, 1000);
  }

  function startVisibilityCheck() {
    if (visibilityCheckInterval) clearInterval(visibilityCheckInterval);
    
    visibilityCheckInterval = setInterval(() => {
      if (document.hidden) {
        const timeSinceStart = (Date.now() - new Date(state.startTime).getTime()) / 1000;
        if (timeSinceStart > 10 && !state.isWithered) {
          handleWither();
        }
      }
    }, 1000);
  }

  async function completePlanting() {
    clearInterval(timerInterval);
    clearInterval(visibilityCheckInterval);
    
    try {
      const result = await plantingAPI.complete(state.plantingId, state.duration);
      if (!result.isWithered) {
        authStore.updateUser(result.user);
      }
    } catch (e) {
      console.error('完成种植失败', e);
    }

    localStorage.removeItem('currentPlanting');
    setState({
      isPlanting: false,
      plantingId: null,
      duration: 0,
      remainingTime: 0,
      startTime: null,
      treeType: 'oak',
      isBush: false,
      isWithered: false
    });
  }

  async function handleWither() {
    if (state.isWithered) return;
    
    setState({ isWithered: true });
    clearInterval(timerInterval);
    clearInterval(visibilityCheckInterval);
    
    try {
      await plantingAPI.wither(state.plantingId);
    } catch (e) {
      console.error('枯萎处理失败', e);
    }

    localStorage.removeItem('currentPlanting');
    setTimeout(() => {
      setState({
        isPlanting: false,
        plantingId: null,
        duration: 0,
        remainingTime: 0,
        startTime: null,
        treeType: 'oak',
        isBush: false,
        isWithered: false
      });
    }, 3000);
  }

  async function giveUp() {
    const timeSinceStart = (Date.now() - new Date(state.startTime).getTime()) / 1000;
    
    if (timeSinceStart < 10) {
      clearInterval(timerInterval);
      clearInterval(visibilityCheckInterval);
      localStorage.removeItem('currentPlanting');
      
      try {
        await plantingAPI.wither(state.plantingId);
      } catch (e) {
        console.error('放弃种植失败', e);
      }

      setState({
        isPlanting: false,
        plantingId: null,
        duration: 0,
        remainingTime: 0,
        startTime: null,
        treeType: 'oak',
        isBush: false,
        isWithered: false
      });
    } else {
      await handleWither();
    }
  }

  return {
    getState: () => state,
    setState,
    subscribe,
    loadSavedPlanting,
    startPlanting,
    completePlanting,
    giveUp
  };
}

export const plantingStore = createPlantingStore();
