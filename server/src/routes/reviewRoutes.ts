import express from "express";
import { createReview, getEventReviews } from "../controllers/reviewController";

const router = express.Router();

router.post("/", createReview);
router.get("/event/:eventId", getEventReviews);

export default router;