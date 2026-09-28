import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Заполнение базы данных тестовыми данными (SaaS multi-branch)...');

  // 1. Создаем тестового владельца сети
  const owner = await prisma.user.upsert({
    where: { email: 'owner@coffee.ru' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'owner@coffee.ru',
      name: 'Алексей (Владелец)',
      role: 'OWNER',
    },
  });

  // 2. Создаем тестовую сеть
  const network = await prisma.network.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      ownerId: owner.id,
      name: 'Surf Coffee Network',
      targetStamps: 6,
      rewardTitle: 'Бесплатный фильтр или капучино',
    },
  });

  // 3. Создаем тестовый филиал
  const branch = await prisma.branch.upsert({
    where: { slug: 'surf-coffee' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      networkId: network.id,
      name: 'Surf Coffee x Pokrovka',
      slug: 'surf-coffee',
      address: 'ул. Большая Покровская, 15',
    },
  });

  // 4. Создаем бариста для филиала
  const barista = await prisma.user.upsert({
    where: { email: 'barista@coffee.ru' },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'barista@coffee.ru',
      name: 'Иван Бариста',
      role: 'BARISTA',
      branchId: branch.id,
    },
  });

  // 5. Создаем KPI цель для сети
  const now = new Date();
  const activeMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  await prisma.kpiTarget.create({
    data: {
      networkId: network.id,
      title: 'Выдать 500 штампов — премия 5000 тенге',
      targetCount: 500,
      reward: '5 000 ₸',
      activeMonth,
    },
  });

  // 6. Создаем тестового постоянного гостя
  const customer = await prisma.user.upsert({
    where: { email: 'customer@coffee.ru' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'customer@coffee.ru',
      name: 'Константин (Гость)',
      role: 'CUSTOMER',
      tier: 'SILVER',
    },
  });

  // 7. Создаем тестовые транзакции
  for (let i = 0; i < 12; i++) {
    await prisma.transaction.create({
      data: {
        type: 'EARN_STAMP',
        customerId: customer.id,
        baristaId: barista.id,
        branchId: branch.id,
      },
    });
  }

  console.log(`✅ Тестовые данные успешно созданы!`);
  console.log(`☕ Сеть: ${network.name}`);
  console.log(`📍 Филиал: ${branch.name} (/card/${branch.slug})`);
}

main()
  .catch((e) => {
    console.error('Ошибка сидирования:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
