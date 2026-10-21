// ── Subscription Types ────────────────────────────────────────────────────────

export interface SubscriptionDto {
    id: string;
    keyword: string;
    category?: string;
    channel: 'Email' | 'InApp';
    isActive: boolean;
    createdAt: string;
}

export interface CreateSubscriptionRequest {
    keyword: string;
    category?: string;
    channel: 'Email' | 'InApp';
}

export interface UpdateSubscriptionRequest {
    keyword: string;
    category?: string;
    channel: 'Email' | 'InApp';
    isActive: boolean;
}
