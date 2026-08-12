import { apiClient } from "@/lib/axios";
import { ConversationListItem } from "@/schemas/conversation.schema";
import { MessageItem } from "@/schemas/message.schema";
import { getSocket } from "@/lib/socket";

export interface PaginatedMessagesResponse {
  items: MessageItem[];
  next_cursor?: string | null;
  has_more: boolean;
}

export const chatService = {
  async getConversations(): Promise<ConversationListItem[]> {
    const res = await apiClient.get<ConversationListItem[]>("/conversations");
    return res.data;
  },

  async createConversation(userId: string): Promise<ConversationListItem> {
    const res = await apiClient.post<ConversationListItem>("/conversations", {
      user_id: userId,
    });
    return res.data;
  },

  async getMessages(
    conversationId: string,
    cursor?: string | null,
    limit = 30,
  ): Promise<PaginatedMessagesResponse> {
    const res = await apiClient.get<PaginatedMessagesResponse>(
      `/conversations/${conversationId}/messages`,
      {
        params: { cursor, limit },
      },
    );
    return res.data;
  },

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<MessageItem> {
    const res = await apiClient.post<MessageItem>(
      `/conversations/${conversationId}/messages`,
      { content, socket_id: getSocket().id ?? null },
    );
    return res.data;
  },

  async editMessage(
    messageId: string,
    content: string,
  ): Promise<MessageItem> {
    const res = await apiClient.patch<MessageItem>(`/messages/${messageId}`, {
      content,
      socket_id: getSocket().id ?? null,
    });
    return res.data;
  },

  async deleteMessage(messageId: string): Promise<MessageItem> {
    const res = await apiClient.delete<MessageItem>(`/messages/${messageId}`, {
      data: { socket_id: getSocket().id ?? null },
    });
    return res.data;
  },
};
