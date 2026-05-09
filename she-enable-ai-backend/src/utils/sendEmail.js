const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sheenableai.com',
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.email}`);
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    throw error;
  }
};

const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>SheEnableAI - OTP Verification</h2>
      <p>Your OTP code is:</p>
      <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
      <p>This code expires in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Your OTP Code',
    html,
  });
};

const sendWelcomeEmail = async (email, name, role) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome to SheEnableAI, ${name}!</h2>
      <p>Your account has been successfully created as a <strong>${role}</strong>.</p>
      <p>You can now log in and start using our platform.</p>
      <a href="${process.env.FRONTEND_URL}/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Log In Now</a>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Welcome to SheEnableAI',
    html,
  });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
};
