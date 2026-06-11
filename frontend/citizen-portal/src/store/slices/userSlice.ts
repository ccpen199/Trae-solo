import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getUserInfo } from '@/services/auth';

interface UserInfo {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

interface UserState {
  info: UserInfo | null;
  loading: boolean;
}

const initialState: UserState = {
  info: null,
  loading: false,
};

export const fetchUserInfo = createAsyncThunk(
  'user/fetchInfo',
  async (_, { rejectWithValue }) => {
    try {
      return await getUserInfo();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo(state, action: PayloadAction<UserInfo>) {
      state.info = action.payload;
    },
    clearUserInfo(state) {
      state.info = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.info = action.payload as UserInfo;
      })
      .addCase(fetchUserInfo.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setUserInfo, clearUserInfo } = userSlice.actions;
export default userSlice.reducer;
