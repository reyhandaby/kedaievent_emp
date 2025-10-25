import express from "express";
import { createTransaction, getUserTransactions, updateTransactionStatus, uploadPaymentProof, adminUpdateTransaction, getPendingTransactions } from "../controllers/transactionController";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Setup multer storage for image uploads
const uploadDir = path.join(__dirname, "../../uploads");
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});
const imageOnly: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};
const upload = multer({ storage, fileFilter: imageOnly, limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/", createTransaction);
router.get("/user/:userId", getUserTransactions);
router.get("/pending", getPendingTransactions);
router.put("/:id", updateTransactionStatus);
router.post("/:id/payment-proof", upload.single("file"), uploadPaymentProof);
router.post("/:id/admin-update", adminUpdateTransaction);

export default router;