import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ClassSession } from '../../types';

interface AttendanceState {
  currentSession: ClassSession | null;
  selectedSemester: number | null;
}

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: { currentSession: null, selectedSemester: null } as AttendanceState,
  reducers: {
    setCurrentSession(state, action: PayloadAction<ClassSession | null>) {
      state.currentSession = action.payload;
    },
    setSelectedSemester(state, action: PayloadAction<number | null>) {
      state.selectedSemester = action.payload;
    },
  },
});

export const { setCurrentSession, setSelectedSemester } = attendanceSlice.actions;
export default attendanceSlice.reducer;
