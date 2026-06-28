import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DashboardState {
  lastRefreshed: string | null;
  activeTab: string;
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { lastRefreshed: null, activeTab: 'overview' } as DashboardState,
  reducers: {
    setLastRefreshed(state, action: PayloadAction<string>) {
      state.lastRefreshed = action.payload;
    },
    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTab = action.payload;
    },
  },
});

export const { setLastRefreshed, setActiveTab } = dashboardSlice.actions;
export default dashboardSlice.reducer;
