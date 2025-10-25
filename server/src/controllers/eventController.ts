import { PrismaClient } from "@prisma/client";
import { TypedRequest, TypedResponse } from "../types/express";
import { CreateEventRequest, EventApiResponse, EventResponse, EventsResponse } from "../types/event";

const prisma = new PrismaClient();

export const createEvent = async (req: TypedRequest<CreateEventRequest>, res: TypedResponse<EventApiResponse>) => {
  try {
    const { title, description, price, startDate, endDate, availableSeats, category, location, organizerId } = req.body;
    // Debug logs for incoming payload
    console.log("[CreateEvent] Incoming payload:", {
      title,
      descriptionLength: description?.length,
      priceType: typeof price,
      startDate,
      endDate,
      availableSeatsType: typeof availableSeats,
      category,
      location,
      organizerId,
      organizerIdType: typeof organizerId,
    });

    // Validate organizerId
    if (organizerId === undefined || organizerId === null || isNaN(Number(organizerId))) {
      console.warn("[CreateEvent] Invalid organizerId:", organizerId);
      return res.status(400).json({ message: "Invalid organizerId" });
    }

    const organizer = await prisma.user.findUnique({ where: { id: Number(organizerId) } });
    if (!organizer) {
      console.warn("[CreateEvent] Organizer not found for id:", organizerId);
      return res.status(404).json({ message: "Organizer not found" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn("[CreateEvent] Invalid dates:", { startDate, endDate });
      return res.status(400).json({ message: "Invalid startDate or endDate" });
    }
    if (start >= end) {
      console.warn("[CreateEvent] Start date must be before end date:", { startDate, endDate });
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        price: Number(price),
        startDate: start,
        endDate: end,
        availableSeats: Number(availableSeats),
        category,
        location,
        organizerId: Number(organizerId),
      },
    });
    console.log("[CreateEvent] Event created successfully with id:", event.id);
    res.status(201).json({ message: "Event created", event });
  } catch (err: any) {
    console.error("[CreateEvent] Failed to create event:", err?.message);
    res.status(500).json({ message: "Failed to create event", error: err.message });
  }
};

export const getAllEvents = async (req: TypedRequest, res: TypedResponse<EventApiResponse>) => {
  try {
    const events = await prisma.event.findMany({ where: { isActive: true }, include: { organizer: true } });
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching events", error: err.message });
  }
};

export const getEventById = async (req: TypedRequest, res: TypedResponse<EventApiResponse>) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
      include: { organizer: true }
    });
    
    if (!event || !event.isActive) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    res.json({ event });
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching event", error: err.message });
  }
};

