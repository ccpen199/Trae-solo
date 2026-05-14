export function addToFavorites(item) {
  try {
    let favorites = JSON.parse(localStorage.getItem('duoshan_favorites') || '[]');
    
    const exists = favorites.some(f => f.id === item.id && f.type === item.type);
    if (exists) return false;
    
    favorites.unshift({
      ...item,
      timestamp: Date.now()
    });
    
    localStorage.setItem('duoshan_favorites', JSON.stringify(favorites));
    return true;
  } catch (e) {
    console.error('保存收藏失败:', e);
    return false;
  }
}

export function removeFromFavorites(id, type) {
  try {
    let favorites = JSON.parse(localStorage.getItem('duoshan_favorites') || '[]');
    favorites = favorites.filter(f => !(f.id === id && f.type === type));
    localStorage.setItem('duoshan_favorites', JSON.stringify(favorites));
    return true;
  } catch (e) {
    return false;
  }
}

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('duoshan_favorites') || '[]');
  } catch (e) {
    return [];
  }
}

export function isFavorite(id, type) {
  try {
    const favorites = JSON.parse(localStorage.getItem('duoshan_favorites') || '[]');
    return favorites.some(f => f.id === id && f.type === type);
  } catch (e) {
    return false;
  }
}

export function clearFavorites() {
  localStorage.removeItem('duoshan_favorites');
}
