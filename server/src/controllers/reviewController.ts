import { PrismaClient } from "@prisma/client";
import { TypedRequest, TypedResponse } from "../types/express";

const prisma = new PrismaClient();

export const createReview = async (req: TypedRequest, res: TypedResponse) => {
  try {
    const { rating, comment, userId, eventId } = req.body;
    
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        eventId,
      },
    });
    
    res.status(201).json({ message: "Review created", review });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create review", error: err.message });
  }
};

export const getEventReviews = async (req: TypedRequest, res: TypedResponse) => {
  try {
    const { eventId } = req.params;
    
    const reviews = await prisma.review.findMany({
      where: { eventId: Number(eventId) },
      include: { user: true },
    });
    
    res.json({ reviews });
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching reviews", error: err.message });
  }
};