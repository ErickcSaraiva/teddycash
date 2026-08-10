import { API_BASE_URL, API_UNAVAILABLE_MESSAGE } from '../config/api';
import { sessionStorage } from './sessionStorage';

// Client HTTP alinhado ao contrato REAL do backend
// (src/controllers/accountController.ts), não ao mock antigo.
//
// GET /balance/:userId       -> { user_id, balance, cashback }
// GET /transactions/:userId  -> { items, pagination }
// POST /machine-authorizations -> autorizacao pendente para QR/NFC

// Em dispositivo físico, configure EXPO_PUBLIC_API_BASE_URL no .env.local
// com o endereço acessível do computador na rede local.
const TOKEN_KEY = 'teddycash_token';

export type BalanceResponse = {
  user_id: string;
  balance: number;
  cashback: number;
};

export type TransactionResponse = {
  id: string;
  user_id: string;
  amount: number;
  absolute_amount: number;
  direction: 'CREDIT' | 'DEBIT';
  machine_id: string | null;
  channel: 'QR' | 'NFC' | null;
  type: string;
  created_at: string;
};

export type AuthorizationResult =
  | { status: 'pending'; authorizationId: string; authorizationToken: string; machinePayload: string; expiresAt: string }
  | { status: 'insufficient'; balance: number }
  | { status: 'not_found' }
  | { status: 'error' };

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function getAuthHeaders() {
  const token = await sessionStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
}

export async function getBalance(userId: string): Promise<BalanceResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/balance/${userId}`, { headers: headers as HeadersInit }).catch(() => { throw new Error(API_UNAVAILABLE_MESSAGE); });
  if (!res.ok) {
    throw new Error(`Falha ao buscar saldo (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getTransactions(userId: string): Promise<TransactionResponse[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/transactions/${userId}`, { headers: headers as HeadersInit }).catch(() => { throw new Error(API_UNAVAILABLE_MESSAGE); });
  if (!res.ok) {
    throw new Error(`Falha ao buscar transações (HTTP ${res.status})`);
  }
  const body = await res.json();
  return body.items;
}

export async function createMachineAuthorization(
  _userId: string,
  amount: number,
  machineId: string,
  method: 'QR' | 'NFC' = 'QR',
): Promise<AuthorizationResult> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeaders()),
  } as Record<string, string>;

  const res = await fetch(`${API_BASE_URL}/machine-authorizations`, {
    method: 'POST',
    headers: headers as HeadersInit,
    body: JSON.stringify({ amount, machine_id: machineId, channel: method }),
  }).catch(() => { throw new Error(API_UNAVAILABLE_MESSAGE); });

  const body = await parseJsonSafe(res);

  if (res.status === 201 && body?.status === 'pending') {
    return {
      status: 'pending',
      authorizationId: body.authorization_id,
      authorizationToken: body.authorization_token,
      machinePayload: body.machine_payload,
      expiresAt: body.expires_at,
    };
  }
  if (res.status === 409 && body?.error?.code === 'INSUFFICIENT_BALANCE') {
    return { status: 'insufficient', balance: body?.balance ?? 0 };
  }
  if (res.status === 404) {
    return { status: 'not_found' };
  }
  return { status: 'error' };
}

export type AuthorizationStatus = {
  authorization_id: string;
  status: 'pending' | 'processing' | 'consumed' | 'cancelled' | 'expired';
  consumed_at: string | null;
};

export async function getMachineAuthorizationStatus(authorizationId: string): Promise<AuthorizationStatus> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/machine-authorizations/${authorizationId}`, { headers: headers as HeadersInit }).catch(() => { throw new Error(API_UNAVAILABLE_MESSAGE); });
  if (!res.ok) throw new Error(`Falha ao consultar autorização (HTTP ${res.status})`);
  return res.json();
}

export async function simulateMachineConfirmation(machineId: string, authorizationToken: string) {
  if (!__DEV__) throw new Error('A simulação da máquina só pode ser usada em desenvolvimento.');
  const apiKey = process.env.EXPO_PUBLIC_DEMO_MACHINE_API_KEY ?? 'change-me-before-sharing';
  const res = await fetch(`${API_BASE_URL}/machine-authorizations/redeem`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Machine-Id': machineId,
    },
    body: JSON.stringify({ authorization_token: authorizationToken }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(body?.error?.message ?? `Falha na simulação (HTTP ${res.status})`);
  return body;
}
