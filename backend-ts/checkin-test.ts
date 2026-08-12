import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './src/config/prisma';
import { claimDailyCheckin } from './src/services/rewardService';

async function main() {
  const email = `autotest${Date.now()}@example.com`;
  const username = `autotest${Date.now()}`;
  const password = 'test1234';
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { username, email, password: hashedPassword } });
  console.log('created user', user.id);
  try {
    const result = await claimDailyCheckin(user.id);
    console.log('result', result);
  } catch (error) {
    console.error('caught error', error);
    if (error instanceof Error) {
      console.error('message', error.message);
      console.error('stack', error.stack);
    }
    process.exitCode = 1;
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.$disconnect();
  }
}

main();
