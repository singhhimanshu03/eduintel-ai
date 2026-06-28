import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Company } from '../../types';

interface PlacementState {
  selectedCompany: Company | null;
  selectedDriveId: string | null;
}

const placementSlice = createSlice({
  name: 'placement',
  initialState: { selectedCompany: null, selectedDriveId: null } as PlacementState,
  reducers: {
    setSelectedCompany(state, action: PayloadAction<Company | null>) {
      state.selectedCompany = action.payload;
    },
    setSelectedDriveId(state, action: PayloadAction<string | null>) {
      state.selectedDriveId = action.payload;
    },
  },
});

export const { setSelectedCompany, setSelectedDriveId } = placementSlice.actions;
export default placementSlice.reducer;
