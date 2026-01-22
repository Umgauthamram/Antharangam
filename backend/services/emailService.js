import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendApiKeyEmail = async (email, keyData, fullKey) => {
    try {
        const mailOptions = {
            from: `"Antharangam Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Antharangam API Key is Ready',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f5; padding: 20px;">
                <div style="background-color: #0f172a; padding: 30px; border-radius: 8px; text-align: center;">
                    <h2 style="color: #2dd4bf; margin: 0;">ANTHARANGAM</h2>
                    <p style="color: #94a3b8; font-size: 12px; letter-spacing: 2px;">THREAT INTELLIGENCE PLATFORM</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #1e293b; margin-top: 0;">API Access Granted</h3>
                    <p style="color: #475569; line-height: 1.6;">
                        A new API key has been generated for your account. This key enables programmatic access to the Antharangam Threat Analysis Engine.
                    </p>
                    
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Key Name</p>
                        <p style="margin: 5px 0 0; color: #1e293b; font-weight: bold;">${keyData.name}</p>
                    </div>

                    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; border: 1px dashed #94a3b8; word-break: break-all;">
                        <p style="margin: 0; font-size: 12px; color: #64748b; margin-bottom: 5px;">YOUR SECRET KEY (One-time view)</p>
                        <code style="font-size: 14px; color: #0f172a; display: block;">${fullKey}</code>
                    </div>

                    <div style="margin-top: 20px; display: flex; gap: 20px;">
                        <div style="flex: 1;">
                            <p style="font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 4px;">EXPIRATION</p>
                            <p style="margin: 0; color: #334155; font-size: 14px;">
                                ${keyData.expiresAt ? new Date(keyData.expiresAt).toLocaleDateString() : 'Never'}
                            </p>
                        </div>
                        <div style="flex: 1;">
                            <p style="font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 4px;">QUOTA</p>
                            <p style="margin: 0; color: #334155; font-size: 14px;">
                                ${keyData.quota ? keyData.quota + ' req/day' : 'Unlimited'}
                            </p>
                        </div>
                    </div>

                    <p style="color: #ef4444; font-size: 12px; margin-top: 30px;">
                        <strong>Security Warning:</strong> Do not share this key. If you suspect it has been compromised, revoke it immediately from your dashboard settings.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} Antharangam Intelligence. All rights reserved.
                </div>
            </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        return null;
    }
};
