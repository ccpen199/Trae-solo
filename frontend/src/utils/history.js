export function addToHistory(item) {
  try {
    console.log('添加浏览历史:', item);
    let history = JSON.parse(localStorage.getItem('duoshan_history') || '[]');
    
    history = history.filter(h => !(h.id === item.id && h.type === item.type));
    
    history.unshift({
      ...item,
      timestamp: Date.now()
    });
    
    history = history.slice(0, 50);
    
    localStorage.setItem('duoshan_history', JSON.stringify(history));
    console.log('浏览历史已保存:', history);
  } catch (e) {
    console.error('保存浏览历史失败:', e);
  }
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('duoshan_history') || '[]');
  } catch (e) {
    return [];
  }
}

export function clearHistory() {
  localStorage.removeItem('duoshan_history');
}
