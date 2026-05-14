const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// Email templates
const emailTemplates = {
  otp: (firstName, otp) => ({
    subject: 'Your SheEnableAI Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; color: white; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #667eea; text-align: center; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; font-family: monospace; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
          h1 { margin: 0; font-size: 24px; }
          p { margin: 10px 0; }
          .highlight { color: #667eea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SheEnableAI!</h1>
          </div>
          <div class="content">
            <p>Hi <span class="highlight">${firstName}</span>,</p>
            <p>Thank you for signing up for SheEnableAI! We're thrilled to have you on our platform.</p>
            <p>To verify your email address and activate your account, please use the verification code below:</p>
            <div class="otp-box">
              <p style="margin: 0; color: #999; font-size: 12px;">VERIFICATION CODE</p>
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>Code expiration:</strong> This code will expire in <span class="highlight">10 minutes</span>.</p>
            <p>If you didn't sign up for this account, please ignore this email.</p>
            <div class="footer">
              <p>For security reasons, never share this code with anyone.</p>
              <p>&copy; 2024 SheEnableAI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  welcome: (firstName, role) => {
    const dashboardUrl = role === 'CANDIDATE' 
      ? `${process.env.FRONTEND_URL}/candidate/dashboard`
      : role === 'EMPLOYER'
      ? `${process.env.FRONTEND_URL}/employer/dashboard`
      : `${process.env.FRONTEND_URL}/home`;
    
    return {
      subject: 'Welcome to SheEnableAI - Your Account is Active!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; color: white; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .highlight { color: #667eea; font-weight: bold; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
            .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
            h1 { margin: 0; font-size: 24px; }
            p { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Verified Successfully! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi <span class="highlight">${firstName}</span>,</p>
              <p>Congratulations! Your SheEnableAI account has been verified and is now active.</p>
              <p>You're registered as a <span class="highlight">${role === 'CANDIDATE' ? 'Job Seeker' : role === 'EMPLOYER' ? 'Employer' : 'Administrator'}</span>.</p>
              <p><strong>What's next?</strong></p>
              <ul>
                <li>${role === 'CANDIDATE' ? 'Complete your profile to attract top employers' : 'Create your first job posting to attract qualified candidates'}</li>
                <li>Explore available opportunities on the platform</li>
                <li>Connect with our community</li>
              </ul>
              <center><a href="${dashboardUrl}" class="button">Go to Dashboard</a></center>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <div class="footer">
                <p>&copy; 2024 SheEnableAI. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  passwordReset: (resetLink) => ({
    subject: 'SheEnableAI - Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; color: white; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
          h1 { margin: 0; font-size: 24px; }
          p { margin: 10px 0; }
          .highlight { color: #667eea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your SheEnableAI password.</p>
            <p>Click the button below to create a new password. <span class="highlight">This link will expire in 1 hour.</span></p>
            <center><a href="${resetLink}" class="button">Reset Password</a></center>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-size: 12px;">${resetLink}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </div>
            <div class="footer">
              <p>&copy; 2024 SheEnableAI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Enhanced email sending with retry logic
const sendEmail = async (options, retries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
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

      // Development/Test: Log to console if no email service configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`\n📧 [DEV MODE] Email would be sent to: ${options.to}`);
        console.log(`📝 Subject: ${options.subject}`);
        console.log(`💡 Configure SENDGRID_API_KEY for production or EMAIL_USER/EMAIL_PASS for real emails\n`);
        return;
      }

      // Use Nodemailer with configured SMTP
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

      console.log(`✅ Email sent successfully to ${options.to} (MessageID: ${info.messageId})`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️  Email send attempt ${attempt}/${retries} failed for ${options.to}: ${error.message}`);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }
  
  console.error(`❌ Failed to send email to ${options.to} after ${retries} attempts`);
  throw new Error(`Email delivery failed: ${lastError.message}`);
};

const sendOtpEmail = async (to, firstName, otp) => {
  const template = emailTemplates.otp(firstName, otp);
  await sendEmail({ to, ...template });
};

const sendWelcomeEmail = async (to, firstName, role) => {
  const template = emailTemplates.welcome(firstName, role);
  await sendEmail({ to, ...template });
};

const sendPasswordResetEmail = async (to, resetLink) => {
  const template = emailTemplates.passwordReset(resetLink);
  await sendEmail({ to, ...template });
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
