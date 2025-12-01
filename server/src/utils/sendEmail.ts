import nodemailer from 'nodemailer';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
    html?: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
    // Create reusable transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // Send mail with defined transport object
    const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || options.message
    };

    await transporter.sendMail(mailOptions);
};

export const sendOTPEmail = async (email: string, otp: string, purpose: 'signup' | 'login'): Promise<void> => {
    const subject = purpose === 'signup'
        ? 'Verify Your Email - Bloodline'
        : 'Login Verification Code - Bloodline';

    const message = `Your OTP code is: ${otp}\n\nThis code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.\n\nIf you didn't request this code, please ignore this email.`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                }
                .content {
                    padding: 40px 30px;
                }
                .otp-box {
                    background-color: #f9fafb;
                    border: 2px dashed #dc2626;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }
                .otp-code {
                    font-size: 36px;
                    font-weight: bold;
                    color: #dc2626;
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                }
                .message {
                    color: #374151;
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 20px 0;
                }
                .footer {
                    background-color: #f9fafb;
                    padding: 20px 30px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                    border-top: 1px solid #e5e7eb;
                }
                .warning {
                    color: #dc2626;
                    font-size: 14px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🩸 Bloodline</h1>
                </div>
                <div class="content">
                    <p class="message">
                        ${purpose === 'signup' ? 'Welcome to Bloodline!' : 'Welcome back!'}<br/>
                        Please use the following OTP code to ${purpose === 'signup' ? 'complete your registration' : 'verify your login'}:
                    </p>
                    <div class="otp-box">
                        <div class="otp-code">${otp}</div>
                    </div>
                    <p class="message">
                        This code will expire in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.
                    </p>
                    <p class="warning">
                        ⚠️ If you didn't request this code, please ignore this email or contact our support team.
                    </p>
                </div>
                <div class="footer">
                    <p>© 2026 Bloodline. All rights reserved.</p>
                    <p>Saving lives, one donation at a time.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        email,
        subject,
        message,
        html
    });
};

export const sendUrgentRequestEmail = async (
    email: string,
    details: {
        bloodType: string;
        units: number;
        patientName?: string;
        hospitalName?: string;
        urgency: string;
        aiReasoning?: string;
        description: string;
    }
): Promise<void> => {
    const subject = `🚨 URGENT: ${details.bloodType} Blood Required - Bloodline`;

    const message = `URGENT BLOOD REQUEST\n\nBlood Type: ${details.bloodType}\nUnits: ${details.units}\nPatient: ${details.patientName || 'N/A'}\nHospital: ${details.hospitalName || 'N/A'}\nUrgency: ${details.urgency}\n\nAI Assessment: ${details.aiReasoning || 'N/A'}\n\nDescription: ${details.description}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; padding: 40px 20px; text-align: center; }
                .urgency-badge { display: inline-block; padding: 6px 16px; background: rgba(255,255,255,0.2); border-radius: 100px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; }
                .content { padding: 40px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
                .info-item { background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                .info-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                .info-value { font-size: 18px; font-weight: 800; color: #0f172a; }
                .ai-box { background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 20px; margin-top: 20px; }
                .ai-title { font-size: 12px; font-weight: 800; color: #dc2626; display: flex; align-items: center; gap: 8px; margin-bottom: 8px; text-transform: uppercase; }
                .ai-text { font-size: 14px; font-weight: 500; color: #991b1b; line-height: 1.5; font-style: italic; }
                .desc-box { margin-top: 30px; border-top: 1px solid #f1f5f9; pt: 30px; }
                .desc-title { font-size: 12px; font-weight: 800; color: #475569; margin-bottom: 12px; text-transform: uppercase; }
                .desc-text { font-size: 15px; line-height: 1.6; color: #334155; }
                .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9; }
                .footer p { margin: 0; font-size: 12px; color: #94a3b8; font-weight: 600; }
                .highlight { color: #ef4444; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="urgency-badge">⚠️ Critical Lifeline Alert</div>
                    <h1>Urgent Blood Request</h1>
                </div>
                <div class="content">
                    <p style="font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 30px;">
                        A patient requires immediate assistance. Your donation can save a life.
                    </p>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Blood Required</div>
                            <div class="info-value highlight">${details.bloodType}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Units Needed</div>
                            <div class="info-value">${details.units}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Patient Name</div>
                            <div class="info-value">${details.patientName || 'Undisclosed'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Current Urgency</div>
                            <div class="info-value highlight">${details.urgency}</div>
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 20px; border-radius:12px; text-align: center; border: 1px solid #e2e8f0;">
                        <div class="info-label" style="text-align: center;">Medical Facility</div>
                        <div class="info-value" style="font-size: 20px;">${details.hospitalName || 'Local Facility'}</div>
                    </div>

                    ${details.aiReasoning ? `
                    <div class="ai-box">
                        <div class="ai-title">🤖 AI Clinical Assessment</div>
                        <div class="ai-text">"${details.aiReasoning}"</div>
                    </div>
                    ` : ''}

                    <div class="desc-box" style="padding-top: 30px;">
                        <div class="desc-title">Request Context</div>
                        <div class="desc-text">${details.description}</div>
                    </div>

                    <div style="margin-top: 40px; text-align: center;">
                        <p style="font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 20px;">Available to help? Login to the dashboard to coordinate.</p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                           style="display: inline-block; padding: 18px 40px; background: #0f172a; color: white; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                           Coordinate Donation
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>© 2026 Bloodline Platform. Ensuring Every Drop Counts.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        email,
        subject,
        message,
        html
    });
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string): Promise<void> => {
    const subject = 'Password Reset Request - Bloodline';

    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process: \n\n ${resetUrl}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #1f2937; }
                .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #f3f4f6; }
                .header { background: #dc2626; color: white; padding: 40px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
                .content { padding: 40px; text-align: center; }
                .icon { font-size: 48px; margin-bottom: 20px; }
                .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px; }
                .text { font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px; }
                .btn { display: inline-block; padding: 16px 36px; background-color: #dc2626; color: white !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2); }
                .link-box { margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 10px; font-size: 12px; word-break: break-all; color: #6b7280; }
                .footer { padding: 30px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🩸 Bloodline</h1>
                </div>
                <div class="content">
                    <div class="icon">🔒</div>
                    <div class="title">Password Reset Request</div>
                    <p class="text">
                        We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
                    </p>
                    <a href="${resetUrl}" class="btn">Reset My Password</a>
                    <p class="text" style="margin-top: 30px; font-size: 14px;">
                        This link will expire in 10 minutes for your security.
                    </p>
                    <div class="link-box">
                        Button not working? Copy and paste this link:<br/>
                        ${resetUrl}
                    </div>
                </div>
                <div class="footer">
                    <p>© 2026 Bloodline Platform. Secure. Verified. Transparent.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        email,
        subject,
        message,
        html
    });
};

export default sendEmail;
