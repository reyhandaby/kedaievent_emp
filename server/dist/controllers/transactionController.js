"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingTransactions = exports.adminUpdateTransaction = exports.cancelOverdueTransactions = exports.uploadPaymentProof = exports.updateTransactionStatus = exports.getUserTransactions = exports.createTransaction = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createTransaction = async (req, res) => {
    try {
        const { userId, eventId, totalPrice } = req.body;
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                eventId,
                totalPrice,
                status: "WAITING_PAYMENT",
            },
        });
        res.status(201).json({ message: "Transaction created", transaction });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to create transaction", error: err.message });
    }
};
exports.createTransaction = createTransaction;
const getUserTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await prisma.transaction.findMany({
            where: { userId: Number(userId) },
            include: { event: true },
        });
        res.json({ transactions });
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching transactions", error: err.message });
    }
};
exports.getUserTransactions = getUserTransactions;
const updateTransactionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentProof } = req.body;
        const transaction = await prisma.transaction.update({
            where: { id: Number(id) },
            data: {
                status,
                paymentProof,
            },
        });
        res.json({ message: "Transaction updated", transaction });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update transaction", error: err.message });
    }
};
exports.updateTransactionStatus = updateTransactionStatus;
const uploadPaymentProof = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        // Support both JSON body string and multipart image
        let paymentProof;
        if (req.file) {
            // Build a public URL to the uploaded file
            paymentProof = `/uploads/${req.file.filename}`;
        }
        else if (typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.paymentProof) === "string") {
            paymentProof = req.body.paymentProof;
        }
        if (!paymentProof) {
            return res.status(400).json({ message: "No payment proof provided" });
        }
        const txn = await prisma.transaction.findUnique({ where: { id: Number(id) } });
        if (!txn)
            return res.status(404).json({ message: "Transaction not found" });
        if (txn.status !== "WAITING_PAYMENT") {
            return res.status(400).json({ message: "Invalid status to upload payment proof" });
        }
        const updated = await prisma.transaction.update({
            where: { id: Number(id) },
            data: {
                paymentProof,
                status: "WAITING_CONFIRMATION",
            },
        });
        return res.json({ message: "Payment proof uploaded", transaction: updated });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to upload payment proof", error: err.message });
    }
};
exports.uploadPaymentProof = uploadPaymentProof;
const cancelOverdueTransactions = async () => {
    const now = new Date();
    // Expire transactions with no payment proof after 2 hours
    const expired = await prisma.transaction.findMany({
        where: {
            status: "WAITING_PAYMENT",
            expiresAt: { lt: now },
        },
    });
    for (const t of expired) {
        await prisma.$transaction([
            prisma.transaction.update({ where: { id: t.id }, data: { status: "EXPIRED" } }),
            prisma.user.update({ where: { id: t.userId }, data: { points: { increment: t.pointsUsed } } }),
            prisma.event.update({ where: { id: t.eventId }, data: { availableSeats: { increment: 1 } } }),
        ]);
    }
    // Auto-cancel if admin did not confirm/reject within 3 days
    const toCancel = await prisma.transaction.findMany({
        where: {
            status: "WAITING_CONFIRMATION",
            adminDeadlineAt: { lt: now },
        },
    });
    for (const t of toCancel) {
        await prisma.$transaction([
            prisma.transaction.update({ where: { id: t.id }, data: { status: "CANCELED" } }),
            prisma.user.update({ where: { id: t.userId }, data: { points: { increment: t.pointsUsed } } }),
            prisma.event.update({ where: { id: t.eventId }, data: { availableSeats: { increment: 1 } } }),
        ]);
    }
};
exports.cancelOverdueTransactions = cancelOverdueTransactions;
const adminUpdateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const txn = await prisma.transaction.findUnique({ where: { id: Number(id) } });
        if (!txn)
            return res.status(404).json({ message: "Transaction not found" });
        if (txn.status !== "WAITING_CONFIRMATION") {
            return res.status(400).json({ message: "Invalid status transition" });
        }
        if (status === "DONE") {
            const updated = await prisma.transaction.update({ where: { id: txn.id }, data: { status: "DONE" } });
            return res.json({ message: "Transaction confirmed", transaction: updated });
        }
        // REJECTED -> rollback
        await prisma.$transaction([
            prisma.transaction.update({ where: { id: txn.id }, data: { status: "REJECTED" } }),
            prisma.user.update({ where: { id: txn.userId }, data: { points: { increment: txn.pointsUsed } } }),
            prisma.event.update({ where: { id: txn.eventId }, data: { availableSeats: { increment: 1 } } }),
        ]);
        return res.json({ message: "Transaction rejected and rolled back" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to update transaction", error: err.message });
    }
};
exports.adminUpdateTransaction = adminUpdateTransaction;
const getPendingTransactions = async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { status: "WAITING_CONFIRMATION" },
            include: { user: true, event: true },
        });
        return res.json({ transactions });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to fetch pending transactions", error: err.message });
    }
};
exports.getPendingTransactions = getPendingTransactions;
