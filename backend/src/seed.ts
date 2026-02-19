import 'dotenv/config';
import { prisma } from './prisma.js';
import { hashPassword } from './auth.js';

const FEATURES = ['date_picker', 'filter_age', 'chart_bar', 'filter_gender'];
const GENDERS = ['Male', 'Female', 'Other'] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  await prisma.featureClick.deleteMany();
  await prisma.user.deleteMany();

  // Ensure diverse users for filter testing
  const userSpecs = [
    { username: 'user1', age: 25, gender: 'Male' as const },
    { username: 'user2', age: 30, gender: 'Female' as const },
    { username: 'user3', age: 22, gender: 'Female' as const },
    { username: 'user4', age: 45, gender: 'Male' as const },
    { username: 'user5', age: 16, gender: 'Other' as const },
    { username: 'user6', age: 35, gender: 'Female' as const },
    { username: 'user7', age: 28, gender: 'Male' as const },
    { username: 'user8', age: 19, gender: 'Female' as const },
  ];
  for (const u of userSpecs) {
    try {
      await prisma.user.create({
        data: { ...u, password: hashPassword('password123') },
      });
    } catch {}
  }

  const users = await prisma.user.findMany({ select: { id: true } });
  let userIds = users.map((u) => u.id);

  if (userIds.length === 0) {
    await prisma.user.create({
      data: {
        username: 'demo',
        password: hashPassword('password123'),
        age: 25,
        gender: 'Male',
      },
    });
    const demo = await prisma.user.findUnique({ where: { username: 'demo' } });
    userIds = demo ? [demo.id] : [];
  }

  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 2);
  baseDate.setHours(0, 0, 0, 0);

  let totalInserted = 0;
  for (let d = 0; d < 75; d++) {
    const date = addDays(baseDate, d);
    const clicksPerDay = randomInt(2, 8);
    for (let c = 0; c < clicksPerDay; c++) {
      const user = randomChoice(userIds);
      const feature = randomChoice(FEATURES);
      const hour = randomInt(8, 22);
      const min = randomInt(0, 59);
      const ts = new Date(date);
      ts.setHours(hour, min, 0, 0);

      await prisma.featureClick.create({
        data: {
          userId: user,
          featureName: feature,
          timestamp: ts,
        },
      });
      totalInserted++;
    }
  }

  console.log(`Seeded ${userIds.length} users and ${totalInserted} feature clicks.`);
  console.log('Sample users: username=user1 (or demo), password=password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