export const registerForEvent = async (req: TypedRequest, res: TypedResponse<EventApiResponse>) => {
  try {
    const { id } = req.params;
    const { userId, pointsToUse = 0, voucherCode } = req.body as { userId: number; pointsToUse?: number; voucherCode?: string };

    console.log('[RegisterEvent] Incoming:', { eventId: id, userId, pointsToUse, voucherCode });

    const eventIdNum = Number(id);
    const userIdNum = Number(userId);
    if (isNaN(eventIdNum) || isNaN(userIdNum)) {
      console.warn('[RegisterEvent] Invalid eventId or userId:', { eventId: id, userId });
      return res.status(400).json({ message: 'Invalid eventId or userId' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventIdNum } });
    if (!event || !event.isActive) {
      console.warn('[RegisterEvent] Event not found or inactive:', eventIdNum);
      return res.status(404).json({ message: 'Event not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: userIdNum } });
    if (!user) {
      console.warn('[RegisterEvent] User not found:', userIdNum);
      return res.status(404).json({ message: 'User not found' });
    }

    if (event.availableSeats <= 0) {
      console.warn('[RegisterEvent] No seats available for event:', eventIdNum);
      return res.status(400).json({ message: 'No seats available' });
    }

    // Calculate discounts: points and voucher
    const safePointsToUse = Math.max(0, Math.min(pointsToUse || 0, user.points));
    let voucher = null as null | { id: number; discountPercent: number; startDate: Date; endDate: Date; eventId: number };
    let voucherDiscount = 0;

    if (voucherCode) {
      const foundVoucher = await prisma.voucher.findUnique({ where: { code: voucherCode } });
      if (!foundVoucher) {
        console.warn('[RegisterEvent] Voucher not found:', voucherCode);
        return res.status(404).json({ message: 'Voucher not found' });
      }
      if (foundVoucher.eventId !== eventIdNum) {
        console.warn('[RegisterEvent] Voucher not applicable for this event:', { voucherCode, eventIdNum });
        return res.status(400).json({ message: 'Voucher not applicable for this event' });
      }
      const now = new Date();
      if (now < new Date(foundVoucher.startDate) || now > new Date(foundVoucher.endDate)) {
        console.warn('[RegisterEvent] Voucher not in active period:', { voucherCode });
        return res.status(400).json({ message: 'Voucher not active' });
      }
      voucher = foundVoucher as any;
      voucherDiscount = Math.round(event.price * (foundVoucher.discountPercent / 100));
    }

    const rawTotal = event.price - safePointsToUse - voucherDiscount;
    const totalPrice = Math.max(0, rawTotal);

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    const adminDeadlineAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    const createdTransaction = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userIdNum },
        data: { points: { decrement: safePointsToUse } },
      });
      await tx.event.update({
        where: { id: eventIdNum },
        data: { availableSeats: { decrement: 1 } },
      });
      const transaction = await tx.transaction.create({
        data: {
          userId: userIdNum,
          eventId: eventIdNum,
          totalPrice,
          pointsUsed: safePointsToUse,
          voucherId: voucher?.id ?? null,
          status: 'WAITING_PAYMENT',
          expiresAt,
          adminDeadlineAt,
        },
      });
      return transaction;
    });

    console.log('[RegisterEvent] Registration successful:', { eventId: eventIdNum, userId: userIdNum, totalPrice, pointsUsed: safePointsToUse, voucherId: voucher?.id ?? null });
    return res.status(201).json({ message: 'Registered for event successfully', transaction: createdTransaction });
  } catch (err: any) {
    console.error('[RegisterEvent] Error:', err?.message);
    return res.status(500).json({ message: 'Failed to register for event', error: err.message });
  }
};

export const deleteEvent = async (req: TypedRequest, res: TypedResponse<EventApiResponse>) => {
  try {
    const { id } = req.params;
    const eventIdNum = Number(id);
    if (isNaN(eventIdNum)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const existing = await prisma.event.findUnique({ where: { id: eventIdNum } });
    if (!existing) {
      return res.status(404).json({ message: "Event not found" });
    }

    const force = (req.query?.force === 'true');

    if (force) {
      // Force delete: remove all related data then delete event
      await prisma.$transaction([
        prisma.transaction.deleteMany({ where: { eventId: eventIdNum } }),
        prisma.review.deleteMany({ where: { eventId: eventIdNum } }),
        prisma.voucher.deleteMany({ where: { eventId: eventIdNum } }),
        prisma.event.delete({ where: { id: eventIdNum } }),
      ]);
      return res.json({ message: "Event permanently deleted (force)" });
    }

    // Check for any transactions referencing the event
    const txnCount = await prisma.transaction.count({ where: { eventId: eventIdNum } });
    if (txnCount > 0) {
      // Soft delete: mark event inactive
      await prisma.event.update({ where: { id: eventIdNum }, data: { isActive: false } });
      return res.status(200).json({ message: "Event archived (has related transactions), not fully deleted" });
    }

    // No transactions: safe hard delete
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { eventId: eventIdNum } }),
      prisma.voucher.deleteMany({ where: { eventId: eventIdNum } }),
      prisma.event.delete({ where: { id: eventIdNum } }),
    ]);

    return res.json({ message: "Event deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete event", error: err.message });
  }
};
