"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const register = async (req, res) => {
    try {
        const { name, email, password, role, referralCodeUsed } = req.body;
        console.log(`Register attempt for email: ${email}`);
        // Normalize email to avoid case/whitespace mismatches
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            console.log(`Email already registered: ${normalizedEmail}`);
            return res.status(400).json({ message: "Email already registered" });
        }
        console.log(`Hashing password for new user: ${normalizedEmail}`);
        const hashed = await bcrypt_1.default.hash(password, 10);
        const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        console.log(`Creating new user with email: ${normalizedEmail}, role: ${role}`);
        const newUser = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashed,
                role,
                referralCode,
                referredBy: referralCodeUsed || null,
            },
        });
        console.log(`User registered successfully: ${normalizedEmail}`);
        // Hapus password dari respons
        const userResponse = {
            ...newUser,
            password: undefined
        };
        res.status(201).json({ message: "Register success", user: userResponse });
    }
    catch (err) {
        res.status(500).json({ message: "Register failed", error: err.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for email: ${email}`);
        console.log(`Password length: ${password.length}`);
        // Normalize email to avoid case/whitespace mismatches
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            console.log(`User not found for email: ${normalizedEmail}`);
            return res.status(404).json({ message: "User not found" });
        }
        console.log(`User found, validating password for: ${normalizedEmail}`);
        console.log(`Stored password hash length: ${user.password.length}`);
        const valid = await bcrypt_1.default.compare(password, user.password);
        console.log(`Password validation result: ${valid}`);
        if (!valid) {
            console.log(`Invalid password for user: ${normalizedEmail}`);
            return res.status(401).json({ message: "Invalid password" });
        }
        console.log(`Password valid, generating token for user: ${normalizedEmail}`);
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        // Hapus password dari respons
        const userResponse = {
            ...user,
            password: undefined
        };
        console.log(`Login successful for user: ${normalizedEmail}`);
        res.json({ message: "Login success", token, user: userResponse });
    }
    catch (err) {
        console.error(`Login error: ${err.message}`);
        res.status(500).json({ message: "Login failed", error: err.message });
    }
};
exports.login = login;
