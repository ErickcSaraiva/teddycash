// backend-ts/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';

// Estendemos a tipagem do Express para que o TypeScript reconheça o req.userId
export interface AuthRequest extends Request {
  userId?: string;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Pega o token do cabeçalho da requisição
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  // 2. O token vem no formato "Bearer eyJhbGc...", então separamos pelo espaço
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido.' });
  }

  const token = parts[1];

  try {
    // 3. Tenta abrir o cofre usando a mesma senha secreta do login
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // 4. Se deu certo, salva o ID do usuário na requisição para ser usado pelas próximas funções
    req.userId = decoded.userId; 
    
    // 5. Manda a requisição seguir em frente para o controller!
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
