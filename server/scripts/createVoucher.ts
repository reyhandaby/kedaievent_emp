import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const VOUCHER_CODE = process.env.VOUCHER_CODE || 'PROMO10';
  const DISCOUNT = Number(process.env.VOUCHER_DISCOUNT || 10);
  const EVENT_ID = process.env.EVENT_ID ? Number(process.env.EVENT_ID) : null;
  const DAYS_VALID = Number(process.env.VOUCHER_DAYS || 30);

  const now = new Date();
  const end = new Date(now.getTime() + DAYS_VALID * 24 * 60 * 60 * 1000);

  let eventId: number | null = EVENT_ID;

  if (!eventId) {
    const latestActive = await prisma.event.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestActive) {
      console.log('NOT_FOUND: No active events found. Create an event first.');
      return;
    }
    eventId = latestActive.id;
    console.log(`INFO: Using latest active event ID=${eventId}, title='${latestActive.title}'`);
  }

  const existing = await prisma.voucher.findUnique({ where: { code: VOUCHER_CODE } });
  if (existing) {
    if (existing.eventId !== eventId) {
      console.log(`CONFLICT: Voucher code '${VOUCHER_CODE}' already exists for eventId=${existing.eventId}.`);
      return;
    }
    console.log(`INFO: Voucher '${VOUCHER_CODE}' already exists for eventId=${eventId}. Updating validity and discount...`);
    await prisma.voucher.update({
      where: { id: existing.id },
      data: { discountPercent: DISCOUNT, startDate: now, endDate: end },
    });
    console.log(`SUCCESS: Voucher '${VOUCHER_CODE}' updated for eventId=${eventId}.`);
    return;
  }

  const voucher = await prisma.voucher.create({
    data: {
      code: VOUCHER_CODE,
      discountPercent: DISCOUNT,
      startDate: now,
      endDate: end,
      eventId: eventId!,
    },
  });
  console.log(`SUCCESS: Voucher '${voucher.code}' created for eventId=${voucher.eventId} with ${voucher.discountPercent}% discount, valid ${voucher.startDate.toISOString()} to ${voucher.endDate.toISOString()}.`);
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
