export default class ApiService {
  baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.API_BASE ?? 'http://192.168.101.13:8000';
  }

  async getBalance(userId: string): Promise<number> {
    const res = await fetch(`${this.baseUrl}/balance/${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.balance as number;
  }

  async transfer(userId: string, amount: number, machineId: string) {
    const res = await fetch(`${this.baseUrl}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, amount, machine_id: machineId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async getTransactions(userId: string) {
    const res = await fetch(`${this.baseUrl}/transactions/${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}
