export type PrivacyRequest = {
  id: string; type: 'EXPORT' | 'DELETION';
  status: 'AWAITING_CONFIRMATION' | 'PENDING_REVIEW' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  requested_at: string; confirmed_at?: string | null; processed_at?: string | null; cancelled_at?: string | null;
};
export type ConsentPurpose = { purpose: 'PUBLIC_AVATAR_HOSTING'; version: string; title: string; description: string; required: false; granted: boolean };
export type PrivacyOverview = {
  notice: { currentVersion: string; effectiveDate: string; title: string; history: readonly { version: string; effectiveDate: string; summary: string }[] };
  account: { user_id: string; username: string; email: string; avatar_url: string | null; created_at: string; updated_at: string; privacy_status: string };
  consent_purposes: ConsentPurpose[]; consent_history: unknown[]; requests: PrivacyRequest[];
};
export type PrivacyTransport = { get<T>(path: string): Promise<T>; post<T>(path: string, body: unknown): Promise<T>; put<T>(path: string, body: unknown): Promise<T> };

export function createPrivacyApi(transport: PrivacyTransport) {
  return {
    overview: () => transport.get<PrivacyOverview>('/privacy'),
    requestExport: (password: string) => transport.post<{ request: PrivacyRequest; export: unknown }>('/privacy/requests/export', { password }),
    requestDeletion: (password: string) => transport.post<{ request: PrivacyRequest }>('/privacy/requests/deletion', { password }),
    confirmDeletion: (requestId: string, password: string) => transport.post<{ request: PrivacyRequest }>(`/privacy/requests/${encodeURIComponent(requestId)}/confirm`, { password }),
    cancelDeletion: (requestId: string, password: string) => transport.post<{ request: PrivacyRequest }>(`/privacy/requests/${encodeURIComponent(requestId)}/cancel`, { password }),
    setConsent: (purpose: ConsentPurpose['purpose'], granted: boolean, password: string) => transport.put<{ purpose: string; granted: boolean; changed_at: string | null }>('/privacy/consents', { purpose, granted, password }),
  };
}
