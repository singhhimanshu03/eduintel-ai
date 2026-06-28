import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FeeStatus } from '../../types';

interface FeeState {
  filterStatus: FeeStatus | 'all';
}

const feeSlice = createSlice({
  name: 'fee',
  initialState: { filterStatus: 'all' } as FeeState,
  reducers: {
    setFilterStatus(state, action: PayloadAction<FeeStatus | 'all'>) {
      state.filterStatus = action.payload;
    },
  },
});

export const { setFilterStatus } = feeSlice.actions;
export default feeSlice.reducer;
