import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import reviewRoutes from "./routes/reviewRoutes";
//import referralRoutes from "./routes/referralRoutes";
import { cancelOverdueTransactions } from "./controllers/transactionController";

dotenv.config();
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reviews", reviewRoutes);
//app.use("/api/referrals", referralRoutes);

app.get("/", (req, res) => res.send("Event Management API Running ✅"));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  // Run scheduler once on startup
  cancelOverdueTransactions().catch((e) => console.error("Scheduler error (startup)", e));
});

// Schedule periodic checks (every 1 minute)
setInterval(() => {
  cancelOverdueTransactions().catch((e) => console.error("Scheduler error (interval)", e));
}, 60 * 1000);
