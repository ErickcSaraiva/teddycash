import 'dotenv/config';
import { prisma } from './config/prisma';

async function main() {
  console.log("Connecting to PostgreSQL...");

  // Exemplo de uso: buscar ou criar um utilizador
  const user = await prisma.user.upsert({
    where: { email: 'erick@catchup.com' },
    update: {},
    create: {
      username: 'erick_crane_master',
      email: 'erick@catchup.com',
      password: 'demo-password',
      balance: 150,
    },
  });

  console.log("Prisma client ready:", user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
