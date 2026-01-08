import { users } from '../services/db.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

// Helper to hash password
const hashPassword = (password, salt) => {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString('hex'));
        });
    });
};

export const signup = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and Password required" });
        }

        const existing = await users.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "User already exists" });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = await hashPassword(password, salt);

        const newUser = {
            username: username || email.split('@')[0],
            email,
            salt,
            hash,
            role: role || 'investigator',
            createdAt: new Date()
        };

        const result = await users.insertOne(newUser);

        res.status(201).json({
            _id: result.insertedId,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        });

    } catch (e) {
        console.error("Signup Error:", e);
        res.status(500).json({ error: "Signup failed" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await users.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const hash = await hashPassword(password, user.salt);
        if (hash !== user.hash) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check for First Time Login
        if (user.mustChangePassword) {
            return res.json({
                mustChangePassword: true,
                _id: user._id,
                email: user.email
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '6h' }
        );

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: token
        });

    } catch (e) {
        console.error("Login Error:", e);
        res.status(500).json({ error: "Login failed" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await users.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = await hashPassword(newPassword, salt);

        await users.updateOne(
            { email },
            {
                $set: { hash, salt, mustChangePassword: false }
            }
        );

        // Auto-login (generate token) after change
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '6h' }
        );

        res.json({ message: "Password updated successfully", token, username: user.username, email: user.email });

    } catch (e) {
        console.error("Change Password Error:", e);
        res.status(500).json({ error: "Failed to update password" });
    }
};
