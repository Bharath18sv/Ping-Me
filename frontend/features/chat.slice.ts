import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ConversationListItem } from '@/schemas/conversation.schema';
import { MessageItem } from '@/schemas/message.schema';
import { chatService } from '@/services/chat.service';

interface ChatState {
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  messages: Record<string, MessageItem[]>; // conversationId -> MessageItem[] (chronological order)
  pagination: Record<string, { nextCursor: string | null; hasMore: boolean; isLoading: boolean }>;
  isLoadingConversations: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  pagination: {},
  isLoadingConversations: false,
  error: null,
};

export const fetchConversationsThunk = createAsyncThunk('chat/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    return await chatService.getConversations();
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to load conversations');
  }
});

export const fetchMessagesThunk = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, cursor }: { conversationId: string; cursor?: string | null }, { rejectWithValue }) => {
    try {
      const res = await chatService.getMessages(conversationId, cursor);
      return { conversationId, ...res };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load messages');
    }
  }
);

export const sendMessageThunk = createAsyncThunk(
  'chat/sendMessage',
  async (
    { conversationId, content, tempId, currentUserId }: { conversationId: string; content: string; tempId: string; currentUserId: string },
    { rejectWithValue, dispatch }
  ) => {
    // Optimistic message addition
    const optimisticMessage: MessageItem = {
      id: tempId,
      temp_id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
    };

    dispatch(addOptimisticMessage(optimisticMessage));

    try {
      const realMessage = await chatService.sendMessage(conversationId, content);
      return { tempId, realMessage };
    } catch (err: any) {
      dispatch(removeOptimisticMessage({ conversationId, tempId }));
      return rejectWithValue(err.response?.data?.detail || 'Failed to send message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversationId(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },
    addOptimisticMessage(state, action: PayloadAction<MessageItem>) {
      const msg = action.payload;
      if (!state.messages[msg.conversation_id]) {
        state.messages[msg.conversation_id] = [];
      }
      state.messages[msg.conversation_id].push(msg);
    },
    removeOptimisticMessage(state, action: PayloadAction<{ conversationId: string; tempId: string }>) {
      const { conversationId, tempId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].filter((m) => m.temp_id !== tempId && m.id !== tempId);
      }
    },
    handleIncomingMessage(state, action: PayloadAction<MessageItem>) {
      const msg = action.payload;
      const convId = msg.conversation_id;

      if (!state.messages[convId]) {
        state.messages[convId] = [];
      }

      // Check if message already exists or if it replaces an optimistic message
      const existingIdx = state.messages[convId].findIndex((m) => m.id === msg.id || (msg.temp_id && m.temp_id === msg.temp_id));
      if (existingIdx !== -1) {
        state.messages[convId][existingIdx] = msg;
      } else {
        state.messages[convId].push(msg);
      }

      // Update conversation last message & unread count
      const conv = state.conversations.find((c) => c.id === convId);
      if (conv) {
        conv.last_message = msg;
        conv.updated_at = msg.created_at;
        if (state.activeConversationId !== convId) {
          conv.unread_count += 1;
        }
      }
    },
    clearUnreadCount(state, action: PayloadAction<string>) {
      const conv = state.conversations.find((c) => c.id === action.payload);
      if (conv) {
        conv.unread_count = 0;
      }
    },
    handleMessageRead(state, action: PayloadAction<{ conversation_id: string; message_ids: string[]; read_by: string }>) {
      const { conversation_id, message_ids } = action.payload;
      const msgs = state.messages[conversation_id];
      if (msgs && message_ids && message_ids.length > 0) {
        const idSet = new Set(message_ids);
        msgs.forEach((m) => {
          if (idSet.has(m.id)) {
            m.is_read = true;
          }
        });
      }
    },
    addConversation(state, action: PayloadAction<ConversationListItem>) {
      const exists = state.conversations.some((c) => c.id === action.payload.id);
      if (!exists) {
        state.conversations.unshift(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversationsThunk.pending, (state) => {
        state.isLoadingConversations = true;
        state.error = null;
      })
      .addCase(fetchConversationsThunk.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.isLoadingConversations = false;
      })
      .addCase(fetchConversationsThunk.rejected, (state, action) => {
        state.isLoadingConversations = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessagesThunk.pending, (state, action) => {
        const convId = action.meta.arg.conversationId;
        if (!state.pagination[convId]) {
          state.pagination[convId] = { nextCursor: null, hasMore: true, isLoading: true };
        } else {
          state.pagination[convId].isLoading = true;
        }
      })
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        const { conversationId, items, next_cursor, has_more } = action.payload;
        
        // History endpoint returns newest -> oldest. We prepend history items to existing list.
        const safeItems = items || [];
        const reversedItems = [...safeItems].reverse();
        const existingMessages = state.messages[conversationId] || [];

        // Deduplicate messages by id
        const messageMap = new Map<string, MessageItem>();
        reversedItems.forEach((m) => messageMap.set(m.id, m));
        existingMessages.forEach((m) => messageMap.set(m.id, m));

        // Sort chronologically by created_at
        const merged = Array.from(messageMap.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        state.messages[conversationId] = merged;
        state.pagination[conversationId] = {
          nextCursor: next_cursor ?? null,
          hasMore: has_more ?? false,
          isLoading: false,
        };
      })
      .addCase(fetchMessagesThunk.rejected, (state, action) => {
        const convId = action.meta.arg.conversationId;
        if (!state.pagination[convId]) {
          state.pagination[convId] = { nextCursor: null, hasMore: false, isLoading: false };
        } else {
          state.pagination[convId].isLoading = false;
        }
      })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        const { tempId, realMessage } = action.payload;
        const convId = realMessage.conversation_id;
        if (state.messages[convId]) {
          const idx = state.messages[convId].findIndex((m) => m.id === tempId || m.temp_id === tempId);
          if (idx !== -1) {
            state.messages[convId][idx] = realMessage;
          }
        }
      });
  },
});

export const {
  setActiveConversationId,
  addOptimisticMessage,
  removeOptimisticMessage,
  handleIncomingMessage,
  clearUnreadCount,
  handleMessageRead,
  addConversation,
} = chatSlice.actions;

export default chatSlice.reducer;
