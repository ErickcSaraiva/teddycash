import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { JWT_SECRET } from '../config/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorResponse(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

export const register = async (req: Request, res: Response) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (username.length < 3) {
      return errorResponse(res, 400, 'INVALID_USERNAME', 'O nome de usuário deve ter pelo menos 3 caracteres.');
    }
    if (!EMAIL_PATTERN.test(email)) {
      return errorResponse(res, 400, 'INVALID_EMAIL', 'Informe um e-mail válido.');
    }
    if (password.length < 6) {
      return errorResponse(res, 400, 'INVALID_PASSWORD', 'A senha deve ter pelo menos 6 caracteres.');
    }

    // 1. Verificar se o email ou username já existem no banco
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return errorResponse(res, 409, 'USER_ALREADY_EXISTS', 'Este e-mail ou nome de usuário já está cadastrado.');
    }

    // 2. A Mágica da Segurança: Encriptar a password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Salvar o novo utilizador no banco de dados
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword, 
      }
    });

    // 4. Responder ao aplicativo mobile que deu tudo certo!
    return res.status(201).json({ 
      success: true, 
      message: "Conta criada com sucesso!",
      user_id: newUser.id,
      username: newUser.username,
    });

  } catch (error: unknown) {
    console.error("Erro no registro:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return errorResponse(res, 409, 'USER_ALREADY_EXISTS', 'Este e-mail ou nome de usuário já está cadastrado.');
    }
    return errorResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'O servidor encontrou um erro ao criar a conta.');
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!EMAIL_PATTERN.test(email) || password.length < 6) {
      return errorResponse(res, 400, 'INVALID_CREDENTIALS_FORMAT', 'Informe um e-mail válido e uma senha com pelo menos 6 caracteres.');
    }

    // 1. Procurar o utilizador pelo email e obter a senha criptografada para validação
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
      },
    });
    
    if (!user) {
      return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
    }

    // 2. Comparar a senha digitada com o hash guardado no banco
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
    }

    // 3. Sucesso! Retornar os dados básicos (idealmente, depois adicionaremos um Token JWT aqui)
    const token = jwt.sign(
    {
        userId: user.id,
        username: user.username
    },
    JWT_SECRET,
    {
        expiresIn: "7d"
    }
);

return res.status(200).json({
    access_token: token,
    user_id: user.id,
    username: user.username
});

  } catch (error: unknown) {
    console.error("Erro no login:", error);
    return errorResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'O servidor encontrou um erro ao fazer login.');
  }
};
