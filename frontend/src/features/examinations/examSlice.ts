import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ExamSchedule } from '../../types';

interface ExamState {
  selectedSchedule: ExamSchedule | null;
  activeSemester: number | null;
  activeAcademicYear: string;
}

const examSlice = createSlice({
  name: 'exam',
  initialState: {
    selectedSchedule: null,
    activeSemester: null,
    activeAcademicYear: new Date().getFullYear().toString(),
  } as ExamState,
  reducers: {
    setSelectedSchedule(state, action: PayloadAction<ExamSchedule | null>) {
      state.selectedSchedule = action.payload;
    },
    setActiveSemester(state, action: PayloadAction<number | null>) {
      state.activeSemester = action.payload;
    },
    setActiveAcademicYear(state, action: PayloadAction<string>) {
      state.activeAcademicYear = action.payload;
    },
  },
});

export const { setSelectedSchedule, setActiveSemester, setActiveAcademicYear } = examSlice.actions;
export default examSlice.reducer;
