import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const title = 'Lomba Balap Kaeung 17an';
  const event = await prisma.event.findFirst({ where: { title } });
  if (!event) {
    console.log(`NOT_FOUND: Event '${title}' tidak ditemukan.`);
    return;
  }
  if (!event.isActive) {
    console.log(`INFO: Event '${title}' sudah non-aktif (diarsipkan).`);
    return;
  }
  const updated = await prisma.event.update({ where: { id: event.id }, data: { isActive: false } });
  console.log(`SUCCESS: Event '${updated.title}' (ID=${updated.id}) diarsipkan (isActive=false).`);
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });