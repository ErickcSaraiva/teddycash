// src/services/gamesApi.ts
import * as Crypto from 'expo-crypto';

// Substitui pelo IP da tua máquina local (o mesmo do accountApi.ts)
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://192.168.101.13:8000';

export async function submitGameScore(userId: string, earnedCoins: number) {
  const timestamp = Date.now();
  
  // ATENÇÃO: Esta chave deve ser EXATAMENTE a mesma que configuraste no backend!
  const secret = "CHAVE_SECRETA_DO_TEU_JOGO"; 
  const stringToHash = `${userId}:${earnedCoins}:${timestamp}:${secret}`;
  
  // Gera o hash SHA-256 no telemóvel
  const clientHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    stringToHash
  );

  const res = await fetch(`${API_BASE}/games/reward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      earnedCoins,
      timestamp,
      clientHash
    }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao enviar pontuação (HTTP ${res.status})`);
  }

  return res.json();
}