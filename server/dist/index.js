"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
//import referralRoutes from "./routes/referralRoutes";
const transactionController_1 = require("./controllers/transactionController");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// serve uploaded files statically
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// routes
app.use("/api/auth", authRoutes_1.default);
app.use("/api/events", eventRoutes_1.default);
app.use("/api/transactions", transactionRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
//app.use("/api/referrals", referralRoutes);
app.get("/", (req, res) => res.send("Event Management API Running ✅"));
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    // Run scheduler once on startup
    (0, transactionController_1.cancelOverdueTransactions)().catch((e) => console.error("Scheduler error (startup)", e));
});
// Schedule periodic checks (every 1 minute)
setInterval(() => {
    (0, transactionController_1.cancelOverdueTransactions)().catch((e) => console.error("Scheduler error (interval)", e));
}, 60 * 1000);
