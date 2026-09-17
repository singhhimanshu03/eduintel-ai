import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  userId: string | null;
  institutionId: string | null;
  isAuthenticated: boolean;
}

/**
 * Decode the payload section of a JWT without verifying the signature.
 * Verification is done server-side (API gateway); here we just need the claims
 * to populate the Redux store (userId, institutionId) that the backend omits
 * from the login response body.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded.padEnd(padded.length + (4 - (padded.length % 4)) % 4, '='));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function loadInitialState(): AuthState {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored) as AuthState;
      // Validate the stored state has the minimum required shape
      if (typeof parsed === 'object' && parsed !== null && 'isAuthenticated' in parsed) {
        return parsed;
      }
    }
  } catch {
    localStorage.removeItem('auth');
  }
  return {
    accessToken: null,
    refreshToken: null,
    role: null,
    userId: null,
    institutionId: null,
    isAuthenticated: false,
  };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        role: string;
        userId?: string;
        institutionId?: string;
      }>
    ) {
      state.accessToken  = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.role         = action.payload.role;

      // Prefer explicit fields from payload (backend v2+).
      // Fall back to decoding the JWT so userId/institutionId are never null.
      if (action.payload.userId) {
        state.userId        = action.payload.userId;
        state.institutionId = action.payload.institutionId ?? null;
      } else {
        const claims = decodeJwtPayload(action.payload.accessToken);
        state.userId        = (claims?.userId as string)        ?? null;
        state.institutionId = (claims?.institutionId as string) ?? null;
      }

      state.isAuthenticated = true;
      localStorage.setItem('auth', JSON.stringify(state));
    },

    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string | null }>) {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) state.refreshToken = action.payload.refreshToken;

      // Re-derive userId/institutionId from the new token in case they changed
      const claims = decodeJwtPayload(action.payload.accessToken);
      if (claims) {
        if (!state.userId)        state.userId        = (claims.userId as string)        ?? null;
        if (!state.institutionId) state.institutionId = (claims.institutionId as string) ?? null;
      }

      localStorage.setItem('auth', JSON.stringify(state));
    },

    logout(state) {
      state.accessToken    = null;
      state.refreshToken   = null;
      state.role           = null;
      state.userId         = null;
      state.institutionId  = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth');
    },
  },
});

export const { setCredentials, setTokens, logout } = authSlice.actions;
export default authSlice.reducer;
