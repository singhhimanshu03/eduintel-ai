import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '../../types';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  panelOpen: boolean;
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, panelOpen: false } as NotificationState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.items = action.payload;
      state.unreadCount = action.payload.filter(n => n.delivery_status !== 'delivered').length;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload);
      if (action.payload.delivery_status !== 'delivered') {
        state.unreadCount += 1;
      }
    },
    markRead(state, action: PayloadAction<string>) {
      const item = state.items.find(n => n.id === action.payload);
      if (item && item.delivery_status !== 'delivered') {
        item.delivery_status = 'delivered';
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead(state) {
      state.items.forEach(n => (n.delivery_status = 'delivered'));
      state.unreadCount = 0;
    },
    togglePanel(state) {
      state.panelOpen = !state.panelOpen;
    },
    closePanel(state) {
      state.panelOpen = false;
    },
  },
});

export const { setNotifications, addNotification, markRead, markAllRead, togglePanel, closePanel } =
  notificationSlice.actions;
export default notificationSlice.reducer;
