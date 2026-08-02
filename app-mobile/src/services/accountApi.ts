import * as SecureStore from 'expo-secure-store';

// Client HTTP alinhado ao contrato REAL do backend
// (src/controllers/accountController.ts), não ao mock antigo.
//
// GET /balance/:userId       -> { user_id, balance, cashback }
// GET /transactions/:userId  -> [{ id, user_id, amount, machine_id, type, created_at }]
// POST /transfer             -> { status, tx, balance } | { error, balance? }

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
  machine_id: string | null;
  type: string;
  created_at: string;
};

export type TransferResult =
  | { status: 'ok'; tx: TransactionResponse; balance: number }
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
  return res.json();
}

export async function transfer(
  userId: string,
  amount: number,
  machineId: string,
): Promise<TransferResult> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeaders()),
  } as Record<string, string>;

  const res = await fetch(`${API_BASE}/transfer`, {
    method: 'POST',
    headers: headers as HeadersInit,
    body: JSON.stringify({ amount, machine_id: machineId }),
  });

  const body = await parseJsonSafe(res);

  if (res.status === 200 && body?.status === 'ok') {
    return { status: 'ok', tx: body.tx, balance: body.balance };
  }
  if (res.status === 409) {
    return { status: 'insufficient', balance: body?.balance ?? 0 };
  }
  if (res.status === 404) {
    return { status: 'not_found' };
  }
  return { status: 'error' };
}