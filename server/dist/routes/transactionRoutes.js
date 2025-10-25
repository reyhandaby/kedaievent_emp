"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transactionController_1 = require("../controllers/transactionController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// Setup multer storage for image uploads
const uploadDir = path_1.default.join(__dirname, "../../uploads");
try {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
catch (_a) { }
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    }
});
const imageOnly = (_req, file, cb) => {
    if (file.mimetype.startsWith("image/"))
        cb(null, true);
    else
        cb(new Error("Only image files are allowed"));
};
const upload = (0, multer_1.default)({ storage, fileFilter: imageOnly, limits: { fileSize: 5 * 1024 * 1024 } });
router.post("/", transactionController_1.createTransaction);
router.get("/user/:userId", transactionController_1.getUserTransactions);
router.get("/pending", transactionController_1.getPendingTransactions);
router.put("/:id", transactionController_1.updateTransactionStatus);
router.post("/:id/payment-proof", upload.single("file"), transactionController_1.uploadPaymentProof);
router.post("/:id/admin-update", transactionController_1.adminUpdateTransaction);
exports.default = router;
