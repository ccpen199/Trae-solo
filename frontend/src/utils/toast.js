let toastTimeout = null;

export function showToast(message, duration = 2000) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
    clearTimeout(toastTimeout);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, duration);
}
