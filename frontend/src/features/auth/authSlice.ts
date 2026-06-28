import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  userId: string | null;
  isAuthenticated: boolean;
}

const stored = localStorage.getItem('auth');
const initial: AuthState = stored ? JSON.parse(stored) : {
  accessToken: null, refreshToken: null, role: null, userId: null, isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; refreshToken: string; role: string; userId?: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.role = action.payload.role;
      state.userId = action.payload.userId ?? null;
      state.isAuthenticated = true;
      localStorage.setItem('auth', JSON.stringify(state));
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string | null }>) {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('auth', JSON.stringify(state));
    },
    logout(state) {
      state.accessToken = null; state.refreshToken = null;
      state.role = null; state.userId = null; state.isAuthenticated = false;
      localStorage.removeItem('auth');
    },
  },
});

export const { setCredentials, setTokens, logout } = authSlice.actions;
export default authSlice.reducer;
