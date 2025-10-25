"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventReviews = exports.createReview = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createReview = async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ message: "Failed to create review", error: err.message });
    }
};
exports.createReview = createReview;
const getEventReviews = async (req, res) => {
    try {
        const { eventId } = req.params;
        const reviews = await prisma.review.findMany({
            where: { eventId: Number(eventId) },
            include: { user: true },
        });
        res.json({ reviews });
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching reviews", error: err.message });
    }
};
exports.getEventReviews = getEventReviews;
