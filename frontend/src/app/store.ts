import { configureStore } from '@reduxjs/toolkit';
import authReducer         from '../features/auth/authSlice';
import studentReducer      from '../features/students/studentSlice';
import attendanceReducer   from '../features/attendance/attendanceSlice';
import examReducer         from '../features/examinations/examSlice';
import feeReducer          from '../features/fees/feeSlice';
import placementReducer    from '../features/placement/placementSlice';
import aiReducer           from '../features/analytics/aiSlice';
import dashboardReducer    from '../features/analytics/dashboardSlice';
import facultyReducer      from '../features/faculty/facultySlice';
import notificationReducer from '../features/notifications/notificationSlice';

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    students:      studentReducer,
    attendance:    attendanceReducer,
    exam:          examReducer,
    fee:           feeReducer,
    placement:     placementReducer,
    ai:            aiReducer,
    dashboard:     dashboardReducer,
    faculty:       facultyReducer,
    notifications: notificationReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
