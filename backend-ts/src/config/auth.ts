import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET?.trim();

if (!jwtSecret) {
  throw new Error('JWT_SECRET não configurado.');
}

export const JWT_SECRET = jwtSecret;
