import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Заполнение базы данных тестовыми данными (SaaS multi-branch + RFM)...');

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

  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 6. Тестовые гости для всех RFM-сегментов:
  // Гость 1: В зоне риска (AT_RISK) — ходил каждые 3 дня, но не был уже 11 дней (активируется оффер «Штамп x2 до воскресенья»)
  const customerAtRisk = await prisma.user.upsert({
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

  const atRiskVisitDays = [35, 32, 29, 26, 23, 20, 17, 14, 11];
  for (const d of atRiskVisitDays) {
    await prisma.transaction.create({
      data: {
        type: 'EARN_STAMP',
        customerId: customerAtRisk.id,
        baristaId: barista.id,
        branchId: branch.id,
        createdAt: daysAgo(d),
      },
    });
  }

  // Гость 2: Чемпион (CHAMPIONS, GOLD) — ходит каждые 1.5-2 дня, был вчера
  const customerChampion = await prisma.user.upsert({
    where: { email: 'anna.gold@coffee.ru' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'anna.gold@coffee.ru',
      name: 'Анна Морозова',
      role: 'CUSTOMER',
      tier: 'GOLD',
    },
  });

  for (let i = 0; i < 26; i++) {
    await prisma.transaction.create({
      data: {
        type: 'EARN_STAMP',
        customerId: customerChampion.id,
        baristaId: barista.id,
        branchId: branch.id,
        createdAt: daysAgo(Math.max(0.5, 38 - i * 1.5)),
      },
    });
  }

  // Гость 3: Спящий (SLEEPING) — последний визит 34 дня назад
  const customerSleeping = await prisma.user.upsert({
    where: { email: 'dmitry.sleep@coffee.ru' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'dmitry.sleep@coffee.ru',
      name: 'Дмитрий Волков',
      role: 'CUSTOMER',
      tier: 'BRONZE',
    },
  });

  for (const d of [50, 44, 39, 34]) {
    await prisma.transaction.create({
      data: {
        type: 'EARN_STAMP',
        customerId: customerSleeping.id,
        baristaId: barista.id,
        branchId: branch.id,
        createdAt: daysAgo(d),
      },
    });
  }

  // Гость 4: Перспективный новичок (PROMISING) — 1 визит 2 дня назад
  const customerNew = await prisma.user.upsert({
    where: { email: 'elena.new@coffee.ru' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'elena.new@coffee.ru',
      name: 'Елена Соколова',
      role: 'CUSTOMER',
      tier: 'BRONZE',
    },
  });

  await prisma.transaction.create({
    data: {
      type: 'EARN_STAMP',
      customerId: customerNew.id,
      baristaId: barista.id,
      branchId: branch.id,
      createdAt: daysAgo(2),
    },
  });

  console.log(`✅ Тестовые данные RFM-сегментации успешно созданы!`);
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
