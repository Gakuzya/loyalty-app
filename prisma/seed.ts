import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Заполнение базы данных тестовыми данными...');

  // 1. Создаем тестового владельца кофейни
  const owner = await prisma.user.upsert({
    where: { email: 'owner@coffee.ru' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'owner@coffee.ru',
      phone: '+7 (999) 111-22-33',
      fullName: 'Алексей (Владелец)',
      role: 'OWNER',
    },
  });

  // 2. Создаем тестовую кофейню с slug: "surf-coffee"
  const shop = await prisma.shop.upsert({
    where: { slug: 'surf-coffee' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      ownerId: owner.id,
      name: 'Surf Coffee x Pokrovka',
      slug: 'surf-coffee',
      address: 'ул. Большая Покровская, 15',
      targetStamps: 6,
      rewardTitle: 'Бесплатный фильтр или капучино',
      cooldownMinutes: 15,
    },
  });

  // 3. Создаем тестового гостя
  const customer = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      phone: '+7 (999) 000-00-00',
      fullName: 'Константин (Гость)',
      role: 'CUSTOMER',
    },
  });

  // 4. Создаем карточку лояльности для гостя с 4 штампами
  const card = await prisma.loyaltyCard.upsert({
    where: {
      customerId_shopId: {
        customerId: customer.id,
        shopId: shop.id,
      },
    },
    update: {
      currentStamps: 4,
    },
    create: {
      customerId: customer.id,
      shopId: shop.id,
      currentStamps: 4,
      totalStampsEarned: 10,
      rewardsAvailable: 0,
      qrToken: 'guest-qr-surf-coffee-token',
    },
  });

  console.log(`✅ Тестовые данные успешно созданы!`);
  console.log(`☕ Кофейня: ${shop.name} (/card/${shop.slug})`);
  console.log(`💳 Карточка гостя: ${card.currentStamps}/${shop.targetStamps} штампов`);
}

main()
  .catch((e) => {
    console.error('Ошибка сидирования:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
