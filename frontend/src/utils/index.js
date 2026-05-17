export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return date.toLocaleDateString('zh-CN');
};

export const parseLyrics = (lyricsStr) => {
  if (!lyricsStr) return [];
  const lines = lyricsStr.split('\n');
  const lyrics = [];
  
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  lines.forEach((line) => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3].padEnd(3, '0'));
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      
      if (text) {
        lyrics.push({ time, text });
      }
    }
  });
  
  return lyrics.sort((a, b) => a.time - b.time);
};

export const canSubmitRecommendation = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  
  if (day >= 1 && day <= 4) {
    return hour >= 16 && hour < 24;
  }
  
  return day === 0 && hour >= 16 && hour < 24;
};

export const getSubmitTimeDescription = () => {
  return '投稿时间为每周日至周四 16:00-24:00';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const getStatusText = (status) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status) => {
  const colorMap = {
    pending: 'text-yellow-500',
    approved: 'text-green-500',
    rejected: 'text-red-500',
  };
  return colorMap[status] || 'text-gray-500';
};
