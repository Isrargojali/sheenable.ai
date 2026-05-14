const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Production: Use SendGrid if API key is configured
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: options.to,
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        subject: options.subject,
        html: options.html,
      };
      await sgMail.send(msg);
      console.log(`✅ Email sent to ${options.to} via SendGrid`);
      return;
    }

    // Development: Log to console if no email service configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`\n📧 [DEV MODE] Email would be sent to: ${options.to}`);
      console.log(`📝 Subject: ${options.subject}`);
      console.log(`📄 Body preview: ${options.html.substring(0, 100)}...`);
      console.log(`💡 Set SENDGRID_API_KEY for production or EMAIL_USER/EMAIL_PASS for real emails\n`);
      return;
    }

    // Fallback: Use Nodemailer with configured SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`✅ Email sent: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${options.to}:`, error.message);
    throw error;
  }
};

const sendOtpEmail = async (to, firstName, otp) => {
  const subject = 'Your SheEnableAI Verification Code';
  const html = `
    <h1>Welcome to SheEnableAI, ${firstName}!</h1>
    <p>Your verification code is: <strong>${otp}</strong></p>
    <p>This code will expire in 10 minutes.</p>
  `;
  await sendEmail({ to, subject, html });
};

const sendWelcomeEmail = async (to, firstName, role) => {
  const subject = 'Welcome to SheEnableAI!';
  const html = `
    <h1>Welcome aboard, ${firstName}!</h1>
    <p>Your account as a <strong>${role}</strong> has been successfully verified.</p>
    <p>We are excited to have you on the platform.</p>
  `;
  await sendEmail({ to, subject, html });
};

const sendPasswordResetEmail = async (to, resetLink) => {
  const subject = 'SheEnableAI Password Reset';
  const html = `
    <h1>Password Reset Request</h1>
    <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
    <a href="${resetLink}">Reset Password</a>
  `;
  await sendEmail({ to, subject, html });
};

const sendApplicationStatusEmail = async (to, firstName, jobTitle, status) => {
  const subject = `Update on your application for ${jobTitle}`;
  const html = `
    <h1>Hello ${firstName},</h1>
    <p>Your application for <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong>.</p>
    <p>Log in to your dashboard for more details.</p>
  `;
  await sendEmail({ to, subject, html });
};

const sendInterviewEmail = async (to, firstName, jobTitle, date, type, meetingLink) => {
  const subject = `Interview Scheduled: ${jobTitle}`;
  let html = `
    <h1>Hello ${firstName},</h1>
    <p>An interview has been scheduled for your application to <strong>${jobTitle}</strong>.</p>
    <p><strong>Date & Time:</strong> ${new Date(date).toLocaleString()}</p>
    <p><strong>Type:</strong> ${type}</p>
  `;
  if (meetingLink) {
    html += `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>`;
  }
  await sendEmail({ to, subject, html });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendApplicationStatusEmail,
  sendInterviewEmail,
};
