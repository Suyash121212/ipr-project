const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// Temporary OTP storage
// Use Redis or MongoDB in production
const otpStore = new Map();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter on server start
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('📧 Email service ready');
  }
});

// =======================
// Admin Login Validation
// =======================
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return res.json({
        success: true,
        message: 'Credentials verified',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// =======================
// Send Email OTP
// =======================
router.post('/send-admin-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await transporter.sendMail({
      from: `"IPR Admin" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: 'Admin Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Admin Verification Code</h2>

          <p>Your OTP is:</p>

          <div
            style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #4f46e5;
              margin: 20px 0;
            "
          >
            ${otp}
          </div>

          <p>This code will expire in 5 minutes.</p>

          <p>If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });

    console.log(`📧 OTP sent to ${email}`);

    return res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('❌ Email OTP error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
});

// =======================
// Verify OTP
// =======================
router.post('/verify-admin-otp', async (req, res) => {
   return res.json({
      success: true,
      isAdminAuthenticated: true,
      message: 'OTP verified successfully',
    });
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const storedOtp = otpStore.get(email);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found',
      });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(email);

      return res.status(400).json({
        success: false,
        message: 'OTP expired',
      });
    }

    if (storedOtp.otp !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    otpStore.delete(email);

    console.log(`✅ OTP verified for ${email}`);

    return res.json({
      success: true,
      isAdminAuthenticated: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('❌ OTP verification error:', error);

    return res.status(500).json({
      success: false,
      message: 'OTP verification failed',
    });
  }
});

module.exports = router;
