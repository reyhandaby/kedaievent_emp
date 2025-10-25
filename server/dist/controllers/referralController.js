"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReferralCode = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const validateReferralCode = async (req, res) => {
    try {
        const { referralCode } = req.params;
        const user = await prisma.user.findUnique({
            where: { referralCode },
        });
        if (!user) {
            return res.status(404).json({ message: "Referral code not found" });
        }
        res.json({ message: "Referral code valid", userId: user.id });
    }
    catch (err) {
        res.status(500).json({ message: "Error validating referral code", error: err.message });
    }
};
exports.validateReferralCode = validateReferralCode;
