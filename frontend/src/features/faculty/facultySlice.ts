import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Faculty, SubjectAssignment } from '../../types';

interface FacultyState {
  selected: Faculty | null;
  subjectAssignments: SubjectAssignment[];
}

const facultySlice = createSlice({
  name: 'faculty',
  initialState: { selected: null, subjectAssignments: [] } as FacultyState,
  reducers: {
    setSelectedFaculty(state, action: PayloadAction<Faculty | null>) {
      state.selected = action.payload;
    },
    setSubjectAssignments(state, action: PayloadAction<SubjectAssignment[]>) {
      state.subjectAssignments = action.payload;
    },
  },
});

export const { setSelectedFaculty, setSubjectAssignments } = facultySlice.actions;
export default facultySlice.reducer;
