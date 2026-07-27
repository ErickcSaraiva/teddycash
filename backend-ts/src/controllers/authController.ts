import { Request, Response } from 'express';
import { prisma } from '../config/prisma'; // <-- Importando o Prisma do teu ficheiro de configuração
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // 1. Verificar se o email ou username já existem no banco
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email ou username já estão em uso no TeddyCash." });
    }

    // 2. A Mágica da Segurança: Encriptar a password
    const salt = await bcrypt.genSalt(10); 
    const hashedPassword = await bcrypt.hash(password, salt); 

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
      userId: newUser.id 
    });

  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro interno do servidor ao criar conta." });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

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
      return res.status(401).json({ error: "Email ou senha incorretos." });
    }

    // 2. Comparar a senha digitada com o hash guardado no banco
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Email ou senha incorretos." });
    }

    // 3. Sucesso! Retornar os dados básicos (idealmente, depois adicionaremos um Token JWT aqui)
    const token = jwt.sign(
    {
        userId: user.id,
        username: user.username
    },
    process.env.JWT_SECRET!,
    {
        expiresIn: "7d"
    }
);

return res.status(200).json({
    access_token: token,
    user_id: user.id,
    username: user.username
});

  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno do servidor ao fazer login." });
  }
};