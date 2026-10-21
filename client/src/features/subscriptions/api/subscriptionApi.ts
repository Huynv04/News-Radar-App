import apiClient from '../../../api/client';
import type {
    SubscriptionDto,
    CreateSubscriptionRequest,
    UpdateSubscriptionRequest,
} from '../types';

export const subscriptionApi = {
    getAll: async (): Promise<SubscriptionDto[]> => {
        const res = await apiClient.get<SubscriptionDto[]>('/subscriptions');
        return res.data;
    },

    create: async (data: CreateSubscriptionRequest): Promise<SubscriptionDto> => {
        const res = await apiClient.post<SubscriptionDto>('/subscriptions', data);
        return res.data;
    },

    update: async (id: string, data: UpdateSubscriptionRequest): Promise<SubscriptionDto> => {
        const res = await apiClient.put<SubscriptionDto>(`/subscriptions/${id}`, data);
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/subscriptions/${id}`);
    },
};
