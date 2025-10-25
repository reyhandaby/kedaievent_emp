import express from "express";
import { createEvent, getAllEvents, getEventById, registerForEvent, deleteEvent } from "../controllers/eventController";

const router = express.Router();
router.post("/", createEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.post("/:id/register", registerForEvent);
router.delete("/:id", deleteEvent);
export default router;
