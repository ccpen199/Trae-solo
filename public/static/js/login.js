document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');
  const roleOptions = document.querySelectorAll('.role-option');
  const quickLoginBtns = document.querySelectorAll('.quick-login-btn');
  
  let selectedRole = 'all';
  
  roleOptions.forEach(option => {
    option.addEventListener('click', () => {
      roleOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      selectedRole = option.dataset.role;
    });
  });
  
  quickLoginBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const username = btn.dataset.username;
      const password = btn.dataset.password;
      usernameInput.value = username;
      passwordInput.value = password;
    });
  });
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username) {
      showError('请输入用户名');
      return;
    }
    
    if (!password) {
      showError('请输入密码');
      return;
    }
    
    setLoading(true);
    hideError();
    
    try {
      const result = await auth.login(username, password);
      toast.success('登录成功！', '欢迎回来');
      
      setTimeout(() => {
        window.location.href = auth.getDashboardRoute();
      }, 500);
      
    } catch (error) {
      console.error('登录失败:', error);
      showError(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  });
  
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
  
  function hideError() {
    errorMessage.style.display = 'none';
  }
  
  function setLoading(loading) {
    if (loading) {
      loginBtn.classList.add('btn-loading');
      loginBtn.disabled = true;
    } else {
      loginBtn.classList.remove('btn-loading');
      loginBtn.disabled = false;
    }
  }
  
  usernameInput.focus();
});
