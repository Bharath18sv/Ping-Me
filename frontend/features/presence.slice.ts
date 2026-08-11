import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { act } from "react";

interface PresenceState {
  onlineUserIds: Record<string, boolean>;
  typingUsers: Record<string, Record<string, boolean>>; // conversationId -> userId -> isTyping
}

const initialState: PresenceState = {
  onlineUserIds: {},
  typingUsers: {},
};

const presenceSlice = createSlice({
  name: "presence",
  initialState,
  reducers: {
    setUserOnline(state, action: PayloadAction<{ user_id: string }>) {
      state.onlineUserIds[action.payload.user_id] = true;
    },
    setUserOffline(state, action: PayloadAction<{ user_id: string }>) {
      state.onlineUserIds[action.payload.user_id] = false;
    },
    setTypingStatus(
      state,
      action: PayloadAction<{
        conversation_id: string;
        user_id: string;
        is_typing: boolean;
      }>,
    ) {
      const { conversation_id, user_id, is_typing } = action.payload;
      if (!state.typingUsers[conversation_id]) {
        state.typingUsers[conversation_id] = {};
      }
      state.typingUsers[conversation_id][user_id] = is_typing;
    },
    setOnlineUsers(state, action: PayloadAction<string[]>) {
      state.onlineUserIds = {};

      for (const userId of action.payload) {
        state.onlineUserIds[userId] = true;
      }
    },
  },
});

export const { setUserOnline, setUserOffline, setTypingStatus, setOnlineUsers  } =
  presenceSlice.actions;
export default presenceSlice.reducer;
