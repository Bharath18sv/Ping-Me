import { apiClient } from '@/lib/axios';
import { UserPublic } from '@/schemas/user.schema';
import axios, { CancelToken } from 'axios';

export const userService = {
  async searchUsers(query: string, cancelToken?: CancelToken): Promise<UserPublic[]> {
    if (!query || query.trim().length < 2) return [];
    const res = await apiClient.get<UserPublic[]>('/users/search', {
      params: { q: query },
      cancelToken,
    });
    return res.data;
  },
};
