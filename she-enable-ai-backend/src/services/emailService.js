const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const HAS_SENDGRID = !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.'));

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!HAS_SENDGRID) {
      console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }
    await sgMail.send({
      to,
      from: { email: process.env.FROM_EMAIL || 'noreply@sheenableai.com', name: process.env.FROM_NAME || 'SheEnableAI' },
      subject,
      html,
    });
  } catch (err) {
    // Never crash the app due to email failure
    console.warn('[Email Error]', err.message);
  }
};

// ─── OTP EMAIL ────────────────────────────────────────────────────────────────
const sendOTPEmail = async (email, firstName, otp) => {
  console.log(`[OTP] ${email} => ${otp}`);
  await sendEmail({
    to: email,
    subject: 'Your SheEnableAI verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#534AB7">Welcome to SheEnableAI, ${firstName}!</h2>
        <p>Use this code to verify your email address:</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#534AB7;margin:24px 0;text-align:center">${otp}</div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#888;font-size:12px">If you didn't request this, please ignore this email.</p>
      </div>`,
  });
};

// ─── WELCOME EMAIL ────────────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, firstName, role) => {
  const roleLabel = role === 'CANDIDATE' ? 'job seeker' : 'employer';
  await sendEmail({
    to: email,
    subject: 'Welcome to SheEnableAI 🎉',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#534AB7">You're in, ${firstName}!</h2>
        <p>Welcome to SheEnableAI — the AI-powered hiring platform for women.</p>
        <p>Your account as a <strong>${roleLabel}</strong> is now verified and ready to use.</p>
        <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#534AB7;color:#fff;border-radius:8px;text-decoration:none">
          Get Started
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px">SheEnableAI — Empowering women in tech and beyond.</p>
      </div>`,
  });
};

// ─── PASSWORD RESET EMAIL ─────────────────────────────────────────────────────
const sendPasswordResetEmail = async (email, resetLink) => {
  await sendEmail({
    to: email,
    subject: 'Reset your SheEnableAI password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#534AB7">Password Reset</h2>
        <p>You requested a password reset for your SheEnableAI account.</p>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetLink}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#534AB7;color:#fff;border-radius:8px;text-decoration:none">
          Reset Password
        </a>
        <p style="margin-top:16px;font-size:12px;color:#666">Or copy this link into your browser:<br>${resetLink}</p>
        <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request a reset, you can safely ignore this email.</p>
      </div>`,
  });
};

// ─── APPLICATION STATUS EMAIL ─────────────────────────────────────────────────
const sendApplicationStatusEmail = async (email, firstName, jobTitle, status, rejectionReason = '') => {
  const content = {
    SCREENING: {
      subject: `Application update: ${jobTitle}`,
      html: `<p>Hi ${firstName}, your application for <strong>${jobTitle}</strong> is being reviewed. We'll be in touch soon!</p>`,
    },
    INTERVIEW: {
      subject: `Interview invitation: ${jobTitle}`,
      html: `<p>Hi ${firstName}, great news! You've been shortlisted for an interview for <strong>${jobTitle}</strong>. Check your dashboard for details.</p>`,
    },
    OFFERED: {
      subject: `Job Offer: ${jobTitle} 🎉`,
      html: `<p>Hi ${firstName}, congratulations! You've received a job offer for <strong>${jobTitle}</strong>. Log into SheEnableAI to view the offer details.</p>`,
    },
    REJECTED: {
      subject: `Application update: ${jobTitle}`,
      html: `<p>Hi ${firstName}, thank you for applying to <strong>${jobTitle}</strong>. After careful consideration, we won't be moving forward at this time.${rejectionReason ? ` Feedback: ${rejectionReason}` : ''}</p><p>Keep applying — the right opportunity is out there!</p>`,
    },
  };
  const c = content[status];
  if (!c) return;
  await sendEmail({ to: email, subject: c.subject, html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">${c.html}</div>` });
};

// ─── INTERVIEW SCHEDULED EMAIL ────────────────────────────────────────────────
const sendInterviewScheduledEmail = async (email, firstName, jobTitle, scheduledAt, type, meetingLink) => {
  const typeLabel = { PHONE: 'Phone Call', VIDEO: 'Video Interview', IN_PERSON: 'In-Person' }[type] || type;
  const dateStr = new Date(scheduledAt).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  await sendEmail({
    to: email,
    subject: `Interview scheduled: ${jobTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#534AB7">Interview Scheduled!</h2>
        <p>Hi ${firstName}, your interview for <strong>${jobTitle}</strong> has been scheduled.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;font-weight:bold;width:40%">Date & Time:</td><td style="padding:8px">${dateStr}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Type:</td><td style="padding:8px">${typeLabel}</td></tr>
          ${meetingLink ? `<tr><td style="padding:8px;font-weight:bold">Link:</td><td style="padding:8px"><a href="${meetingLink}">${meetingLink}</a></td></tr>` : ''}
        </table>
        <p>Log into your SheEnableAI dashboard for full details.</p>
      </div>`,
  });
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendApplicationStatusEmail,
  sendInterviewScheduledEmail,
};
