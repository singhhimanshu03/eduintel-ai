import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Student } from '../../types';

interface StudentState {
  selected: Student | null;
  filters: { dept?: string; course?: string; semester?: string };
}

const studentSlice = createSlice({
  name: 'students',
  initialState: { selected: null, filters: {} } as StudentState,
  reducers: {
    setSelectedStudent(state, action: PayloadAction<Student | null>) {
      state.selected = action.payload;
    },
    setFilters(state, action: PayloadAction<StudentState['filters']>) {
      state.filters = action.payload;
    },
    clearFilters(state) {
      state.filters = {};
    },
  },
});

export const { setSelectedStudent, setFilters, clearFilters } = studentSlice.actions;
export default studentSlice.reducer;
