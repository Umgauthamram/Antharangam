import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import 'dotenv/config';

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error("Usage: node create-investigator.js <Name> <Email>");
    process.exit(1);
}

const [name, email] = args;

// 1. Generate Secure Password
const generatePassword = () => {
    return crypto.randomBytes(6).toString('hex'); // 12 chars hex
};

// 2. Hash Password (PBKDF2)
const hashPassword = (password, salt) => {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString('hex'));
        });
    });
};

async function createInvestigator() {
    const client = new MongoClient(uri);
    let password = generatePassword();

    try {
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection('users');

        // Check text
        const existing = await users.findOne({ email });
        if (existing) {
            console.error(`Error: User with email ${email} already exists.`);
            process.exit(1);
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = await hashPassword(password, salt);

        const newUser = {
            username: name,
            email: email,
            role: 'investigator',
            salt,
            hash,
            mustChangePassword: true,
            createdAt: new Date(),
            createdBy: 'admin-script'
        };

        await users.insertOne(newUser);
        console.log(`✅ User '${name}' created in Database.`);

        // 3. Send Email
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("⚠️  EMAIL_USER or EMAIL_PASS missing in .env. Skipping email.");
            console.log(`\nCREDENTIALS FOR ${name}:`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail', // Standard, can be changed via env
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Antharangam Investigator Access',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0f766e;">Antharangam Access Granted</h2>
                    <p>Hello ${name},</p>
                    <p>An investigator account has been created for you on the Antharangam platform.</p>
                    <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Password:</strong> <code style="font-size: 1.2em; color: #0f766e;">${password}</code></p>
                    </div>
                    <p>Please login immediately and secure your account.</p>
                    <p><em>This is an automated message. Do not reply.</em></p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Credentials emailed to ${email}`);

    } catch (e) {
        if (e.code === 'EAUTH') {
            console.error("\n❌ Email failed: Invalid Credentials.");
            console.error("Tip: If using Gmail, you MUST use an 'App Password', not your login password.");
        } else {
            console.error("\n❌ Email failed:", e.message);
        }

        console.log(`\n⚠️  COULD NOT SEND EMAIL. HERE ARE THE CREDENTIALS:`);
        console.log(`---------------------------------------------------`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } finally {
        await client.close();
    }
}

createInvestigator();
