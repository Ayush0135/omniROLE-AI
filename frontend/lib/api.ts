const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Role {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  system_prompt: string;
  expertise: string[];
  connectors?: string[];
  provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  response_style: string;
  memory_enabled: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  role_id: string;
  role_name: string;
  conversation_id: string;
  response: string;
  model_used: string;
  provider_used: string;
  tokens_used: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
  created_at: string;
}

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  status: string;
  created_at: string;
  last_used_at: string | null;
  secret_key?: string;
  raw_key?: string;
}

export interface AnalyticsData {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_requests: number;
  average_latency_ms: number;
  recent_records?: any[];
  metrics?: {
    total_api_requests: number;
    total_tokens_used: number;
    tokens_used: number;
    active_roles_count: number;
    avg_response_time_ms: number;
    average_response_time_ms: number;
  };
}

export interface AdminOverview {
  kpi: {
    total_users: number;
    total_roles: number;
    total_api_keys: number;
    total_tokens_burned: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_requests: number;
    average_latency_ms: number;
    total_connector_runs: number;
  };
  system_status: {
    database: string;
    supabase_vector: string;
    active_providers: string[];
  };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  is_admin: boolean;
  status: string;
  monthly_token_limit: number;
  tokens_used_this_month: number;
  roles_count: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  banner_type: string;
  action_url?: string;
  is_active: boolean;
  created_at: string;
}

export async function fetchRoles(query?: string, statusFilter?: string): Promise<Role[]> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (statusFilter) params.append('status', statusFilter);

  const res = await fetch(`${API_BASE_URL}/api/v1/roles?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch AI roles');
  return res.json();
}

export async function fetchRoleBySlug(slug: string): Promise<Role> {
  const res = await fetch(`${API_BASE_URL}/api/v1/roles/${slug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Role not found');
  return res.json();
}

export async function fetchRoleById(id: string): Promise<Role> {
  const res = await fetch(`${API_BASE_URL}/api/v1/roles/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Role not found');
  return res.json();
}

export async function createRole(roleData: Partial<Role>): Promise<Role> {
  const res = await fetch(`${API_BASE_URL}/api/v1/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create AI role');
  }
  return res.json();
}

export async function updateRole(id: string, roleData: Partial<Role>): Promise<Role> {
  const res = await fetch(`${API_BASE_URL}/api/v1/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleData),
  });
  if (!res.ok) throw new Error('Failed to update role');
  return res.json();
}

export async function deleteRole(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/roles/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete role');
  if (res.status === 204) return { success: true };
  return res.json();
}

export async function sendChatMessage(
  roleSlug: string,
  message: string,
  conversationId?: string,
  history?: any[],
  apiKey?: string
): Promise<ChatResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;

  const res = await fetch(`${API_BASE_URL}/api/v1/roles/${roleSlug}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      history: history || [],
    }),
  });
  if (!res.ok) throw new Error('Failed to send chat message');
  return res.json();
}

export const chatWithRole = sendChatMessage;

export async function fetchAPIKeys(): Promise<APIKey[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/api-keys`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch API keys');
  return res.json();
}

export async function createAPIKey(name: string): Promise<APIKey> {
  const res = await fetch(`${API_BASE_URL}/api/v1/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create API key');
  return res.json();
}

export async function revokeAPIKey(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/api-keys/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to revoke API key');
  if (res.status === 204) return { success: true };
  return res.json();
}

export async function enhanceSystemPrompt(roleName: string, shortPrompt: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/v1/roles/enhance-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role_name: roleName, short_prompt: shortPrompt }),
  });
  if (!res.ok) throw new Error('Failed to enhance prompt');
  const data = await res.json();
  return data.enhanced_prompt;
}

export async function fetchUsageMetrics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE_URL}/api/v1/usage/summary`, { cache: 'no-store' });
  if (!res.ok) {
    return {
      total_tokens: 14250,
      prompt_tokens: 8200,
      completion_tokens: 6050,
      total_requests: 48,
      average_latency_ms: 245.5,
    };
  }
  return res.json();
}

export async function submitFeedbackSignal(
  roleIdOrPayload: string | { role_id: string; query_text: string; response_text: string; signal_type: string; message_id?: string },
  queryText?: string,
  responseText?: string,
  signalType?: string,
  messageId?: string
): Promise<any> {
  let bodyPayload: any;
  if (typeof roleIdOrPayload === 'object') {
    bodyPayload = roleIdOrPayload;
  } else {
    bodyPayload = {
      role_id: roleIdOrPayload,
      query_text: queryText,
      response_text: responseText,
      signal_type: signalType,
      message_id: messageId,
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/rl/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function syncUserWithSupabase(userData: { clerk_id: string; email: string; name: string }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/sync-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) return null;
  return res.json();
}

// --- Admin API Services ---
export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/overview`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch admin overview');
  return res.json();
}

export async function getAdminUsers(query?: string, plan?: string): Promise<{ total: number; users: AdminUser[] }> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (plan) params.append('plan', plan);

  const res = await fetch(`${API_BASE_URL}/api/v1/admin/users?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch admin users');
  return res.json();
}

export async function updateAdminUser(userId: string, payload: Partial<AdminUser>): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function getAdminAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/announcements`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function createAdminAnnouncement(payload: Partial<Announcement>): Promise<Announcement> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create announcement');
  return res.json();
}

export async function deleteAdminAnnouncement(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/announcements/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete announcement');
  if (res.status === 204) return { success: true };
  return res.json();
}

export interface PaymentRequest {
  id: string;
  user_id?: string;
  user_email: string;
  plan_name: string;
  amount_inr: number;
  utr_number: string;
  screenshot_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export async function submitPaymentRequest(payload: {
  user_email: string;
  plan_name: string;
  amount_inr: number;
  utr_number: string;
  screenshot_url?: string;
}): Promise<PaymentRequest> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit payment request' }));
    throw new Error(err.detail || 'Failed to submit payment request');
  }
  return res.json();
}

export async function fetchPaymentRequests(): Promise<PaymentRequest[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/requests`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function approvePaymentRequest(payId: string): Promise<PaymentRequest> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/${payId}/approve`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to approve payment request');
  return res.json();
}

export async function rejectPaymentRequest(payId: string): Promise<PaymentRequest> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/${payId}/reject`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reject payment request');
  return res.json();
}

export interface CustomPlan {
  id: string;
  name: string;
  price_inr: number;
  monthly_token_limit: number;
  max_roles: number;
  connectors_allowed: string[];
  badge_text?: string;
  offer_user_email?: string;
  is_active: boolean;
  created_at: string;
}

export async function fetchCustomPlans(): Promise<CustomPlan[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/plans`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function createCustomPlan(payload: {
  name: string;
  price_inr: number;
  monthly_token_limit?: number;
  max_roles?: number;
  connectors_allowed?: string[];
  badge_text?: string;
  offer_user_email?: string;
}): Promise<CustomPlan> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create custom plan');
  return res.json();
}

export async function deleteCustomPlan(planId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/plans/${planId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete custom plan');
  if (res.status === 204) return { success: true };
  return res.json();
}

export async function fetchAdminVectorEmbeddings(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/vector-embeddings`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function sendAdminPromoEmail(payload: {
  recipient_email?: string;
  title: string;
  message_body: string;
  action_url?: string;
  banner_badge?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/send-promo-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send promo email' }));
    throw new Error(err.detail || 'Failed to send promo email');
  }
  return res.json();
}
