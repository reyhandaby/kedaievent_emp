import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const title = 'Lomba Balap Kaeung 17an';
  const event = await prisma.event.findFirst({ where: { title } });
  if (!event) {
    console.log(`NOT_FOUND: Event '${title}' tidak ditemukan.`);
    return;
  }

  console.log(`INFO: Menemukan event ID=${event.id}, menjalankan hard delete...`);

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { eventId: event.id } }),
    prisma.review.deleteMany({ where: { eventId: event.id } }),
    prisma.voucher.deleteMany({ where: { eventId: event.id } }),
    prisma.event.delete({ where: { id: event.id } }),
  ]);

  console.log(`SUCCESS: Event '${title}' (ID=${event.id}) telah dihapus permanen beserta data terkait.`);
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });