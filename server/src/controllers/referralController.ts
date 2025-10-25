import { PrismaClient } from "@prisma/client";
import { TypedRequest, TypedResponse } from "../types/express";

const prisma = new PrismaClient();

export const validateReferralCode = async (req: TypedRequest, res: TypedResponse) => {
  try {
    const { referralCode } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { referralCode },
    });
    
    if (!user) {
      return res.status(404).json({ message: "Referral code not found" });
    }
    
    res.json({ message: "Referral code valid", userId: user.id });
  } catch (err: any) {
    res.status(500).json({ message: "Error validating referral code", error: err.message });
  }
};