import * as SecureStore from 'expo-secure-store';

// Client HTTP alinhado ao contrato REAL do backend
// (src/controllers/accountController.ts), não ao mock antigo.
//
// GET /balance/:userId       -> { user_id, balance, cashback }
// GET /transactions/:userId  -> { items, pagination }
// POST /machine-authorizations -> autorizacao pendente para QR/NFC

// Se estiver testando em dispositivo físico, troque pelo IP da sua
// máquina na rede local (ex: 'http://192.168.101.13:8000'), igual
// já é feito no restante do app.
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://192.168.101.13:8000';
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
  | { status: 'pending'; authorizationToken: string; machinePayload: string; expiresAt: string }
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
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
}

export async function getBalance(userId: string): Promise<BalanceResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/balance/${userId}`, { headers: headers as HeadersInit });
  if (!res.ok) {
    throw new Error(`Falha ao buscar saldo (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getTransactions(userId: string): Promise<TransactionResponse[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/transactions/${userId}`, { headers: headers as HeadersInit });
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

  const res = await fetch(`${API_BASE}/machine-authorizations`, {
    method: 'POST',
    headers: headers as HeadersInit,
    body: JSON.stringify({ amount, machine_id: machineId, channel: method }),
  });

  const body = await parseJsonSafe(res);

  if (res.status === 201 && body?.status === 'pending') {
    return {
      status: 'pending',
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
