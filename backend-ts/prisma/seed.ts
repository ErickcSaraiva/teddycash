import 'dotenv/config';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed de demonstracao nao pode ser executado em producao.');
  }

  const demoPassword = process.env.DEMO_PASSWORD ?? 'demo-password';
  const machineApiKey = process.env.DEMO_MACHINE_API_KEY ?? 'change-me-before-sharing';

  await prisma.user.upsert({
    where: { username: 'demo_user' },
    update: {},
    create: {
      username: 'demo_user',
      email: 'demo@catchup.local',
      password: await bcrypt.hash(demoPassword, 12),
      creditBalance: 1250,
    },
  });

  await prisma.machine.upsert({
    where: { id: 'machine-1' },
    update: {},
    create: {
      id: 'machine-1',
      name: 'Maquina de demonstracao',
      qrEnabled: true,
      nfcEnabled: true,
      apiKeyHash: createHash('sha256').update(machineApiKey).digest('hex'),
    },
  });
}

main()
  .finally(() => prisma.$disconnect());
