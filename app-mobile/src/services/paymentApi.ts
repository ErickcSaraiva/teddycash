import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://192.168.101.13:8000';
const TOKEN_KEY = 'teddycash_token';

export type CreditPackageResponse = {
  code: string;
  name: string;
  credits: number;
  amount_cents: number;
  teddy_coins: number;
};

export type PaymentOrderResponse = {
  id: string;
  package_code: string;
  amount_cents: number;
  credits: number;
  teddy_coins: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  expires_at: string;
  created_at?: string;
};

export type CreatePaymentOrderResponse = {
  order: PaymentOrderResponse;
  payment: {
    method: 'PIX';
    available: false;
    message: string;
  };
};

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
}

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchCreditPackages(): Promise<{ packages: CreditPackageResponse[] }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/credit-packages`, {
    headers: { 'Content-Type': 'application/json', ...headers },
  });

  if (!res.ok) {
    const body = await parseJson(res);
    throw new Error(body?.error ?? `Falha ao buscar pacotes (HTTP ${res.status})`);
  }

  return res.json();
}

export async function createPixPaymentOrder(
  packageCode: string,
): Promise<CreatePaymentOrderResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/payment-orders/pix`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ package_code: packageCode }),
  });

  if (!res.ok) {
    const body = await parseJson(res);
    throw new Error(body?.error ?? `Falha ao criar pedido (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchPaymentOrder(orderId: string): Promise<PaymentOrderResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/payment-orders/${orderId}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
  });

  if (!res.ok) {
    const body = await parseJson(res);
    throw new Error(body?.error ?? `Falha ao buscar pedido (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchPaymentOrders(): Promise<PaymentOrderResponse[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/payment-orders`, {
    headers: { 'Content-Type': 'application/json', ...headers },
  });

  if (!res.ok) {
    const body = await parseJson(res);
    throw new Error(body?.error ?? `Falha ao buscar pedidos (HTTP ${res.status})`);
  }

  return res.json();
}
