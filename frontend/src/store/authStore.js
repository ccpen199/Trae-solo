export function createAuthStore() {
  let state = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true
  };

  const listeners = new Set();

  function setState(newState) {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function initialize() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setState({
          token,
          user,
          isAuthenticated: true,
          loading: false
        });
      } catch {
        setState({ loading: false });
      }
    } else {
      setState({ loading: false });
    }
  }

  async function login(username, password) {
    const { authAPI } = await import('../services/api.js');
    const result = await authAPI.login(username, password);
    
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    setState({
      token: result.token,
      user: result.user,
      isAuthenticated: true
    });
    
    return result;
  }

  async function register(username, password) {
    const { authAPI } = await import('../services/api.js');
    const result = await authAPI.register(username, password);
    
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    setState({
      token: result.token,
      user: result.user,
      isAuthenticated: true
    });
    
    return result;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({
      token: null,
      user: null,
      isAuthenticated: false
    });
  }

  function updateUser(userData) {
    const newUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(newUser));
    setState({ user: newUser });
  }

  return {
    getState: () => state,
    setState,
    subscribe,
    initialize,
    login,
    register,
    logout,
    updateUser
  };
}

export const authStore = createAuthStore();
