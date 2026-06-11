import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { login as loginApi, logout as logoutApi, LoginParams, LoginResult } from '@/services/auth';
import { setToken, setRefreshToken, removeToken } from '@/utils/auth';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (params: LoginParams, { rejectWithValue }) => {
    try {
      const result = await loginApi(params);
      setToken(result.accessToken);
      setRefreshToken(result.refreshToken);
      return result;
    } catch (err) {
      return rejectWithValue((err as Error).message || '登录失败');
    }
  },
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try {
    await logoutApi();
  } finally {
    removeToken();
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || '登录失败';
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.isAuthenticated = false;
      });
  },
});

export const { setAuthenticated, clearError } = authSlice.actions;
export default authSlice.reducer;
