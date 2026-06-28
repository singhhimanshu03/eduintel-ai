import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RiskLevel, RecommendationResult } from '../../types';

interface AIState {
  lastRiskLevel: RiskLevel | null;
  lastRecommendations: RecommendationResult | null;
}

const aiSlice = createSlice({
  name: 'ai',
  initialState: { lastRiskLevel: null, lastRecommendations: null } as AIState,
  reducers: {
    setLastRiskLevel(state, action: PayloadAction<RiskLevel | null>) {
      state.lastRiskLevel = action.payload;
    },
    setLastRecommendations(state, action: PayloadAction<RecommendationResult | null>) {
      state.lastRecommendations = action.payload;
    },
  },
});

export const { setLastRiskLevel, setLastRecommendations } = aiSlice.actions;
export default aiSlice.reducer;
