const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }
  await sgMail.send({ to, from: { email: process.env.FROM_EMAIL, name: process.env.FROM_NAME }, subject, html });
};

const sendOTPEmail = async (email, firstName, otp) => {
  console.log(`[OTP] ${email} => ${otp}`);
  await sendEmail({
    to: email,
    subject: 'Verify your SheEnableAI account',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2>Welcome to SheEnableAI, ${firstName}!</h2><p>Your verification code is:</p><div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#534AB7;margin:20px 0">${otp}</div><p>This code expires in <strong>10 minutes</strong>.</p></div>`,
  });
};

const sendApplicationStatusEmail = async (email, firstName, jobTitle, status, rejectionReason = '') => {
  const content = {
    SCREENING: { subject: `Application update: ${jobTitle}`, html: `<p>Hi ${firstName}, your application for <strong>${jobTitle}</strong> is being reviewed.</p>` },
    INTERVIEW: { subject: `Interview invitation: ${jobTitle}`, html: `<p>Hi ${firstName}, you have been shortlisted for an interview for <strong>${jobTitle}</strong>!</p>` },
    OFFERED: { subject: `Job Offer: ${jobTitle}`, html: `<p>Hi ${firstName}, congratulations! You have received a job offer for <strong>${jobTitle}</strong>.</p>` },
    REJECTED: { subject: `Application update: ${jobTitle}`, html: `<p>Hi ${firstName}, thank you for applying to <strong>${jobTitle}</strong>. Unfortunately we won't be moving forward. ${rejectionReason ? `Feedback: ${rejectionReason}` : ''}</p>` },
  };
  const c = content[status];
  if (!c) return;
  await sendEmail({ to: email, subject: c.subject, html: c.html });
};

module.exports = { sendOTPEmail, sendApplicationStatusEmail };
