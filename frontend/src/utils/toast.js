let toastTimeout = null;

export const showToast = (message, duration = 2000) => {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  toastTimeout = setTimeout(() => {
    toast.remove();
  }, duration);
};
