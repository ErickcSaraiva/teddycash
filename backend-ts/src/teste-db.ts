import 'dotenv/config';
import { prisma } from './config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log("Connecting to PostgreSQL...");

  // Exemplo de uso: buscar ou criar um utilizador
  const user = await prisma.user.upsert({
    where: { email: 'erick@catchup.com' },
    update: {},
    create: {
      username: 'erick_crane_master',
      email: 'erick@catchup.com',
      password: await bcrypt.hash(process.env.DEMO_PASSWORD ?? 'demo-password', 12),
      balance: 150,
    },
  });

  console.log("Prisma client ready:", user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
